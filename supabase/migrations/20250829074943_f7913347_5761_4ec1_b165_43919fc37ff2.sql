-- =============================================================================
-- MIGRATION : fix_tender_document_submissions
-- Date       : 2025-XX-XX
-- Objet      : Corriger complètement :
--              - btp.tender_document_submissions (RLS + colonnes)
--              - btp.tender_estimates (RLS + colonnes)
--              - btp.tender_estimate_items (RLS)
--              - btp.tenders.current_phase
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated + btp.is_current_user_admin()
--   - Qualification btp.table.column dans USING/WITH CHECK
--   - Pas de CHECK sur nomenclatures (validation côté référentiels)
--   - Triggers via public.update_timestamp() (SECURITY DEFINER)
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : S'ASSURER QUE LA FONCTION btp.is_current_user_admin EXISTE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'btp' AND p.proname = 'is_current_user_admin'
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION btp.is_current_user_admin()
      RETURNS BOOLEAN
      LANGUAGE SQL
      SECURITY DEFINER
      STABLE
      SET search_path = ''
      AS $body$
        SELECT EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role_name IN ('admin', 'director')
        );
      $body$;
    $fn$;

    REVOKE ALL ON FUNCTION btp.is_current_user_admin() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION btp.is_current_user_admin() TO authenticated;

    RAISE NOTICE '✅ Fonction btp.is_current_user_admin() créée';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.tender_document_submissions (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_document_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  document_id UUID NOT NULL,
  submission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',  -- pas de CHECK
  reviewer_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tender_id, supplier_id, document_id)
);

ALTER TABLE btp.tender_document_submissions
  ADD COLUMN IF NOT EXISTS tender_id UUID,
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS document_id UUID,
  ADD COLUMN IF NOT EXISTS submission_date TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_document_submissions créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : COLONNES MANQUANTES SUR btp.tenders
-- =============================================================================

ALTER TABLE btp.tenders
  ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 1;

-- ⚠️ Pas de CHECK sur current_phase : la validation est côté app.
--    UPDATE des valeurs NULL uniquement (idempotent).
UPDATE btp.tenders
SET current_phase = CASE
  WHEN status = 'draft' THEN 1
  WHEN status = 'published' THEN 2
  WHEN status = 'closed' THEN 6
  WHEN status = 'awarded' THEN 7
  ELSE 1
END
WHERE current_phase IS NULL;

