-- =============================================================================
-- INIT-DB.SQL – HADRATECH-GPI
-- Initialisation de la base : extensions, schémas, rôles, fonctions JWT
-- Exécuté automatiquement par docker-entrypoint-initdb.d/
-- =============================================================================
-- Compatible Supabase Cloud (schémas protégés) et Self-Hosted
-- =============================================================================

-- ============================
-- 1. EXTENSIONS (schéma public)
-- ============================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- ============================
-- 2. SCHÉMAS (configurables)
-- ============================
DO $$
DECLARE
    schema_config TEXT := current_setting('app.schemas', true);
    schema_list TEXT[];
    schema_name TEXT;
BEGIN
    IF schema_config IS NULL OR schema_config = '' THEN
        schema_list := ARRAY['public', 'btp', 'auth'];
    ELSE
        schema_list := string_to_array(schema_config, ',');
    END IF;

    FOREACH schema_name IN ARRAY schema_list
    LOOP
        IF schema_name IN ('auth', 'storage', 'graphql', 'graphql_public') THEN
            RAISE NOTICE '⏭️ Schéma % ignoré (géré par Supabase)', schema_name;
        ELSE
            EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
            RAISE NOTICE '✅ Schéma créé : %', schema_name;
        END IF;
    END LOOP;
END $$;

-- ============================
-- 3. ENUM TYPES
-- ============================
DO $$
DECLARE
    main_schema TEXT := current_setting('app.schema', true);
    type_exists BOOLEAN;
BEGIN
    IF main_schema IS NULL OR main_schema = '' THEN
        main_schema := 'public';
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = main_schema
          AND t.typname = 'user_role'
    ) INTO type_exists;

    IF NOT type_exists THEN
        EXECUTE format('
            CREATE TYPE %I.user_role AS ENUM (
                ''admin'', ''manager'', ''director'', ''agent'', ''supplier'', ''user''
            )
        ', main_schema);
        RAISE NOTICE '✅ Type % créé', main_schema || '.user_role';
    ELSE
        RAISE NOTICE '⏭️ Type % existe déjà', main_schema || '.user_role';
    END IF;
END $$;

-- ============================
-- 4. RÔLES POSTGRESQL
-- ============================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_anon') THEN
        CREATE ROLE web_anon NOLOGIN;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'btp_user') THEN
        CREATE ROLE btp_user NOLOGIN;
    END IF;

    -- authenticator: role applicatif (la sécurité Supabase moderne se base surtout sur auth+RLS)
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'authenticator';
    END IF;
END $$;

GRANT web_anon TO authenticator;
GRANT btp_user TO authenticator;

-- Permissions sur tous les schémas configurés (sauf ceux protégés par Supabase)
DO $$
DECLARE
    schema_config TEXT := current_setting('app.schemas', true);
    schema_list TEXT[];
    schema_name TEXT;
BEGIN
    IF schema_config IS NULL OR schema_config = '' THEN
        schema_list := ARRAY['public', 'btp'];
    ELSE
        schema_list := string_to_array(schema_config, ',');
    END IF;

    FOREACH schema_name IN ARRAY schema_list
    LOOP
        IF schema_name IS NOT NULL
           AND schema_name != ''
           AND schema_name NOT IN ('auth', 'storage', 'graphql', 'graphql_public')
        THEN
            EXECUTE format('GRANT USAGE ON SCHEMA %I TO web_anon', schema_name);
            EXECUTE format('GRANT USAGE ON SCHEMA %I TO btp_user', schema_name);
            RAISE NOTICE '✅ Permissions accordées sur le schéma : %', schema_name;
        END IF;
    END LOOP;
END $$;

-- ============================
-- 5. HELPERS JWT (SÉCURISÉS) - EN PUBLIC
-- ============================
-- IMPORTANT: on NE crée PAS de fonctions dans le schéma auth.
-- Supabase fournit déjà auth.uid()/auth.role() pour les policies.
-- Ici on fournit un fallback en public, pour que ton script puisse s'exécuter
-- même si auth.* n'est pas disponible au moment du run.

