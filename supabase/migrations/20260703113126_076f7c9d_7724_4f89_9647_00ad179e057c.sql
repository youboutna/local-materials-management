-- =============================================================================
-- MIGRATION : 20260703113126_create_tender_lot_documents.sql
-- Date       : 2026-07-03
-- Objet      : Créer btp.tender_lot_documents + RLS + trigger + index + FK
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - WITH CHECK encadré (pas de (true) nu)
--   - DELETE réservé aux admins
--   - FK tender_id (obligatoire), lot_id, uploaded_by (optionnels)
--   - CHECK structurel : file_size >= 0
--   - Nettoyage des orphelins AVANT les FK
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
-- ÉTAPE 1 : TABLE btp.tender_lot_documents (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_lot_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL,
  lot_id UUID,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  category TEXT,                                 -- pas de CHECK (nomenclature)
  file_url TEXT NOT NULL DEFAULT '',
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compléter les colonnes manquantes
ALTER TABLE btp.tender_lot_documents
  ADD COLUMN IF NOT EXISTS tender_id UUID,
  ADD COLUMN IF NOT EXISTS lot_id UUID,
  ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS file_url TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_lot_documents créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : CHECK STRUCTUREL
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_tender_lot_documents_file_size'
      AND conrelid = 'btp.tender_lot_documents'::regclass
  ) THEN
    ALTER TABLE btp.tender_lot_documents
      ADD CONSTRAINT chk_tender_lot_documents_file_size
      CHECK (file_size IS NULL OR file_size >= 0);
    RAISE NOTICE '  ✅ chk_tender_lot_documents_file_size créé';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 3 : NETTOYAGE DES ORPHELINS + FK
-- =============================================================================

