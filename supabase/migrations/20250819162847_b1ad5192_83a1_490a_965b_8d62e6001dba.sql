-- =============================================================================
-- MIGRATION : 20250819162847_create_tender_steps.sql
-- Date       : 2025-08-19
-- Objet      : Créer/compléter btp.tender_steps + btp.tender_step_documents
--              + RLS + triggers + index
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + DROP POLICY/TRIGGER IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated + is_current_user_admin() pour writes
--   - Pas de CHECK sur les statuts (validation côté référentiels)
--   - Trigger via public.update_timestamp() (SECURITY DEFINER)
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.tender_steps (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES btp.tenders(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  required_documents TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',  -- ⚠️ pas de CHECK : validation côté app
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tender_id, step_number)
);

-- Compléter les colonnes manquantes
ALTER TABLE btp.tender_steps
  ADD COLUMN IF NOT EXISTS tender_id UUID,
  ADD COLUMN IF NOT EXISTS step_number INTEGER,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS required_documents TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_steps créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.tender_step_documents (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_step_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id UUID NOT NULL REFERENCES btp.tender_steps(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES btp.documents(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'pending',  -- ⚠️ pas de CHECK
  submitted_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(step_id, document_id)
);

-- Compléter les colonnes manquantes
ALTER TABLE btp.tender_step_documents
  ADD COLUMN IF NOT EXISTS step_id UUID,
  ADD COLUMN IF NOT EXISTS document_id UUID,
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewer_notes TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_step_documents créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : RLS
-- =============================================================================

ALTER TABLE btp.tender_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_steps FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.tender_step_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_step_documents FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 4 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('tender_steps', 'tender_step_documents')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I',
      v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
  END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 5 : POLICIES SÉCURISÉES
-- =============================================================================

-- 5.1 : btp.tender_steps
CREATE POLICY "Admins can manage tender steps"
ON btp.tender_steps
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view tender steps"
ON btp.tender_steps
FOR SELECT
TO authenticated
USING (true);

-- 5.2 : btp.tender_step_documents
CREATE POLICY "Admins can manage tender step documents"
ON btp.tender_step_documents
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view tender step documents"
ON btp.tender_step_documents
FOR SELECT
TO authenticated
USING (true);

COMMENT ON POLICY "Admins can manage tender steps" ON btp.tender_steps IS
  'Admin/director : gestion complète.';
COMMENT ON POLICY "Authenticated can view tender steps" ON btp.tender_steps IS
  'Utilisateurs authentifiés : lecture.';
COMMENT ON POLICY "Admins can manage tender step documents" ON btp.tender_step_documents IS
  'Admin/director : gestion complète.';
COMMENT ON POLICY "Authenticated can view tender step documents" ON btp.tender_step_documents IS
  'Utilisateurs authentifiés : lecture.';

-- =============================================================================
-- ÉTAPE 6 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_steps TO authenticated;
GRANT SELECT ON btp.tender_steps TO anon;
GRANT ALL ON btp.tender_steps TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_step_documents TO authenticated;
GRANT SELECT ON btp.tender_step_documents TO anon;
GRANT ALL ON btp.tender_step_documents TO service_role;

-- =============================================================================
-- ÉTAPE 7 : INDEX (IDEMPOTENTS)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tender_steps_tender_id
  ON btp.tender_steps(tender_id);

CREATE INDEX IF NOT EXISTS idx_tender_steps_status
  ON btp.tender_steps(status);

CREATE INDEX IF NOT EXISTS idx_tender_step_documents_step_id
  ON btp.tender_step_documents(step_id);

CREATE INDEX IF NOT EXISTS idx_tender_step_documents_document_id
  ON btp.tender_step_documents(document_id);

CREATE INDEX IF NOT EXISTS idx_tender_step_documents_status
  ON btp.tender_step_documents(status);

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 8 : TRIGGERS updated_at (IDEMPOTENTS)
-- =============================================================================

-- Vérifier/créer public.update_timestamp()
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

-- Trigger tender_steps
DROP TRIGGER IF EXISTS update_tender_steps_updated_at ON btp.tender_steps;
CREATE TRIGGER update_tender_steps_updated_at
  BEFORE UPDATE ON btp.tender_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

-- Trigger tender_step_documents
DROP TRIGGER IF EXISTS update_tender_step_documents_updated_at ON btp.tender_step_documents;
CREATE TRIGGER update_tender_step_documents_updated_at
  BEFORE UPDATE ON btp.tender_step_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Triggers updated_at créés'; END $$;

-- =============================================================================
-- ÉTAPE 9 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_trigger_exists BOOLEAN;
  v_rec RECORD;
  v_tables TEXT[] := ARRAY['tender_steps', 'tender_step_documents'];
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
      AND tablename IN ('tender_steps', 'tender_step_documents')
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