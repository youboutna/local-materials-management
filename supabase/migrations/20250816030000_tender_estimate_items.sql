-- =============================================================================
-- MIGRATION : 20250816030000_tender_estimate_items.sql
-- Date       : 2025-08-16
-- Objet      : Créer/compléter tender_estimates + tender_estimate_items
--              + parsed_invoices + RLS + triggers + index
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + DROP POLICY IF EXISTS
--                   + ADD COLUMN IF NOT EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated
--   - Admins via btp.is_current_user_admin() pour les writes
--   - Triggers updated_at via public.update_timestamp()
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : SCHÉMA btp
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS btp;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.tender_estimates (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_estimates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL,
  project_id UUID,
  estimate_type TEXT NOT NULL DEFAULT 'quantitative',
  total_materials_cost NUMERIC DEFAULT 0,
  total_labor_cost NUMERIC DEFAULT 0,
  total_equipment_cost NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_with_tax NUMERIC DEFAULT 0,
  overhead_percentage NUMERIC DEFAULT 15,
  overhead_amount NUMERIC DEFAULT 0,
  profit_margin_percentage NUMERIC DEFAULT 10,
  profit_margin_amount NUMERIC DEFAULT 0,
  final_total NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'MRU',
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compléter les colonnes manquantes
ALTER TABLE btp.tender_estimates
  ADD COLUMN IF NOT EXISTS tender_id UUID,
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS estimate_type TEXT DEFAULT 'quantitative',
  ADD COLUMN IF NOT EXISTS total_materials_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_labor_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_equipment_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_with_tax NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overhead_percentage NUMERIC DEFAULT 15,
  ADD COLUMN IF NOT EXISTS overhead_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_margin_percentage NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS profit_margin_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'MRU',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- =============================================================================
-- ÉTAPE 3 : TABLE btp.tender_estimate_items (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_estimate_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES btp.tender_estimates(id) ON DELETE CASCADE,
  material_id UUID REFERENCES btp.materials(id),
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  item_type TEXT DEFAULT 'material',
  supplier_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.tender_estimate_items
  ADD COLUMN IF NOT EXISTS estimate_id UUID,
  ADD COLUMN IF NOT EXISTS material_id UUID,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'material',
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- =============================================================================
-- ÉTAPE 4 : TABLE btp.parsed_invoices (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.parsed_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL,
  document_id UUID,
  file_name TEXT,
  parsed_data JSONB,
  total_amount NUMERIC,
  tax_amount NUMERIC,
  items JSONB,
  supplier_info JSONB,
  invoice_date DATE,
  invoice_number TEXT,
  parsing_status TEXT DEFAULT 'pending',
  parsing_errors TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.parsed_invoices
  ADD COLUMN IF NOT EXISTS tender_id UUID,
  ADD COLUMN IF NOT EXISTS document_id UUID,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS parsed_data JSONB,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS items JSONB,
  ADD COLUMN IF NOT EXISTS supplier_info JSONB,
  ADD COLUMN IF NOT EXISTS invoice_date DATE,
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS parsing_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS parsing_errors TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- =============================================================================
-- ÉTAPE 5 : RLS
-- =============================================================================

ALTER TABLE btp.tender_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_estimates FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.tender_estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_estimate_items FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.parsed_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.parsed_invoices FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 6 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('tender_estimates', 'tender_estimate_items', 'parsed_invoices')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I', v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 7 : CRÉATION DES POLICIES — SÉCURISÉES
-- =============================================================================
-- Règle :
--   - SELECT : tout utilisateur authentifié (consultation)
--   - INSERT/UPDATE/DELETE : admin/director uniquement
-- =============================================================================

-- 7.1 : btp.tender_estimates

CREATE POLICY "Admins can manage tender estimates"
ON btp.tender_estimates
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view tender estimates"
ON btp.tender_estimates
FOR SELECT
TO authenticated
USING (true);

-- 7.2 : btp.tender_estimate_items

CREATE POLICY "Admins can manage tender estimate items"
ON btp.tender_estimate_items
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view tender estimate items"
ON btp.tender_estimate_items
FOR SELECT
TO authenticated
USING (true);

-- 7.3 : btp.parsed_invoices

CREATE POLICY "Admins can manage parsed invoices"
ON btp.parsed_invoices
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view parsed invoices"
ON btp.parsed_invoices
FOR SELECT
TO authenticated
USING (true);

-- =============================================================================
-- ÉTAPE 8 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_estimates TO authenticated;
GRANT SELECT ON btp.tender_estimates TO anon;
GRANT ALL ON btp.tender_estimates TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_estimate_items TO authenticated;
GRANT SELECT ON btp.tender_estimate_items TO anon;
GRANT ALL ON btp.tender_estimate_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.parsed_invoices TO authenticated;
GRANT SELECT ON btp.parsed_invoices TO anon;
GRANT ALL ON btp.parsed_invoices TO service_role;

-- =============================================================================
-- ÉTAPE 9 : INDEX (idempotents)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tender_estimates_tender_id
  ON btp.tender_estimates (tender_id);

CREATE INDEX IF NOT EXISTS idx_tender_estimates_project_id
  ON btp.tender_estimates (project_id);

CREATE INDEX IF NOT EXISTS idx_tender_estimates_status
  ON btp.tender_estimates (status);

CREATE INDEX IF NOT EXISTS idx_tender_estimate_items_estimate_id
  ON btp.tender_estimate_items (estimate_id);

CREATE INDEX IF NOT EXISTS idx_tender_estimate_items_material_id
  ON btp.tender_estimate_items (material_id);

CREATE INDEX IF NOT EXISTS idx_parsed_invoices_tender_id
  ON btp.parsed_invoices (tender_id);

CREATE INDEX IF NOT EXISTS idx_parsed_invoices_document_id
  ON btp.parsed_invoices (document_id);

CREATE INDEX IF NOT EXISTS idx_parsed_invoices_status
  ON btp.parsed_invoices (parsing_status);

-- =============================================================================
-- ÉTAPE 10 : TRIGGERS updated_at (IDEMPOTENTS)
-- =============================================================================

-- S'assurer que public.update_timestamp() existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_timestamp'
  ) THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.update_timestamp()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = ''
      AS $body$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $body$;
    $fn$;
  END IF;
END $$;

-- Trigger tender_estimates
DROP TRIGGER IF EXISTS update_tender_estimates_updated_at ON btp.tender_estimates;
CREATE TRIGGER update_tender_estimates_updated_at
  BEFORE UPDATE ON btp.tender_estimates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- Trigger tender_estimate_items
DROP TRIGGER IF EXISTS update_tender_estimate_items_updated_at ON btp.tender_estimate_items;
CREATE TRIGGER update_tender_estimate_items_updated_at
  BEFORE UPDATE ON btp.tender_estimate_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- Trigger parsed_invoices
DROP TRIGGER IF EXISTS update_parsed_invoices_updated_at ON btp.parsed_invoices;
CREATE TRIGGER update_parsed_invoices_updated_at
  BEFORE UPDATE ON btp.parsed_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- =============================================================================
-- ÉTAPE 11 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_rec RECORD;
  v_tables TEXT[] := ARRAY['tender_estimates', 'tender_estimate_items', 'parsed_invoices'];
  v_tbl TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOREACH v_tbl IN ARRAY v_tables
  LOOP
    SELECT c.relrowsecurity, c.relforcerowsecurity
    INTO v_rls_enabled, v_rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'btp' AND c.relname = v_tbl;

    RAISE NOTICE '%.% : RLS=% RLS_FORCED=%', 'btp', v_tbl, v_rls_enabled, v_rls_forced;

    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = v_tbl;

    RAISE NOTICE '   Policies : %', v_policy_count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('tender_estimates', 'tender_estimate_items', 'parsed_invoices')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE '   • %.% [%] → %',
      v_rec.tablename, v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;