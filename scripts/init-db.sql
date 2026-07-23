-- =============================================================================
-- INIT-DB.SQL – HADRATECH-GPI
-- Initialisation des schémas, rôles, extensions et tables de base
-- Exécuté automatiquement par docker-entrypoint-initdb.d/
-- =============================================================================
-- Les schémas métier sont CONFIGURABLES via PGRST_DB_SCHEMAS
-- Compatible avec les variables du docker-compose self-hosted Supabase
-- =============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- 2. SCHÉMAS
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS btp;
CREATE SCHEMA IF NOT EXISTS auth;

-- 3. RÔLES
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_anon') THEN
        CREATE ROLE web_anon NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'btp_user') THEN
        CREATE ROLE btp_user NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'authenticator';
    END IF;
END $$;

GRANT web_anon TO authenticator;
GRANT btp_user TO authenticator;

GRANT USAGE ON SCHEMA public TO web_anon;
GRANT USAGE ON SCHEMA btp TO web_anon;
GRANT USAGE ON SCHEMA auth TO web_anon;

-- 4. FONCTIONS JWT (utilisées par les politiques RLS)
CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb AS $$
    SELECT current_setting('request.jwt.claims', true)::jsonb;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid AS $$
    SELECT (auth.jwt() ->> 'sub')::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.role() RETURNS text AS $$
    SELECT auth.jwt() ->> 'role';
$$ LANGUAGE sql STABLE;

-- 5. TABLES MÉTIER (schéma configurable via PGRST_DB_SCHEMAS)
DO $$
DECLARE
    schema_name TEXT := current_setting('app.schema', true);
BEGIN
    IF schema_name IS NULL OR schema_name = '' THEN
        schema_name := 'btp';
    END IF;

    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT ''planifie'',
            progress INTEGER DEFAULT 0,
            budget NUMERIC DEFAULT 0,
            start_date TIMESTAMPTZ,
            end_date TIMESTAMPTZ,
            location TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', schema_name
    );

    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.phases (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID NOT NULL REFERENCES %I.projects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT ''planifie'',
            progress INTEGER DEFAULT 0,
            budget NUMERIC DEFAULT 0,
            start_date TIMESTAMPTZ,
            end_date TIMESTAMPTZ,
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )', schema_name, schema_name
    );

    EXECUTE format('ALTER TABLE %I.projects ENABLE ROW LEVEL SECURITY', schema_name);
    EXECUTE format('ALTER TABLE %I.phases ENABLE ROW LEVEL SECURITY', schema_name);

    EXECUTE format('
        DROP POLICY IF EXISTS "Enable read access for all users" ON %I.projects;
        CREATE POLICY "Enable read access for all users" ON %I.projects
            FOR SELECT USING (true)
    ', schema_name);

    RAISE NOTICE '✅ Tables créées dans le schéma : %', schema_name;
END $$;

-- 6. FONCTION DE VÉRIFICATION DE TOKEN (pre-request)
CREATE OR REPLACE FUNCTION auth.check_token() RETURNS void AS $$
BEGIN
    IF current_setting('request.jwt.claims', true)::jsonb IS NULL THEN
        RAISE insufficient_privilege USING hint = 'No JWT provided';
    END IF;
END;
$$ LANGUAGE plpgsql;