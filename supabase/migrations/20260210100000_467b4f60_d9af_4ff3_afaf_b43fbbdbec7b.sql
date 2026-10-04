-- =============================================================================
-- MIGRATION : 20260210100000_create_compliance_tables.sql
-- Date       : 2026-02-10
-- Objet      : Créer les tables de conformité
--              - btp.compliance_items
--              - btp.compliance_documents
--              - btp.compliance_notes
--              - btp.compliance_audit_log
--
-- SÉCURITÉ :
--   - Idempotente : CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS
--   - RLS activé + FORCE + policies sécurisées
--   - Pas de CHECK sur les nomenclatures (validation côté référentiels)
--   - Trigger via public.update_timestamp()
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
-- ÉTAPE 1 : TABLE btp.compliance_items
-- =============================================================================
-- ⚠️ Pas de CHECK sur type/status/priority : validation côté référentiels TS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.compliance_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(50) NOT NULL DEFAULT 'regulatory',        -- pas de CHECK
  title VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',         -- pas de CHECK
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',        -- pas de CHECK
  deadline DATE,
  responsible VARCHAR(255) NOT NULL DEFAULT '',
  project_id UUID NOT NULL,
  bank_guarantee_id UUID,
  created_by VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(255)
);

-- Compléter les colonnes manquantes (idempotent)
ALTER TABLE btp.compliance_items
  ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'regulatory',
  ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS deadline DATE,
  ADD COLUMN IF NOT EXISTS responsible VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS project_id UUID,
  ADD COLUMN IF NOT EXISTS bank_guarantee_id UUID,
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Supprimer les CHECK de nomenclature (si présents d'une version antérieure)
DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    JOIN information_schema.columns col
      ON col.table_schema = n.nspname
     AND col.table_name = t.relname
     AND col.column_name = a.attname
    WHERE n.nspname = 'btp'
      AND t.relname = 'compliance_items'
      AND c.contype = 'c'
      AND col.data_type IN ('text', 'character varying')
      AND pg_get_constraintdef(c.oid) ILIKE '%IN (%'
  LOOP
    EXECUTE format('ALTER TABLE btp.compliance_items DROP CONSTRAINT IF EXISTS %I',
      v_rec.conname);
    RAISE NOTICE '  ✅ Contrainte supprimée : %', v_rec.conname;
  END LOOP;
END $$;

-- Ajouter les FK si absentes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_compliance_items_project'
      AND conrelid = 'btp.compliance_items'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'projects'
  ) THEN
    ALTER TABLE btp.compliance_items
      ADD CONSTRAINT fk_compliance_items_project
      FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_compliance_items_project';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_compliance_items_bank_guarantee'
      AND conrelid = 'btp.compliance_items'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'bank_guarantees'
  ) THEN
    ALTER TABLE btp.compliance_items
      ADD CONSTRAINT fk_compliance_items_bank_guarantee
      FOREIGN KEY (bank_guarantee_id) REFERENCES btp.bank_guarantees(id) ON DELETE SET NULL;
    RAISE NOTICE '  ✅ FK fk_compliance_items_bank_guarantee';
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.compliance_items créée/complétée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.compliance_documents
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.compliance_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_item_id UUID NOT NULL,
  document_id UUID NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'general',
  subcategory VARCHAR(100),
  is_required BOOLEAN DEFAULT false,
  uploaded_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE btp.compliance_documents
  ADD COLUMN IF NOT EXISTS compliance_item_id UUID,
  ADD COLUMN IF NOT EXISTS document_id UUID,
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR(255),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- FK
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_compliance_documents_item'
      AND conrelid = 'btp.compliance_documents'::regclass
  ) THEN
    ALTER TABLE btp.compliance_documents
      ADD CONSTRAINT fk_compliance_documents_item
      FOREIGN KEY (compliance_item_id) REFERENCES btp.compliance_items(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_compliance_documents_item';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_compliance_documents_document'
      AND conrelid = 'btp.compliance_documents'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'documents'
  ) THEN
    ALTER TABLE btp.compliance_documents
      ADD CONSTRAINT fk_compliance_documents_document
      FOREIGN KEY (document_id) REFERENCES btp.documents(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_compliance_documents_document';
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.compliance_documents créée/complétée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : TABLE btp.compliance_notes
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.compliance_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_item_id UUID NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  created_by VARCHAR(255) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE btp.compliance_notes
  ADD COLUMN IF NOT EXISTS compliance_item_id UUID,
  ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_compliance_notes_item'
      AND conrelid = 'btp.compliance_notes'::regclass
  ) THEN
    ALTER TABLE btp.compliance_notes
      ADD CONSTRAINT fk_compliance_notes_item
      FOREIGN KEY (compliance_item_id) REFERENCES btp.compliance_items(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_compliance_notes_item';
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.compliance_notes créée/complétée'; END $$;

-- =============================================================================
-- ÉTAPE 4 : TABLE btp.compliance_audit_log
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.compliance_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compliance_item_id UUID NOT NULL,
  field_name VARCHAR(100) NOT NULL DEFAULT '',
  old_value TEXT,
  new_value TEXT,
  changed_by VARCHAR(255) NOT NULL DEFAULT '',
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE btp.compliance_audit_log
  ADD COLUMN IF NOT EXISTS compliance_item_id UUID,
  ADD COLUMN IF NOT EXISTS field_name VARCHAR(100) DEFAULT '',
  ADD COLUMN IF NOT EXISTS old_value TEXT,
  ADD COLUMN IF NOT EXISTS new_value TEXT,
  ADD COLUMN IF NOT EXISTS changed_by VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS changed_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_compliance_audit_item'
      AND conrelid = 'btp.compliance_audit_log'::regclass
  ) THEN
    ALTER TABLE btp.compliance_audit_log
      ADD CONSTRAINT fk_compliance_audit_item
      FOREIGN KEY (compliance_item_id) REFERENCES btp.compliance_items(id) ON DELETE CASCADE;
    RAISE NOTICE '  ✅ FK fk_compliance_audit_item';
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.compliance_audit_log créée/complétée'; END $$;

