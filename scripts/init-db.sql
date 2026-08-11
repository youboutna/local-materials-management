-- =============================================================================
-- INIT-DB.SQL – HADRATECH-GPI
-- Initialisation de la base : extensions, schémas, rôles, fonctions JWT
-- =============================================================================
-- Ce script détecte automatiquement l'environnement (Supabase Cloud ou self-hosted)
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
        IF schema_name = 'auth' THEN
            RAISE NOTICE '⏭️ Schéma auth ignoré (géré par Supabase)';
        ELSE
            EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
            RAISE NOTICE '✅ Schéma créé : %', schema_name;
        END IF;
    END LOOP;
END $$;

-- ============================
-- 3. ENUM TYPES (dans le schéma principal)
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
        SELECT 1 FROM pg_type t
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
-- 4. RÔLES POSTGRESQL (self-hosted uniquement)
-- ============================
DO $$
DECLARE
    schema_has_auth BOOLEAN;
BEGIN
    -- Vérifier si le schéma auth existe (Supabase Cloud n'a pas de schéma auth modifiable)
    SELECT EXISTS (
        SELECT 1 FROM pg_namespace WHERE nspname = 'auth'
    ) INTO schema_has_auth;

    -- Si le schéma auth n'existe pas, on est probablement en Supabase Cloud
    IF NOT schema_has_auth THEN
        RAISE NOTICE '⏭️ Schéma auth absent → mode Supabase Cloud détecté, rôles ignorés';
        RETURN;
    END IF;

    RAISE NOTICE '✅ Mode self-hosted détecté, création des rôles...';

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_anon') THEN
        CREATE ROLE web_anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'btp_user') THEN
        CREATE ROLE btp_user NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'authenticator';
    END IF;

    GRANT web_anon TO authenticator;
    GRANT btp_user TO authenticator;

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
            IF schema_name <> 'auth' THEN
                EXECUTE format('GRANT USAGE ON SCHEMA %I TO web_anon', schema_name);
                EXECUTE format('GRANT USAGE ON SCHEMA %I TO btp_user', schema_name);
                RAISE NOTICE '✅ Permissions accordées sur le schéma : %', schema_name;
            END IF;
        END LOOP;
    END;
END $$;

-- ============================
-- 5. FONCTIONS JWT (pour RLS)
-- ============================
DO $$
DECLARE
    schema_has_auth BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_namespace WHERE nspname = 'auth'
    ) INTO schema_has_auth;

    IF NOT schema_has_auth THEN
        RAISE NOTICE '⏭️ Schéma auth absent, fonctions JWT créées dans public';
        CREATE OR REPLACE FUNCTION public.jwt() RETURNS jsonb AS $$
            SELECT current_setting('request.jwt.claims')::jsonb;
        $$ LANGUAGE sql STABLE;

        CREATE OR REPLACE FUNCTION public.uid() RETURNS uuid AS $$
            SELECT (public.jwt() ->> 'sub')::uuid;
        $$ LANGUAGE sql STABLE;

        CREATE OR REPLACE FUNCTION public.role() RETURNS text AS $$
            SELECT public.jwt() ->> 'role';
        $$ LANGUAGE sql STABLE;
        RAISE NOTICE '✅ Fonctions JWT créées dans public';
        RETURN;
    END IF;

    RAISE NOTICE '✅ Schéma auth trouvé, fonctions JWT créées dans auth';
    CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb AS $$
        SELECT current_setting('request.jwt.claims')::jsonb;
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
        SELECT (auth.jwt() ->> 'sub')::uuid;
    $$ LANGUAGE sql STABLE;

    CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
        SELECT auth.jwt() ->> 'role';
    $$ LANGUAGE sql STABLE;
END $$;

-- ============================
-- 6. TABLES SYSTÈME (dans le schéma principal)
-- ============================
DO $$
DECLARE
    main_schema TEXT := current_setting('app.schema', true);
BEGIN
    IF main_schema IS NULL OR main_schema = '' THEN
        main_schema := 'public';
    END IF;

    -- 6.1 USERS
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR UNIQUE,
            role %I.user_role,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', main_schema, main_schema
    );

    EXECUTE format('ALTER TABLE %I.users ENABLE ROW LEVEL SECURITY', main_schema);

    -- 6.2 PROFILES
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.profiles (
            id UUID PRIMARY KEY,
            full_name TEXT,
            phone TEXT,
            national_id TEXT,
            avatar_url TEXT,
            role %I.user_role,
            is_admin BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            FOREIGN KEY (id) REFERENCES %I.users(id) ON DELETE CASCADE
        )', main_schema, main_schema, main_schema
    );

    EXECUTE format('ALTER TABLE %I.profiles ENABLE ROW LEVEL SECURITY', main_schema);

    -- 6.3 USER ROLES
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.user_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES %I.users(id) ON DELETE CASCADE,
            role_name %I.user_role NOT NULL,
            assigned_at TIMESTAMPTZ DEFAULT NOW(),
            assigned_by UUID REFERENCES %I.users(id),
            UNIQUE(user_id, role_name)
        )', main_schema, main_schema, main_schema
    );

    EXECUTE format('ALTER TABLE %I.user_roles ENABLE ROW LEVEL SECURITY', main_schema);

    RAISE NOTICE '✅ Tables système créées dans le schéma : %', main_schema;