CREATE OR REPLACE FUNCTION public.jwt() RETURNS jsonb
LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN current_setting('request.jwt.claims', true)::jsonb;
EXCEPTION
    WHEN others THEN
        RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.uid() RETURNS uuid
LANGUAGE plpgsql STABLE AS $$
DECLARE
    jwt_data jsonb;
BEGIN
    jwt_data := public.jwt();
    IF jwt_data IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN (jwt_data ->> 'sub')::uuid;
EXCEPTION
    WHEN others THEN
        RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.role() RETURNS text
LANGUAGE plpgsql STABLE AS $$
DECLARE
    jwt_data jsonb;
BEGIN
    jwt_data := public.jwt();
    IF jwt_data IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN jwt_data ->> 'role';
EXCEPTION
    WHEN others THEN
        RETURN NULL;
END;
$$;

-- ============================
-- 6. TRIGGER FUNCTION (update_timestamp)
-- ============================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================
-- 7. TABLE PROFILES
-- ============================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL,
    full_name TEXT NULL,
    phone TEXT NULL,
    national_id TEXT NULL,
    avatar_url TEXT NULL,
    created_at TIMESTAMPTZ NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NULL DEFAULT NOW(),
    role public.user_role NULL,
    is_admin BOOLEAN NULL DEFAULT false,
    status VARCHAR(20) NULL DEFAULT 'pending_verification',
    auth_provider TEXT NULL DEFAULT 'supabase',
    provider_id TEXT NULL,
    provider_data JSONB NULL,
    station_id UUID NULL,
    depot_id UUID NULL,
    brand_id UUID NULL,
    region TEXT NULL,
    department TEXT NULL,

    CONSTRAINT profiles_pkey PRIMARY KEY (id),

    -- FK vers auth.users (peut nécessiter des privilèges côté role SQL Editor)
    CONSTRAINT profiles_id_fkey
        FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,

    CONSTRAINT check_profiles_status CHECK (
        status IN ('active', 'inactive', 'suspended', 'pending_verification')
    )
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_profiles_station_id ON public.profiles(station_id);
CREATE INDEX IF NOT EXISTS idx_profiles_depot_id ON public.profiles(depot_id);
CREATE INDEX IF NOT EXISTS idx_profiles_brand_id ON public.profiles(brand_id);
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON public.profiles(auth_provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

CREATE TRIGGER set_timestamp_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ============================
-- 8. TABLE USER ROLES
-- ============================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_name TEXT NOT NULL,
    assigned_at TIMESTAMPTZ NULL DEFAULT NOW(),
    assigned_by UUID NULL,
    expires_at TIMESTAMPTZ NULL,
    status VARCHAR(20) NULL DEFAULT 'active',

    CONSTRAINT user_roles_pkey PRIMARY KEY (id),

    CONSTRAINT user_roles_user_id_role_name_key UNIQUE (user_id, role_name),

    -- FK vers auth.users
    CONSTRAINT user_roles_assigned_by_fkey
        FOREIGN KEY (assigned_by) REFERENCES auth.users(id),

    CONSTRAINT user_roles_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,

    CONSTRAINT check_user_roles_status CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),

    CONSTRAINT valid_role_name CHECK (
        role_name IN (
            'public', 'petitionnaire', 'gerant', 'depot_manager', 'brand_manager',
            'agent_dgp', 'agent_cnh', 'inspector_hse', 'chef_service_dgp', 'chef_service_cnh',
            'directeur_dgp', 'directeur_cnh', 'ministre', 'admin', 'super_admin',
            'agent', 'manager', 'director', 'project', 'project_manager',
            'project_project', 'supplier', 'engineering_consultant'
        )
    )
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON public.user_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON public.user_roles(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_status ON public.user_roles(status);

-- ============================
-- 9. POLITIQUES RLS (Profiles)
-- ============================
DO $$
DECLARE
    use_auth_ctx BOOLEAN := true;
BEGIN
    BEGIN
        PERFORM auth.uid();
    EXCEPTION
        WHEN others THEN
            use_auth_ctx := false;
    END;

    IF use_auth_ctx THEN
        DROP POLICY IF EXISTS select_own_profile ON public.profiles;
        CREATE POLICY select_own_profile ON public.profiles
            FOR SELECT TO public
            USING (
                id = auth.uid()
                OR auth.role() IN ('admin', 'director', 'manager')
            );

        DROP POLICY IF EXISTS manage_profiles_admin ON public.profiles;
        CREATE POLICY manage_profiles_admin ON public.profiles
            FOR ALL TO public
            USING (auth.role() IN ('admin', 'director'))
            WITH CHECK (auth.role() IN ('admin', 'director'));
    ELSE
        DROP POLICY IF EXISTS select_own_profile ON public.profiles;
        CREATE POLICY select_own_profile ON public.profiles
            FOR SELECT TO public
            USING (
                id = public.uid()
                OR public.role() IN ('admin', 'director', 'manager')
            );

        DROP POLICY IF EXISTS manage_profiles_admin ON public.profiles;
        CREATE POLICY manage_profiles_admin ON public.profiles
            FOR ALL TO public
            USING (public.role() IN ('admin', 'director'))
            WITH CHECK (public.role() IN ('admin', 'director'));
    END IF;

    RAISE NOTICE '✅ Politiques RLS créées pour profiles';
END $$;

-- ============================
-- 10. POLITIQUES RLS (User Roles)
-- ============================
DO $$
DECLARE
    use_auth_ctx BOOLEAN := true;
BEGIN
    BEGIN
        PERFORM auth.uid();
    EXCEPTION
        WHEN others THEN
            use_auth_ctx := false;
    END;

    IF use_auth_ctx THEN
        DROP POLICY IF EXISTS select_own_user_roles ON public.user_roles;
        CREATE POLICY select_own_user_roles ON public.user_roles
            FOR SELECT TO public
            USING (
                user_id = auth.uid()
                OR auth.role() IN ('admin', 'director', 'manager')
            );

        DROP POLICY IF EXISTS manage_roles_admin ON public.user_roles;
        CREATE POLICY manage_roles_admin ON public.user_roles
            FOR ALL TO public
            USING (auth.role() IN ('admin', 'director'))
            WITH CHECK (auth.role() IN ('admin', 'director'));
    ELSE
        DROP POLICY IF EXISTS select_own_user_roles ON public.user_roles;
        CREATE POLICY select_own_user_roles ON public.user_roles
            FOR SELECT TO public
            USING (
                user_id = public.uid()
                OR public.role() IN ('admin', 'director', 'manager')
            );

        DROP POLICY IF EXISTS manage_roles_admin ON public.user_roles;
        CREATE POLICY manage_roles_admin ON public.user_roles
            FOR ALL TO public
            USING (public.role() IN ('admin', 'director'))
            WITH CHECK (public.role() IN ('admin', 'director'));
    END IF;

    RAISE NOTICE '✅ Politiques RLS créées pour user_roles';
END $$;

-- ============================
-- 11. VALIDATION FINALE
-- ============================
DO $$
DECLARE
    main_schema TEXT := current_setting('app.schema', true);
    schema_config TEXT := current_setting('app.schemas', true);
BEGIN
    IF main_schema IS NULL OR main_schema = '' THEN
        main_schema := 'public';
    END IF;

    IF schema_config IS NULL OR schema_config = '' THEN
        schema_config := 'public,btp,auth';
    END IF;

    RAISE NOTICE '✅ Base initialisée. Schéma principal : %, Schémas configurés : %', main_schema, schema_config;
    RAISE NOTICE '✅ Tables profiles et user_roles créées.';
    RAISE NOTICE '✅ Prête pour les migrations.';
END $$;