-- =============================================================================
-- MIGRATION : 20250719000000_create_materials_table.sql
-- Date       : 2025-07-19
-- Objet      : Créer la table btp.materials + RLS + trigger updated_at
-- Idempotente : OUI
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : FONCTION update_timestamp() — SÉCURISÉE
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.update_timestamp() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_timestamp() FROM anon;
GRANT EXECUTE ON FUNCTION public.update_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_timestamp() TO service_role;

COMMENT ON FUNCTION public.update_timestamp() IS
  'Met à jour automatiquement NEW.updated_at. SECURITY DEFINER + search_path='''' pour éviter le schema hijacking.';

-- =============================================================================
-- ÉTAPE 2 : CRÉATION DE LA TABLE btp.materials (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    unit TEXT,
    quantity NUMERIC DEFAULT 0,
    available_quantity NUMERIC DEFAULT 0,
    min_quantity NUMERIC DEFAULT 0,
    price_per_unit NUMERIC DEFAULT 0,
    sku TEXT UNIQUE,
    ean TEXT,
    gtin TEXT,
    asin TEXT,
    localisation JSONB DEFAULT '{}',
    coordinates_latitude NUMERIC,
    coordinates_longitude NUMERIC,
    adresse JSONB DEFAULT '{}',
    forme TEXT,
    origin_location TEXT,
    image TEXT,
    tags JSONB DEFAULT '[]',
    multilang_labels JSONB DEFAULT '{}',
    material_status TEXT DEFAULT 'active',
    timeline JSONB DEFAULT '[]',
    last_restock TIMESTAMPTZ,
    supplier JSONB DEFAULT '{}',
    workspace_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ÉTAPE 3 : RLS
-- =============================================================================

ALTER TABLE btp.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.materials FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 4 : INDEX (idempotents)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_materials_name ON btp.materials(name);
CREATE INDEX IF NOT EXISTS idx_materials_category ON btp.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_sku ON btp.materials(sku);
CREATE INDEX IF NOT EXISTS idx_materials_status ON btp.materials(material_status);
CREATE INDEX IF NOT EXISTS idx_materials_workspace_id ON btp.materials(workspace_id);
CREATE INDEX IF NOT EXISTS idx_materials_localisation
    ON btp.materials USING GIN (localisation jsonb_path_ops);

-- =============================================================================
-- ÉTAPE 5 : TRIGGER updated_at — IDEMPOTENT
-- =============================================================================

DROP TRIGGER IF EXISTS set_timestamp_materials ON btp.materials;

CREATE TRIGGER set_timestamp_materials
    BEFORE UPDATE ON btp.materials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_timestamp();

-- =============================================================================
-- ÉTAPE 6 : PERMISSIONS
-- =============================================================================

GRANT SELECT ON btp.materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.materials TO authenticated;
GRANT ALL ON btp.materials TO service_role;

-- =============================================================================
-- ÉTAPE 7 : POLICIES RLS
-- =============================================================================

DROP POLICY IF EXISTS select_materials ON btp.materials;
CREATE POLICY select_materials ON btp.materials
    FOR SELECT TO authenticated
    USING (btp.is_current_user_admin() OR workspace_id IS NOT NULL);

DROP POLICY IF EXISTS insert_materials ON btp.materials;
CREATE POLICY insert_materials ON btp.materials
    FOR INSERT TO authenticated
    WITH CHECK (btp.is_current_user_admin());

DROP POLICY IF EXISTS update_materials ON btp.materials;
CREATE POLICY update_materials ON btp.materials
    FOR UPDATE TO authenticated
    USING (btp.is_current_user_admin())
    WITH CHECK (btp.is_current_user_admin());

DROP POLICY IF EXISTS delete_materials ON btp.materials;
CREATE POLICY delete_materials ON btp.materials
    FOR DELETE TO authenticated
    USING (btp.is_current_user_admin());

-- =============================================================================
-- ÉTAPE 8 : COMMENTAIRES
-- =============================================================================

COMMENT ON TABLE btp.materials IS
  'Matériaux. RLS activé + FORCE. Validation des nomenclatures côté application.';

-- =============================================================================
-- ÉTAPE 9 : VÉRIFICATIONS POST-MIGRATION (CORRIGÉE)
-- =============================================================================

DO $$
DECLARE
    v_table_exists BOOLEAN;
    v_trigger_exists BOOLEAN;
    v_policy_count INT;
    v_func_security TEXT;
    v_rls_enabled BOOLEAN;
    v_rls_forced BOOLEAN;
    v_rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '  VÉRIFICATION POST-MIGRATION — btp.materials';
    RAISE NOTICE '════════════════════════════════════════════════════════════';

    -- Table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'btp' AND table_name = 'materials'
    ) INTO v_table_exists;

    IF v_table_exists THEN
        RAISE NOTICE '✅ Table btp.materials existe';
    ELSE
        RAISE EXCEPTION '❌ Table btp.materials manquante';
    END IF;

    -- Trigger
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers
        WHERE event_object_schema = 'btp'
          AND event_object_table = 'materials'
          AND trigger_name = 'set_timestamp_materials'
    ) INTO v_trigger_exists;

    IF v_trigger_exists THEN
        RAISE NOTICE '✅ Trigger set_timestamp_materials existe';
    ELSE
        RAISE WARNING '⚠️  Trigger set_timestamp_materials manquant';
    END IF;

    -- Fonction
    SELECT CASE WHEN prosecdef THEN 'DEFINER' ELSE 'INVOKER' END
    INTO v_func_security
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_timestamp';

    RAISE NOTICE '✅ Fonction update_timestamp SECURITY : %',
        COALESCE(v_func_security, 'INTROUVABLE');

    -- Policies
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'materials';

    RAISE NOTICE '';
    RAISE NOTICE 'Policies sur btp.materials : %', v_policy_count;
    FOR v_rec IN
        SELECT policyname, cmd, roles
        FROM pg_policies
        WHERE schemaname = 'btp' AND tablename = 'materials'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '   • % [%] → roles: %',
            v_rec.policyname, v_rec.cmd, v_rec.roles;
    END LOOP;

    -- ✅ FIX : Utiliser pg_class pour relforcerowsecurity (pg_tables ne l'expose pas)
    SELECT
        c.relrowsecurity,
        c.relforcerowsecurity
    INTO v_rls_enabled, v_rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'btp' AND c.relname = 'materials';

    RAISE NOTICE '';
    IF v_rls_enabled THEN
        RAISE NOTICE '✅ RLS activé sur btp.materials';
    ELSE
        RAISE WARNING '⚠️  RLS NON activé sur btp.materials';
    END IF;

    IF v_rls_forced THEN
        RAISE NOTICE '✅ RLS FORCÉ sur btp.materials';
    ELSE
        RAISE WARNING '⚠️  RLS NON forcé sur btp.materials';
    END IF;

    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 10 : RECHARGEMENT CACHE POSTGREST
-- =============================================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;