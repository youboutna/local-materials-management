-- =============================================================================
-- MIGRATION: bootstrap_core_schema
-- Description: Socle minimal exécuté AVANT toutes les autres migrations.
--   - Crée le schéma `btp`
--   - Crée `public.user_roles` et `public.profiles`, référencés dès juin 2025 par
--     des policies/fonctions mais déclarés seulement en août 2025 (20250811130750).
--   Idempotent : mêmes définitions que la migration d'août (CREATE TABLE IF NOT EXISTS).
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS btp;
GRANT USAGE ON SCHEMA btp TO authenticated, service_role;

-- 1. Rôles utilisateurs (table séparée : jamais de rôle stocké sur profiles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_name TEXT NOT NULL,
    assigned_by UUID,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_name)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Profils
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    national_id TEXT,
    role TEXT DEFAULT 'user',
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can view their own profile') THEN
        CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Users can update their own profile') THEN
        CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
    END IF;
END
$$;

-- 3. Fonction utilitaire updated_at (utilisée par les triggers ultérieurs)
CREATE OR REPLACE FUNCTION btp.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = btp, public
AS $fn$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$fn$;