DO $$ BEGIN RAISE NOTICE '✅ btp.tenders.current_phase ajoutée/initialisée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : TABLE btp.tender_estimates (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL,
  project_id UUID,
  supplier_id UUID,
  submitted_by UUID,
  estimate_type TEXT NOT NULL DEFAULT 'quantitative',
  total_materials_cost NUMERIC DEFAULT 0,
  total_labor_cost NUMERIC DEFAULT 0,
  total_equipment_cost NUMERIC DEFAULT 0,
  subtotal NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 14,
  tax_amount NUMERIC DEFAULT 0,
  total_with_tax NUMERIC DEFAULT 0,
  overhead_percentage NUMERIC DEFAULT 15,
  overhead_amount NUMERIC DEFAULT 0,
  profit_margin_percentage NUMERIC DEFAULT 10,
  profit_margin_amount NUMERIC DEFAULT 0,
  final_total NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'MRU',
  status TEXT DEFAULT 'draft',  -- pas de CHECK
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE btp.tender_estimates
  ADD COLUMN IF NOT EXISTS tender_id UUID,
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS submitted_by UUID,
  ADD COLUMN IF NOT EXISTS estimate_type TEXT DEFAULT 'quantitative',
  ADD COLUMN IF NOT EXISTS total_materials_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_labor_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_equipment_cost NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_rate NUMERIC DEFAULT 14,
  ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_with_tax NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overhead_percentage NUMERIC DEFAULT 15,
  ADD COLUMN IF NOT EXISTS overhead_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_margin_percentage NUMERIC DEFAULT 10,
  ADD COLUMN IF NOT EXISTS profit_margin_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_total NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'MRU',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_estimates créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 4 : TABLE btp.tender_estimate_items (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL REFERENCES btp.tender_estimates(id) ON DELETE CASCADE,
  material_id UUID REFERENCES btp.materials(id),
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  item_type TEXT DEFAULT 'material',  -- pas de CHECK
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE btp.tender_estimate_items
  ADD COLUMN IF NOT EXISTS estimate_id UUID,
  ADD COLUMN IF NOT EXISTS material_id UUID,
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'material',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_estimate_items créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 5 : RLS SUR LES 3 TABLES
-- =============================================================================

ALTER TABLE btp.tender_document_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_document_submissions FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.tender_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_estimates FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.tender_estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_estimate_items FORCE ROW LEVEL SECURITY;

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
      AND tablename IN ('tender_document_submissions', 'tender_estimates', 'tender_estimate_items')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I',
      v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 7 : POLICIES SÉCURISÉES — btp.tender_document_submissions
-- =============================================================================
-- ✅ Qualification explicite : btp.tender_document_submissions.<col>
-- ✅ TO authenticated
-- ✅ btp.is_current_user_admin() pour les writes admin
-- =============================================================================

-- 7.1 : Admins : gestion complète
CREATE POLICY "Admins can manage tender document submissions"
ON btp.tender_document_submissions
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- 7.2 : Fournisseurs : voir leurs propres soumissions
CREATE POLICY "Suppliers can view their own submissions"
ON btp.tender_document_submissions
FOR SELECT
TO authenticated
USING (
  btp.tender_document_submissions.supplier_id = (
    SELECT s.id FROM btp.suppliers s
    WHERE s.user_id = auth.uid()
    LIMIT 1
  )
);

-- 7.3 : Fournisseurs : créer leurs propres soumissions
CREATE POLICY "Suppliers can create their own submissions"
ON btp.tender_document_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  btp.tender_document_submissions.supplier_id = (
    SELECT s.id FROM btp.suppliers s
    WHERE s.user_id = auth.uid()
    LIMIT 1
  )
);

-- 7.4 : Fournisseurs : modifier leurs soumissions en attente
CREATE POLICY "Suppliers can update their own pending submissions"
ON btp.tender_document_submissions
FOR UPDATE
TO authenticated
USING (
  btp.tender_document_submissions.status = 'pending'
  AND btp.tender_document_submissions.supplier_id = (
    SELECT s.id FROM btp.suppliers s
    WHERE s.user_id = auth.uid()
    LIMIT 1
  )
)
WITH CHECK (
  btp.tender_document_submissions.status = 'pending'
  AND btp.tender_document_submissions.supplier_id = (
    SELECT s.id FROM btp.suppliers s
    WHERE s.user_id = auth.uid()
    LIMIT 1
  )
);

-- =============================================================================
-- ÉTAPE 8 : POLICIES — btp.tender_estimates
-- =============================================================================

-- 8.1 : Admins : gestion complète
CREATE POLICY "Admins can manage tender estimates"
ON btp.tender_estimates
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- 8.2 : Fournisseurs : gestion de leurs propres estimations
CREATE POLICY "Suppliers can manage their own estimates"
ON btp.tender_estimates
FOR ALL
TO authenticated
USING (
  btp.tender_estimates.supplier_id = (
    SELECT s.id FROM btp.suppliers s
    WHERE s.user_id = auth.uid()
    LIMIT 1
  )
)
WITH CHECK (
  btp.tender_estimates.supplier_id = (
    SELECT s.id FROM btp.suppliers s
    WHERE s.user_id = auth.uid()
    LIMIT 1
  )
);

-- =============================================================================
-- ÉTAPE 9 : POLICIES — btp.tender_estimate_items
-- =============================================================================

