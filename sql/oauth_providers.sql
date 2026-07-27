-- =============================================================================
-- oauth_providers – ÉTAPE 6 du plan de migration
-- Table de configuration des fournisseurs OAuth (schéma public)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.oauth_providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  enabled       BOOLEAN NOT NULL DEFAULT false,
  client_id     TEXT,
  redirect_uri  TEXT,
  scopes        TEXT[] NOT NULL DEFAULT '{}',
  icon_url      TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  config        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.oauth_providers TO anon;
GRANT SELECT ON public.oauth_providers TO authenticated;
GRANT ALL    ON public.oauth_providers TO service_role;

ALTER TABLE public.oauth_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "oauth_providers_public_read" ON public.oauth_providers;
CREATE POLICY "oauth_providers_public_read"
  ON public.oauth_providers FOR SELECT
  USING (enabled = true);

DROP POLICY IF EXISTS "oauth_providers_admin_manage" ON public.oauth_providers;
CREATE POLICY "oauth_providers_admin_manage"
  ON public.oauth_providers FOR ALL
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DROP TRIGGER IF EXISTS set_oauth_providers_updated_at ON public.oauth_providers;
CREATE TRIGGER set_oauth_providers_updated_at
  BEFORE UPDATE ON public.oauth_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Providers par défaut
INSERT INTO public.oauth_providers (provider_name, display_name, enabled, scopes, sort_order)
VALUES
  ('google', 'Google',  true,  ARRAY['openid','email','profile'], 1),
  ('github', 'GitHub',  false, ARRAY['read:user','user:email'],   2),
  ('azure',  'Microsoft', false, ARRAY['openid','email','profile'], 3)
ON CONFLICT (provider_name) DO NOTHING;
