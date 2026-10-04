-- =============================================================================
-- MIGRATION : 20260210100001_create_compliance_indexes.sql
-- Date       : 2026-02-10
-- Objet      : Index de performance pour les tables compliance
--
-- SÉCURITÉ :
--   - Idempotente : CREATE INDEX IF NOT EXISTS
--   - Vérification des tables ET des colonnes avant création
--   - Index partiels (WHERE IS NOT NULL) sur colonnes nullable
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : VÉRIFIER QUE LES TABLES EXISTENT
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_required_tables TEXT[] := ARRAY[
    'compliance_items',
    'compliance_documents',
    'compliance_notes',
    'compliance_audit_log'
  ];
  v_tbl TEXT;
  v_missing TEXT[] := ARRAY[]::TEXT[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION DES TABLES';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOREACH v_tbl IN ARRAY v_required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'btp' AND table_name = v_tbl
    ) THEN
      v_missing := array_append(v_missing, v_tbl);
      RAISE WARNING '  ⚠️  btp.% absente', v_tbl;
    ELSE
      RAISE NOTICE '  ✅ btp.% présente', v_tbl;
    END IF;
  END LOOP;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE NOTICE '  ⚠️  Tables manquantes : %', array_to_string(v_missing, ', ');
    RAISE NOTICE '  → Les index correspondants seront skippés';
  END IF;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- FONCTION HELPER : Créer un index SEULEMENT si table + colonnes existent
-- =============================================================================

CREATE OR REPLACE FUNCTION pg_temp.safe_create_index(
  p_schema TEXT,
  p_table TEXT,
  p_index_name TEXT,
  p_columns TEXT[],
  p_where TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_col TEXT;
  v_missing TEXT[] := ARRAY[]::TEXT[];
  v_cols_sql TEXT;
  v_sql TEXT;
BEGIN
  -- 1. Vérifier que la table existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = p_schema AND table_name = p_table
  ) THEN
    RAISE NOTICE '  ℹ️  Index % skippé : table %.% inexistante',
      p_index_name, p_schema, p_table;
    RETURN;
  END IF;

  -- 2. Vérifier que toutes les colonnes existent
  FOREACH v_col IN ARRAY p_columns
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = p_schema
        AND table_name = p_table
        AND column_name = v_col
    ) THEN
      v_missing := array_append(v_missing, v_col);
    END IF;
  END LOOP;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE WARNING '  ⚠️  Index % skippé : colonne(s) manquante(s) dans %.% : %',
      p_index_name, p_schema, p_table, array_to_string(v_missing, ', ');
    RETURN;
  END IF;

  -- 3. Construire et exécuter le CREATE INDEX
  v_cols_sql := array_to_string(p_columns, ', ');
  v_sql := format(
    'CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s)',
    p_index_name, p_schema, p_table, v_cols_sql
  );

  IF p_where IS NOT NULL THEN
    v_sql := v_sql || ' WHERE ' || p_where;
  END IF;

  EXECUTE v_sql;
  RAISE NOTICE '  ✅ %', p_index_name;
END $$;

-- =============================================================================
-- ÉTAPE 1 : INDEX btp.compliance_items
-- =============================================================================

DO $$ BEGIN RAISE NOTICE ''; RAISE NOTICE '→ Index btp.compliance_items'; END $$;

SELECT pg_temp.safe_create_index('btp', 'compliance_items',
  'idx_compliance_items_project', ARRAY['project_id']);

SELECT pg_temp.safe_create_index('btp', 'compliance_items',
  'idx_compliance_items_status', ARRAY['status']);

SELECT pg_temp.safe_create_index('btp', 'compliance_items',
  'idx_compliance_items_priority', ARRAY['priority']);

SELECT pg_temp.safe_create_index('btp', 'compliance_items',
  'idx_compliance_items_type', ARRAY['type']);

SELECT pg_temp.safe_create_index('btp', 'compliance_items',
  'idx_compliance_items_deadline', ARRAY['deadline'],
  'deadline IS NOT NULL');

SELECT pg_temp.safe_create_index('btp', 'compliance_items',
  'idx_compliance_items_bank_guarantee', ARRAY['bank_guarantee_id'],
  'bank_guarantee_id IS NOT NULL');

SELECT pg_temp.safe_create_index('btp', 'compliance_items',
  'idx_compliance_items_created_by', ARRAY['created_by'],
  'created_by <> '''' ');

SELECT pg_temp.safe_create_index('btp', 'compliance_items',
  'idx_compliance_items_responsible', ARRAY['responsible'],
  'responsible <> '''' ');

-- =============================================================================
-- ÉTAPE 2 : INDEX btp.compliance_documents
-- =============================================================================

DO $$ BEGIN RAISE NOTICE ''; RAISE NOTICE '→ Index btp.compliance_documents'; END $$;

SELECT pg_temp.safe_create_index('btp', 'compliance_documents',
  'idx_compliance_documents_item', ARRAY['compliance_item_id']);

SELECT pg_temp.safe_create_index('btp', 'compliance_documents',
  'idx_compliance_documents_category', ARRAY['category']);

SELECT pg_temp.safe_create_index('btp', 'compliance_documents',
  'idx_compliance_documents_uploaded_by', ARRAY['uploaded_by'],
  'uploaded_by IS NOT NULL');

-- =============================================================================
-- ÉTAPE 3 : INDEX btp.compliance_notes
-- =============================================================================

DO $$ BEGIN RAISE NOTICE ''; RAISE NOTICE '→ Index btp.compliance_notes'; END $$;

SELECT pg_temp.safe_create_index('btp', 'compliance_notes',
  'idx_compliance_notes_item', ARRAY['compliance_item_id']);

SELECT pg_temp.safe_create_index('btp', 'compliance_notes',
  'idx_compliance_notes_created_by', ARRAY['created_by'],
  'created_by <> '''' ');

-- =============================================================================
-- ÉTAPE 4 : INDEX btp.compliance_audit_log
-- =============================================================================

DO $$ BEGIN RAISE NOTICE ''; RAISE NOTICE '→ Index btp.compliance_audit_log'; END $$;

SELECT pg_temp.safe_create_index('btp', 'compliance_audit_log',
  'idx_compliance_audit_item', ARRAY['compliance_item_id']);

SELECT pg_temp.safe_create_index('btp', 'compliance_audit_log',
  'idx_compliance_audit_changed_at', ARRAY['changed_at'],
  'changed_at IS NOT NULL');

SELECT pg_temp.safe_create_index('btp', 'compliance_audit_log',
  'idx_compliance_audit_changed_by', ARRAY['changed_by'],
  'changed_by <> '''' ');

-- =============================================================================
-- ÉTAPE 5 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT
      c.relname AS table_name,
      i.relname AS index_name
    FROM pg_index ix
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_class c ON c.oid = ix.indrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'btp'
      AND c.relname LIKE 'compliance_%'
    ORDER BY c.relname, i.relname
  LOOP
    RAISE NOTICE '  • %.%', v_rec.table_name, v_rec.index_name;
  END LOOP;

  SELECT COUNT(*) INTO v_count
  FROM pg_indexes
  WHERE schemaname = 'btp'
    AND tablename LIKE 'compliance_%'
    AND indexname LIKE 'idx_compliance%';

  RAISE NOTICE '';
  RAISE NOTICE '  Total index compliance : %', v_count;
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;