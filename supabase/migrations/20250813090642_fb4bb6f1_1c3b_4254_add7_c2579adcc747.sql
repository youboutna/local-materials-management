-- =============================================================================
-- MIGRATION : 20250813090642_create_tender_estimates.sql
-- Date       : 2025-08-13
-- Objet      : Créer/compléter les tables btp.tender_estimates et
--              btp.tender_estimate_items + RLS + triggers
--
-- SÉCURITÉ :
--   - SECURITY DEFINER + search_path sur update_timestamp()
--   - REVOKE PUBLIC + GRANT authenticated
--   - RLS activé + FORCE
--   - Policies via btp.is_current_user_admin()
--   - TO authenticated explicite
--   - Idempotente : CREATE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS
--                   + DROP TRIGGER/POLICY IF EXISTS
--
-- RÈGLES DE QUALIFICATION :
--   - CREATE INDEX  → nom de colonne SIMPLE
--   - ADD COLUMN    → nom de colonne SIMPLE
--   - POLICY USING  → qualification complète recommandée
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
  supplier_id UUID,
  title VARCHAR NOT NULL,
  description TEXT,
  tax_rate NUMERIC DEFAULT 18.0,
  overhead_percentage NUMERIC DEFAULT 10.0,
  profit_percentage NUMERIC DEFAULT 15.0,
  total_materials NUMERIC DEFAULT 0,
  total_labor NUMERIC DEFAULT 0,
  total_equipment NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  overhead_amount NUMERIC DEFAULT 0,
  profit_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE '✅ Table btp.tender_estimates créée/vérifiée';
END $$;

-- Compléter les colonnes manquantes si la table existait déjà
ALTER TABLE btp.tender_estimates
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS tender_id UUID,
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS title VARCHAR,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 18.0,
  ADD COLUMN IF NOT EXISTS overhead_percentage NUMERIC DEFAULT 10.0,
  ADD COLUMN IF NOT EXISTS profit_percentage NUMERIC DEFAULT 15.0,
  ADD COLUMN IF NOT EXISTS total_materials NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_labor NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_equipment NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overhead_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- =============================================================================
-- ÉTAPE 3 : TABLE btp.tender_estimate_items (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_estimate_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  estimate_id UUID NOT NULL REFERENCES btp.tender_estimates(id) ON DELETE CASCADE,
  material_id UUID,
  item_code VARCHAR,
  description TEXT NOT NULL,
  unit VARCHAR NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED,
  category TEXT DEFAULT 'materials',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  RAISE NOTICE '✅ Table btp.tender_estimate_items créée/vérifiée';
END $$;

-- Compléter les colonnes manquantes
ALTER TABLE btp.tender_estimate_items
  ADD COLUMN IF NOT EXISTS estimate_id UUID,
  ADD COLUMN IF NOT EXISTS material_id UUID,
  ADD COLUMN IF NOT EXISTS item_code VARCHAR,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS unit VARCHAR,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'materials',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Note : total_price est une colonne GENERATED, elle ne peut pas être ajoutée
-- par ADD COLUMN IF NOT EXISTS sur une table existante (besoin de DROP + ADD).
-- On vérifie son existence séparément.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'tender_estimate_items'
      AND column_name = 'total_price'
  ) THEN
    EXECUTE 'ALTER TABLE btp.tender_estimate_items
             ADD COLUMN total_price NUMERIC GENERATED ALWAYS AS (quantity * unit_price) STORED';
    RAISE NOTICE '✅ Colonne total_price ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne total_price déjà présente';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 4 : INDEX (idempotents) — nom de colonne SIMPLE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tender_estimates_tender_id
  ON btp.tender_estimates (tender_id);

CREATE INDEX IF NOT EXISTS idx_tender_estimates_project_id
  ON btp.tender_estimates (project_id);

CREATE INDEX IF NOT EXISTS idx_tender_estimates_supplier_id
  ON btp.tender_estimates (supplier_id);

CREATE INDEX IF NOT EXISTS idx_tender_estimates_status
  ON btp.tender_estimates (status);

CREATE INDEX IF NOT EXISTS idx_tender_estimate_items_estimate_id
  ON btp.tender_estimate_items (estimate_id);

CREATE INDEX IF NOT EXISTS idx_tender_estimate_items_material_id
  ON btp.tender_estimate_items (material_id);

CREATE INDEX IF NOT EXISTS idx_tender_estimate_items_category
  ON btp.tender_estimate_items (category);

DO $$
BEGIN
  RAISE NOTICE '✅ Index créés sur btp.tender_estimates et btp.tender_estimate_items';
END $$;

-- =============================================================================
-- ÉTAPE 5 : RLS
-- =============================================================================

ALTER TABLE btp.tender_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_estimates FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.tender_estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_estimate_items FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 6 : POLICIES — qualification complète
-- =============================================================================

-- 6.1 : Nettoyer les policies existantes
DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('tender_estimates', 'tender_estimate_items')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I', v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
  END LOOP;
END $$;

-- 6.2 : Policies sur btp.tender_estimates
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

COMMENT ON POLICY "Admins can manage tender estimates" ON btp.tender_estimates IS
  'Admin/director peuvent tout gérer sur les estimations.';
COMMENT ON POLICY "Authenticated can view tender estimates" ON btp.tender_estimates IS
  'Tous les utilisateurs authentifiés peuvent consulter les estimations.';

-- 6.3 : Policies sur btp.tender_estimate_items
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

COMMENT ON POLICY "Admins can manage tender estimate items" ON btp.tender_estimate_items IS
  'Admin/director peuvent tout gérer sur les items d''estimation.';
COMMENT ON POLICY "Authenticated can view tender estimate items" ON btp.tender_estimate_items IS
  'Tous les utilisateurs authentifiés peuvent consulter les items.';

-- =============================================================================
-- ÉTAPE 7 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_estimates TO authenticated;
GRANT SELECT ON btp.tender_estimates TO anon;
GRANT ALL ON btp.tender_estimates TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_estimate_items TO authenticated;
GRANT SELECT ON btp.tender_estimate_items TO anon;
GRANT ALL ON btp.tender_estimate_items TO service_role;

-- =============================================================================
-- ÉTAPE 8 : TRIGGERS updated_at — IDEMPOTENTS
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

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers updated_at créés';
END $$;

-- =============================================================================
-- ÉTAPE 9 : COMMENTAIRES TABLE
-- =============================================================================

COMMENT ON TABLE btp.tender_estimates IS
  'Estimations d''appels d''offres. RLS activé + FORCE.';
COMMENT ON TABLE btp.tender_estimate_items IS
  'Items des estimations. RLS activé + FORCE.';

-- =============================================================================
-- ÉTAPE 10 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION — btp.tender_estimates / tender_estimate_items';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- RLS sur tender_estimates
  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'tender_estimates';

  RAISE NOTICE 'tender_estimates     : RLS=% RLS_FORCED=%', v_rls_enabled, v_rls_forced;

  -- RLS sur tender_estimate_items
  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'tender_estimate_items';

  RAISE NOTICE 'tender_estimate_items: RLS=% RLS_FORCED=%', v_rls_enabled, v_rls_forced;

  RAISE NOTICE '';
  FOR v_rec IN
    SELECT tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('tender_estimates', 'tender_estimate_items')
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