-- =============================================================================
-- ÉTAPE 5 : RLS + FORCE SUR LES 4 TABLES
-- =============================================================================

ALTER TABLE btp.compliance_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.compliance_items FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.compliance_documents FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.compliance_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.compliance_notes FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.compliance_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.compliance_audit_log FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 6 : NETTOYAGE DES POLICIES EXISTANTES
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN (
        'compliance_items',
        'compliance_documents',
        'compliance_notes',
        'compliance_audit_log'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I',
      v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 7 : POLICIES SÉCURISÉES
-- =============================================================================

-- 7.1 : compliance_items
CREATE POLICY "Admins can manage compliance items"
ON btp.compliance_items
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view compliance items"
ON btp.compliance_items
FOR SELECT
TO authenticated
USING (true);

-- 7.2 : compliance_documents
CREATE POLICY "Admins can manage compliance documents"
ON btp.compliance_documents
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view compliance documents"
ON btp.compliance_documents
FOR SELECT
TO authenticated
USING (true);

-- 7.3 : compliance_notes
CREATE POLICY "Admins can manage compliance notes"
ON btp.compliance_notes
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view compliance notes"
ON btp.compliance_notes
FOR SELECT
TO authenticated
USING (true);

-- 7.4 : compliance_audit_log
CREATE POLICY "Admins can manage compliance audit log"
ON btp.compliance_audit_log
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

CREATE POLICY "Authenticated can view compliance audit log"
ON btp.compliance_audit_log
FOR SELECT
TO authenticated
USING (true);

DO $$ BEGIN RAISE NOTICE '✅ Policies créées sur les 4 tables'; END $$;

-- =============================================================================
-- ÉTAPE 8 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.compliance_items TO authenticated;
GRANT SELECT ON btp.compliance_items TO anon;
GRANT ALL ON btp.compliance_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.compliance_documents TO authenticated;
GRANT SELECT ON btp.compliance_documents TO anon;
GRANT ALL ON btp.compliance_documents TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.compliance_notes TO authenticated;
GRANT SELECT ON btp.compliance_notes TO anon;
GRANT ALL ON btp.compliance_notes TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.compliance_audit_log TO authenticated;
GRANT SELECT ON btp.compliance_audit_log TO anon;
GRANT ALL ON btp.compliance_audit_log TO service_role;

-- =============================================================================
-- ÉTAPE 9 : INDEX (idempotents)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_compliance_items_project_id
  ON btp.compliance_items(project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_items_status
  ON btp.compliance_items(status);
CREATE INDEX IF NOT EXISTS idx_compliance_items_priority
  ON btp.compliance_items(priority);
CREATE INDEX IF NOT EXISTS idx_compliance_items_type
  ON btp.compliance_items(type);
CREATE INDEX IF NOT EXISTS idx_compliance_items_deadline
  ON btp.compliance_items(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_compliance_items_bank_guarantee_id
  ON btp.compliance_items(bank_guarantee_id) WHERE bank_guarantee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_compliance_documents_item_id
  ON btp.compliance_documents(compliance_item_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_document_id
  ON btp.compliance_documents(document_id);

CREATE INDEX IF NOT EXISTS idx_compliance_notes_item_id
  ON btp.compliance_notes(compliance_item_id);

CREATE INDEX IF NOT EXISTS idx_compliance_audit_item_id
  ON btp.compliance_audit_log(compliance_item_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_changed_at
  ON btp.compliance_audit_log(changed_at DESC);

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 10 : FONCTION TRIGGER public.update_timestamp() (sécurisée)
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
-- ÉTAPE 11 : TRIGGER updated_at sur compliance_items
-- =============================================================================

DROP TRIGGER IF EXISTS update_compliance_items_updated_at ON btp.compliance_items;
CREATE TRIGGER update_compliance_items_updated_at
  BEFORE UPDATE ON btp.compliance_items
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 12 : SEED NOMENCLATURES (cache UI)
-- =============================================================================

INSERT INTO btp.ref_nomenclature (domain, code, label_fr, label_en, sort_order) VALUES
  -- Compliance types
  ('compliance_type', 'regulatory',      'Réglementaire',  'Regulatory',     1),
  ('compliance_type', 'insurance',       'Assurance',      'Insurance',      2),
  ('compliance_type', 'bank_guarantee',  'Garantie bancaire', 'Bank Guarantee', 3),
  ('compliance_type', 'technical',       'Technique',      'Technical',      4),
  ('compliance_type', 'environmental',   'Environnemental','Environmental',  5),

  -- Compliance statuses
  ('compliance_status', 'pending',     'En attente', 'Pending',     1),
  ('compliance_status', 'in_progress', 'En cours',   'In Progress', 2),
  ('compliance_status', 'approved',    'Approuvé',   'Approved',    3),
  ('compliance_status', 'rejected',    'Rejeté',     'Rejected',    4),

  -- Compliance priorities
  ('compliance_priority', 'low',      'Basse',    'Low',      1),
  ('compliance_priority', 'medium',   'Moyenne',  'Medium',   2),
  ('compliance_priority', 'high',     'Haute',    'High',     3),
  ('compliance_priority', 'critical', 'Critique', 'Critical', 4)
ON CONFLICT (domain, code) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Seed nomenclatures compliance appliqué'; END $$;

-- =============================================================================
-- ÉTAPE 13 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_check_count INT;
  v_tables TEXT[] := ARRAY[
    'compliance_items',
    'compliance_documents',
    'compliance_notes',
    'compliance_audit_log'
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

    SELECT COUNT(*) INTO v_check_count
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'btp'
      AND t.relname = v_tbl
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%IN (%';

    IF v_check_count > 0 THEN
      RAISE WARNING '   ⚠️  % contrainte(s) CHECK de nomenclature', v_check_count;
    END IF;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;