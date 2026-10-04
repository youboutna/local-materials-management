-- =============================================================================
-- MIGRATION : 20260903000000_boq_document_headers.sql
-- Date       : 2026-09-03
-- Objet      : Créer btp.boq_document_headers + RLS + trigger + index
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - DELETE réservé aux admins
--   - Trigger via public.update_timestamp()
--   - Pas de doublon UNIQUE + INDEX
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
-- ÉTAPE 1 : TABLE btp.boq_document_headers (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.boq_document_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,

  -- DocumentHeaderDTO
  reference TEXT,
  issue_date DATE,
  currency TEXT DEFAULT 'MRU',
  validity_days INTEGER DEFAULT 30,
  facturx_type_code TEXT DEFAULT '310',
  notes TEXT,

  -- Émetteur (DocumentPartyDTO)
  sender_id UUID,
  sender_name TEXT NOT NULL DEFAULT '',
  sender_kind TEXT,
  sender_tax_id TEXT,
  sender_address TEXT,
  sender_phone TEXT,
  sender_email TEXT,

  -- Destinataire principal (DocumentPartyDTO)
  recipient_id UUID,
  recipient_name TEXT NOT NULL DEFAULT '',
  recipient_kind TEXT,
  recipient_tax_id TEXT,
  recipient_address TEXT,
  recipient_phone TEXT,
  recipient_email TEXT,

  -- Destinataires additionnels (DocumentPartyDTO[])
  extra_recipients JSONB DEFAULT '[]'::jsonb,

  -- Workflow
  workflow_stage TEXT DEFAULT 'draft',
  validation_status TEXT,
  validation_comment TEXT,

  -- Signature
  signed_by TEXT,
  signed_at TIMESTAMPTZ,
  signature_role TEXT,

  -- Traçabilité DQE
  source_document_id UUID,
  source_document_type TEXT,
  next_document_id UUID,
  next_document_type TEXT,
  stages_history JSONB DEFAULT '[]'::jsonb,
  workflow_instance_id TEXT,

  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID
);

-- Compléter les colonnes manquantes (idempotent)
ALTER TABLE btp.boq_document_headers
  ADD COLUMN IF NOT EXISTS document_id UUID,
  ADD COLUMN IF NOT EXISTS reference TEXT,
  ADD COLUMN IF NOT EXISTS issue_date DATE,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'MRU',
  ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS facturx_type_code TEXT DEFAULT '310',
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS sender_id UUID,
  ADD COLUMN IF NOT EXISTS sender_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS sender_kind TEXT,
  ADD COLUMN IF NOT EXISTS sender_tax_id TEXT,
  ADD COLUMN IF NOT EXISTS sender_address TEXT,
  ADD COLUMN IF NOT EXISTS sender_phone TEXT,
  ADD COLUMN IF NOT EXISTS sender_email TEXT,
  ADD COLUMN IF NOT EXISTS recipient_id UUID,
  ADD COLUMN IF NOT EXISTS recipient_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS recipient_kind TEXT,
  ADD COLUMN IF NOT EXISTS recipient_tax_id TEXT,
  ADD COLUMN IF NOT EXISTS recipient_address TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
  ADD COLUMN IF NOT EXISTS recipient_email TEXT,
  ADD COLUMN IF NOT EXISTS extra_recipients JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS workflow_stage TEXT DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS validation_status TEXT,
  ADD COLUMN IF NOT EXISTS validation_comment TEXT,
  ADD COLUMN IF NOT EXISTS signed_by TEXT,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signature_role TEXT,
  ADD COLUMN IF NOT EXISTS source_document_id UUID,
  ADD COLUMN IF NOT EXISTS source_document_type TEXT,
  ADD COLUMN IF NOT EXISTS next_document_id UUID,
  ADD COLUMN IF NOT EXISTS next_document_type TEXT,
  ADD COLUMN IF NOT EXISTS stages_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS workflow_instance_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.boq_document_headers créée/complétée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : UNIQUE (document_id) — IDEMPOTENT
