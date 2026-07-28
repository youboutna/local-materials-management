-- =============================================================================
-- MIGRATION: fix_oauth_providers
-- Description: OAuth provider support (schéma public)
-- =============================================================================

-- 1. Ajouter les colonnes OAuth à public.profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'supabase',
ADD COLUMN IF NOT EXISTS provider_id TEXT,
ADD COLUMN IF NOT EXISTS provider_data JSONB;

CREATE INDEX IF NOT EXISTS idx_profiles_provider ON public.profiles(auth_provider, provider_id);

-- 2. Table oauth_providers (dans public, pas btp)
CREATE TABLE IF NOT EXISTS public.oauth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_name TEXT NOT NULL UNIQUE,
    client_id TEXT,
    client_secret TEXT,
    auth_url TEXT,
    token_url TEXT,
    user_info_url TEXT,
    scopes TEXT[],
    enabled BOOLEAN DEFAULT false,
    configuration JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.oauth_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage OAuth providers" 
ON public.oauth_providers 
FOR ALL 
USING (auth.role() IN ('admin', 'director'));

-- 3. Table auth_sessions (dans public)
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'supabase',
    provider_session_id TEXT,
    expires_at TIMESTAMPTZ,
    refresh_token TEXT,
    access_token TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own sessions" 
ON public.auth_sessions 
FOR ALL 
USING (user_id = auth.uid());

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_oauth_providers_provider_name ON public.oauth_providers(provider_name);
CREATE INDEX IF NOT EXISTS idx_oauth_providers_enabled ON public.oauth_providers(enabled);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON public.auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_provider ON public.auth_sessions(provider);

-- 5. Triggers updated_at
CREATE TRIGGER set_timestamp_oauth_providers
    BEFORE UPDATE ON public.oauth_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER set_timestamp_auth_sessions
    BEFORE UPDATE ON public.auth_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 6. Données par défaut (désactivées par défaut)
INSERT INTO public.oauth_providers (provider_name, auth_url, token_url, user_info_url, scopes, enabled, configuration)
VALUES 
    ('google', 
     'https://accounts.google.com/o/oauth2/auth',
     'https://oauth2.googleapis.com/token',
     'https://www.googleapis.com/oauth2/v2/userinfo',
     ARRAY['openid', 'email', 'profile'],
     false,
     '{"consent_screen": true, "access_type": "offline"}'
    ),
    ('github',
     'https://github.com/login/oauth/authorize',
     'https://github.com/login/oauth/access_token',
     'https://api.github.com/user',
     ARRAY['user:email', 'read:user'],
     false,
     '{"allow_signup": true}'
    ),
    ('microsoft',
     'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
     'https://login.microsoftonline.com/common/oauth2/v2.0/token',
     'https://graph.microsoft.com/v1.0/me',
     ARRAY['openid', 'profile', 'email'],
     false,
     '{"tenant": "common"}'
    )
ON CONFLICT (provider_name) DO NOTHING;

-- 7. Permissions
GRANT SELECT ON public.oauth_providers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.oauth_providers TO authenticated;

GRANT SELECT ON public.auth_sessions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.auth_sessions TO authenticated;

-- 8. Commentaires
COMMENT ON TABLE public.oauth_providers IS 'Configuration des providers OAuth';
COMMENT ON TABLE public.auth_sessions IS 'Sessions OAuth multi-providers';
COMMENT ON COLUMN public.auth_sessions.provider IS 'Fournisseur OAuth (google, github, microsoft, etc.)';
COMMENT ON COLUMN public.oauth_providers.enabled IS 'Provider activé ou non';