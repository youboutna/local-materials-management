-- =============================================================================
-- MIGRATION : 20250831065220_add_sharing_controls_and_fix_tender_documents.sql
-- Date       : 2025-08-31
-- Objet      : Ajouter contrôles de partage + tables de soumissions tender
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated
--   - btp.is_current_user_admin() qualifiée
--   - Triggers via public.update_timestamp()
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
-- ÉTAPE 1 : COLONNES SUR btp.documents
-- =============================================================================

ALTER TABLE btp.documents
  ADD COLUMN IF NOT EXISTS is_shared_with_suppliers BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_internal_only BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deadline_date TIMESTAMPTZ;

DO $$ BEGIN RAISE NOTICE '✅ Colonnes sharing ajoutées à btp.documents'; END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.tender_submissions (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL,
  user_id UUID NOT NULL,
  supplier_name TEXT,
  supplier_email TEXT,
  submission_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'submitted',  -- pas de CHECK
  administrative_score NUMERIC,
  technical_score NUMERIC,
  financial_score NUMERIC,
  total_score NUMERIC,
  evaluator_notes TEXT,
  reviewer_id UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tender_id, user_id)
);

ALTER TABLE btp.tender_submissions
  ADD COLUMN IF NOT EXISTS tender_id UUID,
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS supplier_email TEXT,
  ADD COLUMN IF NOT EXISTS submission_date TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS administrative_score NUMERIC,
  ADD COLUMN IF NOT EXISTS technical_score NUMERIC,
  ADD COLUMN IF NOT EXISTS financial_score NUMERIC,
  ADD COLUMN IF NOT EXISTS total_score NUMERIC,
  ADD COLUMN IF NOT EXISTS evaluator_notes TEXT,
  ADD COLUMN IF NOT EXISTS reviewer_id UUID,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_submissions créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : TABLE btp.tender_submission_documents (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_submission_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES btp.tender_submissions(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES btp.documents(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'administrative',  -- pas de CHECK
  subcategory TEXT,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.tender_submission_documents
  ADD COLUMN IF NOT EXISTS submission_id UUID,
  ADD COLUMN IF NOT EXISTS document_id UUID,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'administrative',
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_submission_documents créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 4 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.tender_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_submissions FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.tender_submission_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_submission_documents FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 5 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('tender_submissions', 'tender_submission_documents')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I',
      v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 6 : POLICIES SÉCURISÉES — btp.tender_submissions
-- =============================================================================

CREATE POLICY "Admins can manage all tender submissions"
ON btp.tender_submissions
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Users can view their own submissions"
ON btp.tender_submissions
FOR SELECT
TO authenticated
USING (btp.tender_submissions.user_id = auth.uid());

CREATE POLICY "Users can insert their own submissions"
ON btp.tender_submissions
FOR INSERT
TO authenticated
WITH CHECK (btp.tender_submissions.user_id = auth.uid());

CREATE POLICY "Users can update their own draft submissions"
ON btp.tender_submissions
FOR UPDATE
TO authenticated
USING (
  btp.tender_submissions.user_id = auth.uid()
  AND btp.tender_submissions.status = 'draft'
)
WITH CHECK (
  btp.tender_submissions.user_id = auth.uid()
);

-- =============================================================================
-- ÉTAPE 7 : POLICIES SÉCURISÉES — btp.tender_submission_documents
-- =============================================================================

CREATE POLICY "Admins can manage all submission documents"
ON btp.tender_submission_documents
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Users can view their submission documents"
ON btp.tender_submission_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM btp.tender_submissions ts
    WHERE ts.id = btp.tender_submission_documents.submission_id
      AND ts.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their submission documents"
ON btp.tender_submission_documents
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM btp.tender_submissions ts
    WHERE ts.id = btp.tender_submission_documents.submission_id
      AND ts.user_id = auth.uid()
  )
);

-- =============================================================================
-- ÉTAPE 8 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_submissions TO authenticated;
GRANT SELECT ON btp.tender_submissions TO anon;
GRANT ALL ON btp.tender_submissions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_submission_documents TO authenticated;
GRANT SELECT ON btp.tender_submission_documents TO anon;
GRANT ALL ON btp.tender_submission_documents TO service_role;

-- =============================================================================
-- ÉTAPE 9 : INDEX
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tender_submissions_tender_id
  ON btp.tender_submissions(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_submissions_user_id
  ON btp.tender_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_tender_submissions_status
  ON btp.tender_submissions(status);

CREATE INDEX IF NOT EXISTS idx_tender_submission_documents_submission_id
  ON btp.tender_submission_documents(submission_id);
CREATE INDEX IF NOT EXISTS idx_tender_submission_documents_document_id
  ON btp.tender_submission_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_tender_submission_documents_category
  ON btp.tender_submission_documents(category);

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 10 : FONCTION public.update_timestamp() (sécurisée)
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

-- =============================================================================
-- ÉTAPE 11 : TRIGGER updated_at (IDEMPOTENT)
-- =============================================================================
-- ✅ FIX : DROP TRIGGER IF EXISTS (CREATE OR REPLACE TRIGGER n'existe pas)
-- ✅ FIX : public.update_timestamp() au lieu de update_updated_at_column()

DROP TRIGGER IF EXISTS update_tender_submissions_updated_at ON btp.tender_submissions;
CREATE TRIGGER update_tender_submissions_updated_at
  BEFORE UPDATE ON btp.tender_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 12 : CONTRAINTE deadline_date SUR btp.tenders (IDEMPOTENTE)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'tenders'
      AND column_name = 'deadline_date'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'tenders'
      AND column_name = 'launch_date'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'valid_deadline_date'
        AND conrelid = 'btp.tenders'::regclass
    ) THEN
      ALTER TABLE btp.tenders
        ADD CONSTRAINT valid_deadline_date
        CHECK (deadline_date IS NULL OR launch_date IS NULL OR deadline_date > launch_date);
      RAISE NOTICE '  ✅ Contrainte valid_deadline_date ajoutée';
    ELSE
      RAISE NOTICE '  ℹ️  Contrainte valid_deadline_date existe déjà';
    END IF;
  ELSE
    RAISE NOTICE '  ℹ️  Colonnes deadline_date ou launch_date absentes — skip';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 13 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_rec RECORD;
  v_tables TEXT[] := ARRAY['tender_submissions', 'tender_submission_documents'];
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
      AND tablename IN ('tender_submissions', 'tender_submission_documents')
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