-- =============================================================================
-- ⚠️ On utilise UNIQUEMENT un index unique (pas de contrainte doublon).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'btp'
      AND tablename = 'boq_document_headers'
      AND indexname = 'idx_boq_doc_headers_document_id'
  ) THEN
    CREATE UNIQUE INDEX idx_boq_doc_headers_document_id
      ON btp.boq_document_headers(document_id);
    RAISE NOTICE '  ✅ UNIQUE INDEX idx_boq_doc_headers_document_id créé';
  ELSE
    RAISE NOTICE '  ℹ️  UNIQUE INDEX idx_boq_doc_headers_document_id existe déjà';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 3 : CHECK STRUCTURELS
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_boq_doc_headers_validity_days'
      AND conrelid = 'btp.boq_document_headers'::regclass
  ) THEN
    ALTER TABLE btp.boq_document_headers
      ADD CONSTRAINT chk_boq_doc_headers_validity_days
      CHECK (validity_days IS NULL OR validity_days >= 0);
    RAISE NOTICE '  ✅ chk_boq_doc_headers_validity_days créé';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 4 : INDEX (IDEMPOTENTS)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_boq_doc_headers_workflow_stage
  ON btp.boq_document_headers(workflow_stage);

CREATE INDEX IF NOT EXISTS idx_boq_doc_headers_source_doc
  ON btp.boq_document_headers(source_document_id)
  WHERE source_document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_boq_doc_headers_next_doc
  ON btp.boq_document_headers(next_document_id)
  WHERE next_document_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_boq_doc_headers_created_at
  ON btp.boq_document_headers(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_boq_doc_headers_reference
  ON btp.boq_document_headers(reference)
  WHERE reference IS NOT NULL;

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 5 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.boq_document_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.boq_document_headers FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 6 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'boq_document_headers'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.boq_document_headers', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 7 : POLICIES SÉCURISÉES
-- =============================================================================

-- 7.1 : SELECT — authentifié (lecture des en-têtes BOQ)
CREATE POLICY "boq_doc_headers_select"
ON btp.boq_document_headers
FOR SELECT
TO authenticated
USING (true);

-- 7.2 : INSERT — authentifié avec contenu minimum
CREATE POLICY "boq_doc_headers_insert"
ON btp.boq_document_headers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND btp.boq_document_headers.document_id IS NOT NULL
  AND length(trim(btp.boq_document_headers.sender_name)) > 0
  AND length(trim(btp.boq_document_headers.recipient_name)) > 0
);

-- 7.3 : UPDATE — authentifié avec contenu minimum
CREATE POLICY "boq_doc_headers_update"
ON btp.boq_document_headers
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND length(trim(btp.boq_document_headers.sender_name)) > 0
  AND length(trim(btp.boq_document_headers.recipient_name)) > 0
);

-- 7.4 : DELETE — admin uniquement
CREATE POLICY "boq_doc_headers_delete"
ON btp.boq_document_headers
FOR DELETE
TO authenticated
USING (btp.is_current_user_admin());

-- 7.5 : Admins — gestion complète
CREATE POLICY "boq_doc_headers_manage_admin"
ON btp.boq_document_headers
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "boq_doc_headers_select" ON btp.boq_document_headers IS
  'Tous les utilisateurs authentifiés peuvent lire les en-têtes BOQ.';
COMMENT ON POLICY "boq_doc_headers_insert" ON btp.boq_document_headers IS
  'Insertion avec sender_name et recipient_name non vides.';
COMMENT ON POLICY "boq_doc_headers_update" ON btp.boq_document_headers IS
  'Mise à jour avec sender_name et recipient_name non vides.';
COMMENT ON POLICY "boq_doc_headers_delete" ON btp.boq_document_headers IS
  'Seul admin/director peut supprimer un en-tête BOQ.';
COMMENT ON POLICY "boq_doc_headers_manage_admin" ON btp.boq_document_headers IS
  'Admin/director : gestion complète.';

-- =============================================================================
-- ÉTAPE 8 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.boq_document_headers TO authenticated;
GRANT SELECT ON btp.boq_document_headers TO anon;
GRANT ALL ON btp.boq_document_headers TO service_role;

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

DROP TRIGGER IF EXISTS trg_boq_doc_headers_updated_at ON btp.boq_document_headers;
CREATE TRIGGER trg_boq_doc_headers_updated_at
  BEFORE UPDATE ON btp.boq_document_headers
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 11 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_index_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'boq_document_headers';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'boq_document_headers';
  RAISE NOTICE 'Policies : %', v_policy_count;

  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'btp' AND tablename = 'boq_document_headers';
  RAISE NOTICE 'Index : %', v_index_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'boq_document_headers'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des index :';
  FOR v_rec IN
    SELECT indexname FROM pg_indexes
    WHERE schemaname = 'btp' AND tablename = 'boq_document_headers'
    ORDER BY indexname
  LOOP
    RAISE NOTICE '   • %', v_rec.indexname;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;