-- 9.1 : Admins : gestion complète
CREATE POLICY "Admins can manage tender estimate items"
ON btp.tender_estimate_items
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- 9.2 : Fournisseurs : gestion des items de leurs propres estimations
CREATE POLICY "Suppliers can manage their own estimate items"
ON btp.tender_estimate_items
FOR ALL
TO authenticated
USING (
  btp.tender_estimate_items.estimate_id IN (
    SELECT e.id FROM btp.tender_estimates e
    WHERE e.supplier_id = (
      SELECT s.id FROM btp.suppliers s
      WHERE s.user_id = auth.uid()
      LIMIT 1
    )
  )
)
WITH CHECK (
  btp.tender_estimate_items.estimate_id IN (
    SELECT e.id FROM btp.tender_estimates e
    WHERE e.supplier_id = (
      SELECT s.id FROM btp.suppliers s
      WHERE s.user_id = auth.uid()
      LIMIT 1
    )
  )
);

-- =============================================================================
-- ÉTAPE 10 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_document_submissions TO authenticated;
GRANT SELECT ON btp.tender_document_submissions TO anon;
GRANT ALL ON btp.tender_document_submissions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_estimates TO authenticated;
GRANT SELECT ON btp.tender_estimates TO anon;
GRANT ALL ON btp.tender_estimates TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_estimate_items TO authenticated;
GRANT SELECT ON btp.tender_estimate_items TO anon;
GRANT ALL ON btp.tender_estimate_items TO service_role;

-- =============================================================================
-- ÉTAPE 11 : INDEX
-- =============================================================================

-- tender_document_submissions
CREATE INDEX IF NOT EXISTS idx_tender_document_submissions_tender_id
  ON btp.tender_document_submissions(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_document_submissions_supplier_id
  ON btp.tender_document_submissions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tender_document_submissions_document_id
  ON btp.tender_document_submissions(document_id);
CREATE INDEX IF NOT EXISTS idx_tender_document_submissions_status
  ON btp.tender_document_submissions(status);

-- tender_estimates
CREATE INDEX IF NOT EXISTS idx_tender_estimates_tender_id
  ON btp.tender_estimates(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_estimates_supplier_id
  ON btp.tender_estimates(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tender_estimates_status
  ON btp.tender_estimates(status);

-- tender_estimate_items
CREATE INDEX IF NOT EXISTS idx_tender_estimate_items_estimate_id
  ON btp.tender_estimate_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_tender_estimate_items_material_id
  ON btp.tender_estimate_items(material_id) WHERE material_id IS NOT NULL;

-- tenders.current_phase
CREATE INDEX IF NOT EXISTS idx_tenders_current_phase
  ON btp.tenders(current_phase);

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 12 : TRIGGERS updated_at (IDEMPOTENTS + fonction correcte)
-- =============================================================================
-- ✅ FIX : public.update_timestamp() au lieu de btp.update_updated_at_column()
-- ✅ FIX : DROP TRIGGER IF EXISTS avant CREATE TRIGGER
--          (CREATE OR REPLACE TRIGGER n'existe PAS en PostgreSQL)
-- =============================================================================

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
    RAISE NOTICE '  Fonction public.update_timestamp() créée';
  END IF;
END $$;

-- tender_document_submissions
DROP TRIGGER IF EXISTS update_tender_document_submissions_updated_at
  ON btp.tender_document_submissions;
CREATE TRIGGER update_tender_document_submissions_updated_at
  BEFORE UPDATE ON btp.tender_document_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- tender_estimates
DROP TRIGGER IF EXISTS update_tender_estimates_updated_at
  ON btp.tender_estimates;
CREATE TRIGGER update_tender_estimates_updated_at
  BEFORE UPDATE ON btp.tender_estimates
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- tender_estimate_items
DROP TRIGGER IF EXISTS update_tender_estimate_items_updated_at
  ON btp.tender_estimate_items;
CREATE TRIGGER update_tender_estimate_items_updated_at
  BEFORE UPDATE ON btp.tender_estimate_items
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Triggers updated_at créés'; END $$;

-- =============================================================================
-- ÉTAPE 13 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_rec RECORD;
  v_tables TEXT[] := ARRAY[
    'tender_document_submissions',
    'tender_estimates',
    'tender_estimate_items'
  ];
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

    RAISE NOTICE 'btp.% : RLS=% FORCE=%', v_tbl, v_rls_enabled, v_rls_forced;

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
      AND tablename IN ('tender_document_submissions', 'tender_estimates', 'tender_estimate_items')
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