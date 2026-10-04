-- =============================================================================
-- MIGRATION : 20260930023445_960b4e7b_9a29_4288_b7ac_6f4a9d6b51e3.sql
-- Date       : 2026-09-30
-- Objet      : Corriger tender_estimates + tender_estimate_items
--              + tender_document_submissions + tenders.current_phase
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated
--   - Pas de CHECK sur nomenclatures (validation côté référentiels)
--   - Triggers via public.update_timestamp()
--   - Déduplication AVANT contraintes UNIQUE
--   - FK avec nettoyage des orphelins
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : S'ASSURER QUE btp.is_current_user_admin EXISTE
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
-- ÉTAPE 1 : TABLE btp.tender_estimates
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL,
  project_id UUID,
  submitted_by UUID,
  supplier_id UUID,
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
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE btp.tender_estimates
  ADD COLUMN IF NOT EXISTS tender_id UUID,
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS submitted_by UUID,
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
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

DO $$
DECLARE v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    JOIN information_schema.columns col
      ON col.table_schema = n.nspname AND col.table_name = t.relname
     AND col.column_name = a.attname
    WHERE n.nspname = 'btp'
      AND t.relname = 'tender_estimates'
      AND c.contype = 'c'
      AND col.data_type IN ('text', 'character varying')
      AND pg_get_constraintdef(c.oid) ILIKE '%IN (%'
  LOOP
    EXECUTE format('ALTER TABLE btp.tender_estimates DROP CONSTRAINT IF EXISTS %I', v_rec.conname);
    RAISE NOTICE '  ✅ CHECK supprimé : %', v_rec.conname;
  END LOOP;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_estimates'; END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.tender_estimate_items
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_estimate_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id UUID NOT NULL,
  material_id UUID,
  description TEXT NOT NULL DEFAULT '',
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  item_type TEXT DEFAULT 'material',
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_tender_estimate_items_estimate'
      AND conrelid = 'btp.tender_estimate_items'::regclass
  ) THEN
    DELETE FROM btp.tender_estimate_items i
    WHERE i.estimate_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM btp.tender_estimates e WHERE e.id = i.estimate_id);

    ALTER TABLE btp.tender_estimate_items
      ADD CONSTRAINT fk_tender_estimate_items_estimate
      FOREIGN KEY (estimate_id) REFERENCES btp.tender_estimates(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_tender_estimate_items_estimate créée';
  END IF;
END $$;

DO $$
DECLARE v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    JOIN information_schema.columns col
      ON col.table_schema = n.nspname AND col.table_name = t.relname
     AND col.column_name = a.attname
    WHERE n.nspname = 'btp'
      AND t.relname = 'tender_estimate_items'
      AND c.contype = 'c'
      AND col.data_type IN ('text', 'character varying')
      AND pg_get_constraintdef(c.oid) ILIKE '%IN (%'
  LOOP
    EXECUTE format('ALTER TABLE btp.tender_estimate_items DROP CONSTRAINT IF EXISTS %I', v_rec.conname);
  END LOOP;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_estimate_items'; END $$;

-- =============================================================================
-- ÉTAPE 3 : TABLE btp.tender_document_submissions
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_document_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL,
  submitted_by UUID,
  document_id UUID NOT NULL,
  submission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE btp.tender_document_submissions
  ADD COLUMN IF NOT EXISTS tender_id UUID,
  ADD COLUMN IF NOT EXISTS submitted_by UUID,
  ADD COLUMN IF NOT EXISTS document_id UUID,
  ADD COLUMN IF NOT EXISTS submission_date TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
DECLARE v_dup INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tender_document_submissions_unique'
      AND conrelid = 'btp.tender_document_submissions'::regclass
  ) THEN
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY tender_id, COALESCE(submitted_by::text, ''), document_id
               ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
             ) AS rn
      FROM btp.tender_document_submissions
    )
    DELETE FROM btp.tender_document_submissions
    WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

    GET DIAGNOSTICS v_dup = ROW_COUNT;
    IF v_dup > 0 THEN
      RAISE NOTICE '  ✅ % doublons supprimés', v_dup;
    END IF;

    ALTER TABLE btp.tender_document_submissions
      ADD CONSTRAINT tender_document_submissions_unique
      UNIQUE (tender_id, submitted_by, document_id);
    RAISE NOTICE '  ✅ UNIQUE (tender_id, submitted_by, document_id) créé';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_tender_document_submissions_tender'
      AND conrelid = 'btp.tender_document_submissions'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'tenders'
  ) THEN
    DELETE FROM btp.tender_document_submissions d
    WHERE d.tender_id IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM btp.tenders t WHERE t.id = d.tender_id);

    ALTER TABLE btp.tender_document_submissions
      ADD CONSTRAINT fk_tender_document_submissions_tender
      FOREIGN KEY (tender_id) REFERENCES btp.tenders(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_tender_document_submissions_tender créée';
  END IF;
END $$;

DO $$
DECLARE v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    JOIN information_schema.columns col
      ON col.table_schema = n.nspname AND col.table_name = t.relname
     AND col.column_name = a.attname
    WHERE n.nspname = 'btp'
      AND t.relname = 'tender_document_submissions'
      AND c.contype = 'c'
      AND col.data_type IN ('text', 'character varying')
      AND pg_get_constraintdef(c.oid) ILIKE '%IN (%'
  LOOP
    EXECUTE format('ALTER TABLE btp.tender_document_submissions DROP CONSTRAINT IF EXISTS %I', v_rec.conname);
  END LOOP;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_document_submissions'; END $$;

-- =============================================================================
-- ÉTAPE 4 : btp.tenders.current_phase
-- =============================================================================

ALTER TABLE btp.tenders
  ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 1;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenders_current_phase_check'
      AND conrelid = 'btp.tenders'::regclass
  ) THEN
    ALTER TABLE btp.tenders DROP CONSTRAINT tenders_current_phase_check;
    RAISE NOTICE '  ✅ CHECK current_phase supprimé';
  END IF;
