-- Fix auth schema - step 2: Add OAuth provider support columns
-- Following PROMPTS.md hexagonal architecture rules

-- Add OAuth provider support to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'supabase',
ADD COLUMN IF NOT EXISTS provider_id TEXT,
ADD COLUMN IF NOT EXISTS provider_data JSONB;

-- Create index for provider lookups
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON public.profiles(auth_provider, provider_id);

-- Add OAuth provider configurations table
CREATE TABLE IF NOT EXISTS btp.oauth_providers (
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on oauth_providers
ALTER TABLE btp.oauth_providers ENABLE ROW LEVEL SECURITY;

-- Only admins can manage OAuth providers
CREATE POLICY "Admins can manage OAuth providers" 
ON btp.oauth_providers 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role_name IN ('admin', 'director')
));

-- Create auth sessions table for multi-provider session management
CREATE TABLE IF NOT EXISTS public.auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'supabase',
  provider_session_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  refresh_token TEXT,
  access_token TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on auth_sessions
ALTER TABLE public.auth_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY "Users can access their own sessions" 
ON public.auth_sessions 
FOR ALL 
USING (user_id = auth.uid());

-- Add trigger to auto-create profiles for OAuth users
CREATE OR REPLACE FUNCTION btp.handle_oauth_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile if it doesn't exist
  INSERT INTO public.profiles (
    id,
    full_name,
    avatar_url,
    auth_provider,
    provider_id,
    provider_data
  )
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'supabase'),
    NEW.raw_app_meta_data->>'provider_id',
    NEW.raw_user_meta_data
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    auth_provider = EXCLUDED.auth_provider,
    provider_id = EXCLUDED.provider_id,
    provider_data = EXCLUDED.provider_data,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Create trigger for new OAuth users
DROP TRIGGER IF EXISTS on_auth_user_created_oauth ON auth.users;
CREATE TRIGGER on_auth_user_created_oauth
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION btp.handle_oauth_user_profile();

-- Insert default OAuth provider configurations
INSERT INTO btp.oauth_providers (provider_name, auth_url, token_url, user_info_url, scopes, enabled, configuration)
VALUES 
  ('google', 
   'https://accounts.google.com/o/oauth2/auth',
   'https://oauth2.googleapis.com/token',
   'https://www.googleapis.com/oauth2/v2/userinfo',
   ARRAY['openid', 'email', 'profile'],
   false,
   '{"consent_screen": true, "access_type": "offline"}'::jsonb
  ),
  ('github',
   'https://github.com/login/oauth/authorize',
   'https://github.com/login/oauth/access_token',
   'https://api.github.com/user',
   ARRAY['user:email', 'read:user'],
   false,
   '{"allow_signup": true}'::jsonb
  ),
  ('microsoft',
   'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
   'https://login.microsoftonline.com/common/oauth2/v2.0/token',
   'https://graph.microsoft.com/v1.0/me',
   ARRAY['openid', 'profile', 'email'],
   false,
   '{"tenant": "common"}'::jsonb
  )
ON CONFLICT (provider_name) DO NOTHING;

-- Add triggers for updated_at
CREATE TRIGGER update_oauth_providers_updated_at
  BEFORE UPDATE ON btp.oauth_providers
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_updated_at_column();

CREATE TRIGGER update_auth_sessions_updated_at
  BEFORE UPDATE ON public.auth_sessions
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_updated_at_column();