DO $$
DECLARE
  v_orphan_count INT;
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NETTOYAGE DES ORPHELINS AVANT FK';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- ---------------------------------------------------------------------------
  -- 3.1 : FK tender_id → btp.tenders(id)
  -- ---------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'tenders'
  ) THEN
    SELECT COUNT(*) INTO v_orphan_count
    FROM btp.tender_lot_documents d
    LEFT JOIN btp.tenders t ON t.id = d.tender_id
    WHERE d.tender_id IS NOT NULL AND t.id IS NULL;

    IF v_orphan_count > 0 THEN
      RAISE WARNING '  ⚠️  % tender_lot_documents orphelins (tender_id inexistant)', v_orphan_count;

      FOR v_rec IN
        SELECT DISTINCT d.tender_id
        FROM btp.tender_lot_documents d
        LEFT JOIN btp.tenders t ON t.id = d.tender_id
        WHERE d.tender_id IS NOT NULL AND t.id IS NULL
        LIMIT 10
      LOOP
        RAISE NOTICE '     • tender_id orphelin : %', v_rec.tender_id;
      END LOOP;

      DELETE FROM btp.tender_lot_documents d
      WHERE d.tender_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM btp.tenders t WHERE t.id = d.tender_id);

      RAISE NOTICE '  ✅ % lignes orphelines supprimées', v_orphan_count;
    ELSE
      RAISE NOTICE '  ✅ Aucun orphelin sur tender_id';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'fk_tender_lot_documents_tender'
        AND conrelid = 'btp.tender_lot_documents'::regclass
    ) THEN
      ALTER TABLE btp.tender_lot_documents
        ADD CONSTRAINT fk_tender_lot_documents_tender
        FOREIGN KEY (tender_id) REFERENCES btp.tenders(id) ON DELETE CASCADE;
      RAISE NOTICE '  ✅ FK fk_tender_lot_documents_tender créée';
    ELSE
      RAISE NOTICE '  ℹ️  FK fk_tender_lot_documents_tender existe déjà';
    END IF;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 3.2 : FK lot_id → btp.tender_lots(id)
  -- ---------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'tender_lots'
  ) THEN
    SELECT COUNT(*) INTO v_orphan_count
    FROM btp.tender_lot_documents d
    LEFT JOIN btp.tender_lots tl ON tl.id = d.lot_id
    WHERE d.lot_id IS NOT NULL AND tl.id IS NULL;

    IF v_orphan_count > 0 THEN
      RAISE WARNING '  ⚠️  % tender_lot_documents avec lot_id inexistant → SET NULL', v_orphan_count;

      UPDATE btp.tender_lot_documents d
      SET lot_id = NULL
      WHERE d.lot_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM btp.tender_lots tl WHERE tl.id = d.lot_id);

      RAISE NOTICE '  ✅ % lot_id remis à NULL', v_orphan_count;
    ELSE
      RAISE NOTICE '  ✅ Aucun orphelin sur lot_id';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'fk_tender_lot_documents_lot'
        AND conrelid = 'btp.tender_lot_documents'::regclass
    ) THEN
      ALTER TABLE btp.tender_lot_documents
        ADD CONSTRAINT fk_tender_lot_documents_lot
        FOREIGN KEY (lot_id) REFERENCES btp.tender_lots(id) ON DELETE CASCADE;
      RAISE NOTICE '  ✅ FK fk_tender_lot_documents_lot créée';
    END IF;
  END IF;

  -- ---------------------------------------------------------------------------
  -- 3.3 : FK uploaded_by → auth.users(id)
  -- ---------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    SELECT COUNT(*) INTO v_orphan_count
    FROM btp.tender_lot_documents d
    LEFT JOIN auth.users u ON u.id = d.uploaded_by
    WHERE d.uploaded_by IS NOT NULL AND u.id IS NULL;

    IF v_orphan_count > 0 THEN
      RAISE WARNING '  ⚠️  % tender_lot_documents avec uploaded_by inexistant → SET NULL', v_orphan_count;

      UPDATE btp.tender_lot_documents d
      SET uploaded_by = NULL
      WHERE d.uploaded_by IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = d.uploaded_by);

      RAISE NOTICE '  ✅ % uploaded_by remis à NULL', v_orphan_count;
    ELSE
      RAISE NOTICE '  ✅ Aucun orphelin sur uploaded_by';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'fk_tender_lot_documents_uploaded_by'
        AND conrelid = 'btp.tender_lot_documents'::regclass
    ) THEN
      ALTER TABLE btp.tender_lot_documents
        ADD CONSTRAINT fk_tender_lot_documents_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
      RAISE NOTICE '  ✅ FK fk_tender_lot_documents_uploaded_by créée';
    END IF;
  END IF;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 4 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.tender_lot_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_lot_documents FORCE ROW LEVEL SECURITY;

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
    WHERE schemaname = 'btp' AND tablename = 'tender_lot_documents'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.tender_lot_documents', v_rec.policyname);
    RAISE NOTICE '  Policy supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 6 : POLICIES SÉCURISÉES
-- =============================================================================

-- 6.1 : SELECT — authentifié
CREATE POLICY "Authenticated can view tender lot documents"
ON btp.tender_lot_documents
FOR SELECT
TO authenticated
USING (true);

-- 6.2 : INSERT — authentifié avec contenu minimum
CREATE POLICY "Authenticated can insert tender lot documents"
ON btp.tender_lot_documents
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND length(trim(title)) > 0
  AND length(trim(file_url)) > 0
);

-- 6.3 : UPDATE — authentifié avec contenu minimum
CREATE POLICY "Authenticated can update tender lot documents"
ON btp.tender_lot_documents
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND length(trim(title)) > 0
  AND length(trim(file_url)) > 0
);

-- 6.4 : DELETE — admin uniquement
CREATE POLICY "Admins can delete tender lot documents"
ON btp.tender_lot_documents
FOR DELETE
TO authenticated
USING (btp.is_current_user_admin());

-- 6.5 : Admins — gestion complète
CREATE POLICY "Admins can manage tender lot documents"
ON btp.tender_lot_documents
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