END $$;

UPDATE btp.tenders
SET current_phase = CASE
  WHEN status = 'draft' THEN 1
  WHEN status = 'published' THEN 2
  WHEN status = 'closed' THEN 6
  WHEN status = 'awarded' THEN 7
  ELSE 1
END
WHERE current_phase IS NULL;

DO $$ BEGIN RAISE NOTICE '✅ btp.tenders.current_phase'; END $$;

-- =============================================================================
-- ÉTAPE 5 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.tender_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_estimates FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.tender_estimate_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_estimate_items FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.tender_document_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_document_submissions FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 6 : NETTOYAGE DES POLICIES EXISTANTES
-- =============================================================================

DO $$
DECLARE v_rec RECORD; v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT tablename, policyname FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('tender_estimates', 'tender_estimate_items', 'tender_document_submissions')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I', v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;
  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 7 : POLICIES SÉCURISÉES
-- =============================================================================

CREATE POLICY "Users can manage their own estimates"
ON btp.tender_estimates
FOR ALL
TO authenticated
USING (btp.tender_estimates.submitted_by = auth.uid())
WITH CHECK (btp.tender_estimates.submitted_by = auth.uid());

CREATE POLICY "Admins can view all estimates"
ON btp.tender_estimates
FOR SELECT
TO authenticated
USING (btp.is_current_user_admin());

CREATE POLICY "Admins can manage all estimates"
ON btp.tender_estimates
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Users can manage their own estimate items"
ON btp.tender_estimate_items
FOR ALL
TO authenticated
USING (
  btp.tender_estimate_items.estimate_id IN (
    SELECT e.id FROM btp.tender_estimates e
    WHERE e.submitted_by = auth.uid()
  )
)
WITH CHECK (
  btp.tender_estimate_items.estimate_id IN (
    SELECT e.id FROM btp.tender_estimates e
    WHERE e.submitted_by = auth.uid()
  )
);

CREATE POLICY "Admins can view all estimate items"
ON btp.tender_estimate_items
FOR SELECT
TO authenticated
USING (btp.is_current_user_admin());

CREATE POLICY "Admins can manage all estimate items"
ON btp.tender_estimate_items
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Users can view their own submissions"
ON btp.tender_document_submissions
FOR SELECT
TO authenticated
USING (btp.tender_document_submissions.submitted_by = auth.uid());

CREATE POLICY "Users can create their own submissions"
ON btp.tender_document_submissions
FOR INSERT
TO authenticated
WITH CHECK (btp.tender_document_submissions.submitted_by = auth.uid());

CREATE POLICY "Admins can view all submissions"
ON btp.tender_document_submissions
FOR SELECT
TO authenticated
USING (btp.is_current_user_admin());

CREATE POLICY "Admins can manage all submissions"
ON btp.tender_document_submissions
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- =============================================================================
-- ÉTAPE 8 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_estimates TO authenticated;
GRANT SELECT ON btp.tender_estimates TO anon;
GRANT ALL ON btp.tender_estimates TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_estimate_items TO authenticated;
GRANT SELECT ON btp.tender_estimate_items TO anon;
GRANT ALL ON btp.tender_estimate_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_document_submissions TO authenticated;
GRANT SELECT ON btp.tender_document_submissions TO anon;
GRANT ALL ON btp.tender_document_submissions TO service_role;

-- =============================================================================
-- ÉTAPE 9 : INDEX
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tender_estimates_tender
  ON btp.tender_estimates(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_estimates_submitted_by
  ON btp.tender_estimates(submitted_by) WHERE submitted_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tender_estimates_status
  ON btp.tender_estimates(status);

CREATE INDEX IF NOT EXISTS idx_tender_estimate_items_estimate
  ON btp.tender_estimate_items(estimate_id);
CREATE INDEX IF NOT EXISTS idx_tender_estimate_items_material
  ON btp.tender_estimate_items(material_id) WHERE material_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tender_document_submissions_tender
  ON btp.tender_document_submissions(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_document_submissions_submitted_by
  ON btp.tender_document_submissions(submitted_by) WHERE submitted_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tender_document_submissions_status
  ON btp.tender_document_submissions(status);
CREATE INDEX IF NOT EXISTS idx_tender_document_submissions_document
  ON btp.tender_document_submissions(document_id);

CREATE INDEX IF NOT EXISTS idx_tenders_current_phase
  ON btp.tenders(current_phase);

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 10 : FONCTION TRIGGER public.update_timestamp()
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
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 11 : TRIGGERS updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS update_tender_estimates_updated_at ON btp.tender_estimates;
CREATE TRIGGER update_tender_estimates_updated_at
  BEFORE UPDATE ON btp.tender_estimates
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_tender_estimate_items_updated_at ON btp.tender_estimate_items;
CREATE TRIGGER update_tender_estimate_items_updated_at
  BEFORE UPDATE ON btp.tender_estimate_items
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_tender_document_submissions_updated_at ON btp.tender_document_submissions;
CREATE TRIGGER update_tender_document_submissions_updated_at
  BEFORE UPDATE ON btp.tender_document_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Triggers updated_at créés'; END $$;

-- =============================================================================
-- ÉTAPE 12 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_tables TEXT[] := ARRAY[
    'tender_estimates',
    'tender_estimate_items',
    'tender_document_submissions'
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
      AND tablename IN (
        'tender_estimates',
        'tender_estimate_items',
        'tender_document_submissions'
      )
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