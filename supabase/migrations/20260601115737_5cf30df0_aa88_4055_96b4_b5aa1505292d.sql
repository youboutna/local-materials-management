-- =============================================================================
-- MIGRATION : 20260601115737_create_inspection_documents.sql
-- Date       : 2026-06-01
-- Objet      : Créer btp.inspection_documents + RLS + trigger + index
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - WITH CHECK encadré (pas de (true) nu)
--   - DELETE réservé aux admins
--   - FK inspection_id → btp.inspections(id)
--   - FK uploaded_by → auth.users(id)
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
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.inspection_documents (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.inspection_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL,
  document_id TEXT,                                    -- référence externe (URL, ID S3, etc.)
  document_name TEXT NOT NULL DEFAULT '',
  document_url TEXT NOT NULL DEFAULT '',
  document_type TEXT,                                  -- pas de CHECK (nomenclature)
  file_size BIGINT,
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compléter les colonnes manquantes
ALTER TABLE btp.inspection_documents
  ADD COLUMN IF NOT EXISTS inspection_id UUID,
  ADD COLUMN IF NOT EXISTS document_id TEXT,
  ADD COLUMN IF NOT EXISTS document_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS document_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.inspection_documents créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : CHECK STRUCTUREL (file_size >= 0)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_inspection_documents_file_size'
      AND conrelid = 'btp.inspection_documents'::regclass
  ) THEN
    ALTER TABLE btp.inspection_documents
      ADD CONSTRAINT chk_inspection_documents_file_size
      CHECK (file_size IS NULL OR file_size >= 0);
    RAISE NOTICE '  ✅ chk_inspection_documents_file_size créé';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 3 : FK VERS btp.inspections ET auth.users
-- =============================================================================

DO $$
BEGIN
  -- FK inspection_id → btp.inspections(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_inspection_documents_inspection'
      AND conrelid = 'btp.inspection_documents'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'inspections'
  ) THEN
    ALTER TABLE btp.inspection_documents
      ADD CONSTRAINT fk_inspection_documents_inspection
      FOREIGN KEY (inspection_id) REFERENCES btp.inspections(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_inspection_documents_inspection créée';
  END IF;

  -- FK uploaded_by → auth.users(id)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_inspection_documents_uploaded_by'
      AND conrelid = 'btp.inspection_documents'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    ALTER TABLE btp.inspection_documents
      ADD CONSTRAINT fk_inspection_documents_uploaded_by
      FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '  ✅ FK fk_inspection_documents_uploaded_by créée';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 4 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.inspection_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.inspection_documents FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 5 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'inspection_documents'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.inspection_documents', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 6 : POLICIES SÉCURISÉES
-- =============================================================================

-- 6.1 : SELECT — authentifié
CREATE POLICY "Authenticated can read inspection documents"
ON btp.inspection_documents
FOR SELECT
TO authenticated
USING (true);

-- 6.2 : INSERT — authentifié avec contenu minimum
CREATE POLICY "Authenticated can create inspection documents"
ON btp.inspection_documents
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND length(trim(document_name)) > 0
  AND length(trim(document_url)) > 0
);

-- 6.3 : UPDATE — authentifié avec contenu minimum
CREATE POLICY "Authenticated can update inspection documents"
ON btp.inspection_documents
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND length(trim(document_name)) > 0
  AND length(trim(document_url)) > 0
);

-- 6.4 : DELETE — admin uniquement (plus sûr)
CREATE POLICY "Admins can delete inspection documents"
ON btp.inspection_documents
FOR DELETE
TO authenticated
USING (btp.is_current_user_admin());

-- 6.5 : Admins — gestion complète
CREATE POLICY "Admins can manage inspection documents"
ON btp.inspection_documents
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "Authenticated can read inspection documents" ON btp.inspection_documents IS
  'Tous les utilisateurs authentifiés peuvent lire les documents d''inspection.';
COMMENT ON POLICY "Authenticated can create inspection documents" ON btp.inspection_documents IS
  'Création avec document_name et document_url non vides.';
COMMENT ON POLICY "Authenticated can update inspection documents" ON btp.inspection_documents IS
  'Mise à jour avec document_name et document_url non vides.';
COMMENT ON POLICY "Admins can delete inspection documents" ON btp.inspection_documents IS
  'Seul admin/director peut supprimer un document.';
COMMENT ON POLICY "Admins can manage inspection documents" ON btp.inspection_documents IS
  'Admin/director : gestion complète.';

-- =============================================================================
-- ÉTAPE 7 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.inspection_documents TO authenticated;
GRANT SELECT ON btp.inspection_documents TO anon;
GRANT ALL ON btp.inspection_documents TO service_role;

-- =============================================================================
-- ÉTAPE 8 : INDEX (IDEMPOTENTS)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_inspection_documents_inspection_id
  ON btp.inspection_documents(inspection_id);

CREATE INDEX IF NOT EXISTS idx_inspection_documents_uploaded_at
  ON btp.inspection_documents(uploaded_at DESC);

CREATE INDEX IF NOT EXISTS idx_inspection_documents_uploaded_by
  ON btp.inspection_documents(uploaded_by)
  WHERE uploaded_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inspection_documents_document_type
  ON btp.inspection_documents(document_type)
  WHERE document_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inspection_documents_document_id
  ON btp.inspection_documents(document_id)
  WHERE document_id IS NOT NULL;

-- Index composite pour recherche par inspection + date
CREATE INDEX IF NOT EXISTS idx_inspection_documents_inspection_date
  ON btp.inspection_documents(inspection_id, uploaded_at DESC);

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 9 : FONCTION TRIGGER public.update_timestamp() (sécurisée)
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
-- ÉTAPE 10 : TRIGGER updated_at (IDEMPOTENT)
-- =============================================================================

DROP TRIGGER IF EXISTS update_inspection_documents_updated_at ON btp.inspection_documents;
CREATE TRIGGER update_inspection_documents_updated_at
  BEFORE UPDATE ON btp.inspection_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 11 : SEED NOMENCLATURE (cache UI)
-- =============================================================================

INSERT INTO btp.ref_nomenclature (domain, code, label_fr, label_en, sort_order) VALUES
  ('inspection_document_type', 'photo',       'Photo',           'Photo',        1),
  ('inspection_document_type', 'rapport',     'Rapport',         'Report',       2),
  ('inspection_document_type', 'plan',        'Plan',            'Plan',         3),
  ('inspection_document_type', 'certificat',  'Certificat',      'Certificate',  4),
  ('inspection_document_type', 'pv',          'PV',              'PV',           5),
  ('inspection_document_type', 'autre',       'Autre',           'Other',        99)
ON CONFLICT (domain, code) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Seed inspection_document_type appliqué'; END $$;

-- =============================================================================
-- ÉTAPE 12 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'inspection_documents';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'inspection_documents';
  RAISE NOTICE 'Policies : %', v_policy_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'inspection_documents'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;