COMMENT ON POLICY "Authenticated can view tender lot documents" ON btp.tender_lot_documents IS
  'Tous les utilisateurs authentifiés peuvent lire les documents de lot.';
COMMENT ON POLICY "Authenticated can insert tender lot documents" ON btp.tender_lot_documents IS
  'Insertion avec title et file_url non vides.';
COMMENT ON POLICY "Authenticated can update tender lot documents" ON btp.tender_lot_documents IS
  'Mise à jour avec title et file_url non vides.';
COMMENT ON POLICY "Admins can delete tender lot documents" ON btp.tender_lot_documents IS
  'Seul admin/director peut supprimer un document.';
COMMENT ON POLICY "Admins can manage tender lot documents" ON btp.tender_lot_documents IS
  'Admin/director : gestion complète.';

-- =============================================================================
-- ÉTAPE 7 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_lot_documents TO authenticated;
GRANT SELECT ON btp.tender_lot_documents TO anon;
GRANT ALL ON btp.tender_lot_documents TO service_role;

-- =============================================================================
-- ÉTAPE 8 : INDEX (IDEMPOTENTS)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tender_lot_documents_tender
  ON btp.tender_lot_documents(tender_id);

CREATE INDEX IF NOT EXISTS idx_tender_lot_documents_lot
  ON btp.tender_lot_documents(lot_id)
  WHERE lot_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tender_lot_documents_category
  ON btp.tender_lot_documents(category)
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tender_lot_documents_uploaded_by
  ON btp.tender_lot_documents(uploaded_by)
  WHERE uploaded_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tender_lot_documents_created_at
  ON btp.tender_lot_documents(created_at DESC);

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

DROP TRIGGER IF EXISTS trg_tender_lot_documents_updated_at ON btp.tender_lot_documents;
CREATE TRIGGER trg_tender_lot_documents_updated_at
  BEFORE UPDATE ON btp.tender_lot_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 11 : SEED NOMENCLATURE (cache UI)
-- =============================================================================

INSERT INTO btp.ref_nomenclature (domain, code, label_fr, label_en, sort_order) VALUES
  ('tender_lot_document_category', 'administrative', 'Administratif', 'Administrative', 1),
  ('tender_lot_document_category', 'technical',      'Technique',     'Technical',      2),
  ('tender_lot_document_category', 'financial',      'Financier',     'Financial',      3),
  ('tender_lot_document_category', 'legal',          'Juridique',     'Legal',          4),
  ('tender_lot_document_category', 'other',          'Autre',         'Other',          99)
ON CONFLICT (domain, code) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Seed tender_lot_document_category appliqué'; END $$;

-- =============================================================================
-- ÉTAPE 12 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_fk_count INT;
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
  WHERE n.nspname = 'btp' AND c.relname = 'tender_lot_documents';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'tender_lot_documents';
  RAISE NOTICE 'Policies : %', v_policy_count;

  SELECT COUNT(*) INTO v_fk_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'btp'
    AND t.relname = 'tender_lot_documents'
    AND c.contype = 'f';
  RAISE NOTICE 'FK : %', v_fk_count;

  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'btp' AND tablename = 'tender_lot_documents';
  RAISE NOTICE 'Index : %', v_index_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'tender_lot_documents'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des FK :';
  FOR v_rec IN
    SELECT
      c.conname,
      kcu.column_name AS source_col,
      ccu.table_schema AS target_schema,
      ccu.table_name AS target_table,
      ccu.column_name AS target_col
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = c.conname
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = c.conname
    WHERE n.nspname = 'btp'
      AND t.relname = 'tender_lot_documents'
      AND c.contype = 'f'
    ORDER BY c.conname
  LOOP
    RAISE NOTICE '   • % : % → %.%.%',
      v_rec.conname, v_rec.source_col,
      v_rec.target_schema, v_rec.target_table, v_rec.target_col;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;