END $$;

-- ============================
-- 7. FONCTION PRE-REQUEST (PostgREST)
-- ============================
DO $$
DECLARE
    schema_has_auth BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_namespace WHERE nspname = 'auth'
    ) INTO schema_has_auth;

    IF NOT schema_has_auth THEN
        RAISE NOTICE '⏭️ Schéma auth absent, fonction pre-request ignorée';
        RETURN;
    END IF;

    CREATE OR REPLACE FUNCTION auth.check_token() RETURNS void AS $$
    BEGIN
        IF current_setting('request.jwt.claims')::jsonb IS NULL THEN
            RAISE insufficient_privilege USING hint = 'No JWT provided';
        END IF;
    END;
    $$ LANGUAGE plpgsql;

    RAISE NOTICE '✅ Fonction auth.check_token() créée';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Impossible de créer auth.check_token(): %', SQLERRM;
END $$;

-- ============================
-- 8. POLITIQUES RLS
-- ============================
DO $$
DECLARE
    main_schema TEXT := current_setting('app.schema', true);
BEGIN
    IF main_schema IS NULL OR main_schema = '' THEN
        main_schema := 'public';
    END IF;

    EXECUTE format('
        DROP POLICY IF EXISTS select_own_user ON %I.users;
        CREATE POLICY select_own_user ON %I.users
            FOR SELECT TO public
            USING (
                id = auth.uid()
                OR auth.role() IN (''admin'', ''director'')
            )
    ', main_schema);

    EXECUTE format('
        DROP POLICY IF EXISTS select_own_profile ON %I.profiles;
        CREATE POLICY select_own_profile ON %I.profiles
            FOR SELECT TO public
            USING (
                id = auth.uid()
                OR auth.role() IN (''admin'', ''director'')
            )
    ', main_schema);

    EXECUTE format('
        DROP POLICY IF EXISTS manage_profiles_admin_director ON %I.profiles;
        CREATE POLICY manage_profiles_admin_director ON %I.profiles
            FOR ALL TO public
            USING (auth.role() IN (''admin'', ''director''))
            WITH CHECK (auth.role() IN (''admin'', ''director''))
    ', main_schema);

    EXECUTE format('
        DROP POLICY IF EXISTS select_own_user_roles ON %I.user_roles;
        CREATE POLICY select_own_user_roles ON %I.user_roles
            FOR SELECT TO public
            USING (
                user_id = auth.uid()
                OR auth.role() IN (''admin'', ''director'')
            )
    ', main_schema);

    EXECUTE format('
        DROP POLICY IF EXISTS manage_roles_admin_director ON %I.user_roles;
        CREATE POLICY manage_roles_admin_director ON %I.user_roles
            FOR ALL TO public
            USING (auth.role() IN (''admin'', ''director''))
            WITH CHECK (auth.role() IN (''admin'', ''director''))
    ', main_schema);

    RAISE NOTICE '✅ Politiques RLS créées dans le schéma : %', main_schema;
END $$;

-- ============================
-- 9. INDEX SYSTÈME
-- ============================
DO $$
DECLARE
    main_schema TEXT := current_setting('app.schema', true);
BEGIN
    IF main_schema IS NULL OR main_schema = '' THEN
        main_schema := 'public';
    END IF;

    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON %I.profiles(id)', main_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON %I.user_roles(user_id)', main_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON %I.user_roles(role_name)', main_schema);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_users_email ON %I.users(email)', main_schema);
END $$;

-- ============================
-- 10. VALIDATION FINALE
-- ============================
DO $$
DECLARE
    main_schema TEXT := current_setting('app.schema', true);
    schema_config TEXT := current_setting('app.schemas', true);
    schema_has_auth BOOLEAN;
BEGIN
    IF main_schema IS NULL OR main_schema = '' THEN
        main_schema := 'public';
    END IF;
    IF schema_config IS NULL OR schema_config = '' THEN
        schema_config := 'public,btp,auth';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM pg_namespace WHERE nspname = 'auth'
    ) INTO schema_has_auth;

    RAISE NOTICE '✅ Base initialisée. Schéma principal : %, Schémas configurés : %', main_schema, schema_config;
    IF NOT schema_has_auth THEN
        RAISE NOTICE '✅ Mode Supabase Cloud détecté automatiquement.';
    END IF;
    RAISE NOTICE '✅ Prête pour les migrations.';
END $$;