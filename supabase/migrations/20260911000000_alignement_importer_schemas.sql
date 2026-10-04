-- =============================================================================
-- MIGRATION : 2026XXXXXXXX_round_trip_alignment.sql
-- Date       : 2026-XX-XX
-- Objet      : Aligner les colonnes pour l'import/export round-trip
--              - btp.projects : external_ref, organization_id
--              - btp.project_phases : phase_code, external_ref
--              - btp.project_stakeholders : external_ref
--
-- SÉCURITÉ :
--   - Idempotente : ADD COLUMN IF NOT EXISTS + CREATE INDEX IF NOT EXISTS
--   - Déduplication AVANT création des index UNIQUE
--   - Vérification des tables et colonnes
--   - Logs détaillés des doublons
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : FONCTION HELPER — Déduplication générique
-- =============================================================================

CREATE OR REPLACE FUNCTION pg_temp.deduplicate_before_unique(
  p_schema TEXT,
  p_table TEXT,
  p_key_columns TEXT[],
  p_keep_order TEXT DEFAULT 'updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC'
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_rec RECORD;
  v_deleted INT := 0;
  v_dup_count INT := 0;
  v_partition_expr TEXT;
  v_where_clause TEXT;
  v_sql TEXT;
BEGIN
  -- Vérifier que la table existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = p_schema AND table_name = p_table
  ) THEN
    RAISE NOTICE '  ℹ️  %.% inexistante — skip', p_schema, p_table;
    RETURN 0;
  END IF;

  -- Vérifier que toutes les colonnes existent
  DECLARE
    v_col TEXT;
    v_missing TEXT[] := ARRAY[]::TEXT[];
  BEGIN
    FOREACH v_col IN ARRAY p_key_columns
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = p_schema AND table_name = p_table
          AND column_name = v_col
      ) THEN
        v_missing := array_append(v_missing, v_col);
      END IF;
    END LOOP;

    IF array_length(v_missing, 1) > 0 THEN
      RAISE NOTICE '  ⚠️  %.% : colonnes manquantes % — skip',
        p_schema, p_table, array_to_string(v_missing, ', ');
      RETURN 0;
    END IF;
  END;

  -- Construire l'expression PARTITION BY
  v_partition_expr := array_to_string(p_key_columns, ', ');

  -- Clause WHERE pour ne considérer que les lignes avec toutes les clés non-NULL
  v_where_clause := array_to_string(
    ARRAY(SELECT col || ' IS NOT NULL' FROM unnest(p_key_columns) AS col),
    ' AND '
  );

  -- Compter les groupes en doublon
  v_sql := format(
    'SELECT COUNT(*) FROM (
       SELECT %s FROM %I.%I
       WHERE %s
       GROUP BY %s
       HAVING COUNT(*) > 1
     ) sub',
    v_partition_expr, p_schema, p_table, v_where_clause, v_partition_expr
  );
  EXECUTE v_sql INTO v_dup_count;

  IF v_dup_count = 0 THEN
    RAISE NOTICE '  ✅ %.% : aucun doublon', p_schema, p_table;
    RETURN 0;
  END IF;

  RAISE WARNING '  ⚠️  %.% : % groupe(s) en doublon', p_schema, p_table, v_dup_count;

  -- Logger les clés en doublon (limité à 5)
  FOR v_rec IN EXECUTE format(
    'SELECT %s, COUNT(*) AS nb
     FROM %I.%I
     WHERE %s
     GROUP BY %s
     HAVING COUNT(*) > 1
     ORDER BY nb DESC
     LIMIT 5',
    v_partition_expr, p_schema, p_table, v_where_clause, v_partition_expr
  )
  LOOP
    RAISE NOTICE '     • clés en doublon détectées (nb=%)', v_rec.nb;
  END LOOP;

  -- Supprimer les doublons en gardant la ligne la plus récente
  v_sql := format(
    'WITH ranked AS (
       SELECT id,
              ROW_NUMBER() OVER (
                PARTITION BY %s
                ORDER BY %s
              ) AS rn
       FROM %I.%I
       WHERE %s
     )
     DELETE FROM %I.%I
     WHERE id IN (SELECT id FROM ranked WHERE rn > 1)',
    v_partition_expr,
    p_keep_order,
    p_schema, p_table, v_where_clause,
    p_schema, p_table
  );

  EXECUTE v_sql;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RAISE NOTICE '  ✅ %.% : % ligne(s) supprimée(s)', p_schema, p_table, v_deleted;
  RETURN v_deleted;
END $$;

-- =============================================================================
-- ÉTAPE 1 : btp.projects — external_ref + organization_id
-- =============================================================================

-- 1.1 : Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'projects'
  ) THEN
    RAISE EXCEPTION 'Table btp.projects introuvable — migration annulée';
  END IF;
END $$;

-- 1.2 : Ajouter les colonnes (idempotent)
ALTER TABLE btp.projects
  ADD COLUMN IF NOT EXISTS external_ref TEXT,
  ADD COLUMN IF NOT EXISTS organization_id UUID;

DO $$ BEGIN RAISE NOTICE '✅ btp.projects : colonnes external_ref + organization_id'; END $$;

-- 1.3 : Déduplication AVANT index unique
SELECT pg_temp.deduplicate_before_unique(
  'btp', 'projects', ARRAY['external_ref']
);

-- 1.4 : Créer l'index unique (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'btp'
      AND tablename = 'projects'
      AND indexname = 'projects_external_ref_key'
  ) THEN
    CREATE UNIQUE INDEX projects_external_ref_key
      ON btp.projects(external_ref)
      WHERE external_ref IS NOT NULL;
    RAISE NOTICE '  ✅ projects_external_ref_key créé';
  ELSE
    RAISE NOTICE '  ℹ️  projects_external_ref_key existe déjà';
  END IF;
END $$;

-- 1.5 : Index sur organization_id (non-unique)
CREATE INDEX IF NOT EXISTS idx_projects_organization_id
  ON btp.projects(organization_id)
  WHERE organization_id IS NOT NULL;

-- 1.6 : FK organization_id → btp.organizations(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_projects_organization'
      AND conrelid = 'btp.projects'::regclass
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'organizations'
  ) THEN
    -- Nettoyer les orphelins
    UPDATE btp.projects p
    SET organization_id = NULL
    WHERE p.organization_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM btp.organizations o WHERE o.id = p.organization_id
      );

    ALTER TABLE btp.projects
      ADD CONSTRAINT fk_projects_organization
      FOREIGN KEY (organization_id) REFERENCES btp.organizations(id) ON DELETE SET NULL;
    RAISE NOTICE '  ✅ FK fk_projects_organization créée';
  END IF;
END $$;

-- 1.7 : Commentaires
COMMENT ON COLUMN btp.projects.external_ref IS
  'Référence externe unique pour l''import/export round-trip (ex: "EXT-PRJ-2026-UNV-NOU")';
COMMENT ON COLUMN btp.projects.organization_id IS
  'Organisation propriétaire du projet (FK → btp.organizations)';

-- =============================================================================
-- ÉTAPE 2 : btp.project_phases — phase_code + external_ref
-- =============================================================================

-- 2.1 : Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'project_phases'
  ) THEN
    RAISE EXCEPTION 'Table btp.project_phases introuvable — migration annulée';
  END IF;
END $$;

-- 2.2 : Ajouter les colonnes (idempotent)
ALTER TABLE btp.project_phases
  ADD COLUMN IF NOT EXISTS phase_code TEXT,
  ADD COLUMN IF NOT EXISTS external_ref TEXT;

DO $$ BEGIN RAISE NOTICE '✅ btp.project_phases : colonnes phase_code + external_ref'; END $$;

-- 2.3 : Déduplication AVANT index unique (2 index)
SELECT pg_temp.deduplicate_before_unique(
  'btp', 'project_phases', ARRAY['project_id', 'phase_code']
);

SELECT pg_temp.deduplicate_before_unique(
  'btp', 'project_phases', ARRAY['external_ref']
);

-- 2.4 : Créer les index uniques (idempotents)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'btp'
      AND tablename = 'project_phases'
      AND indexname = 'project_phases_project_code_key'
  ) THEN
    CREATE UNIQUE INDEX project_phases_project_code_key
      ON btp.project_phases(project_id, phase_code)
      WHERE phase_code IS NOT NULL;
    RAISE NOTICE '  ✅ project_phases_project_code_key créé';
  ELSE
    RAISE NOTICE '  ℹ️  project_phases_project_code_key existe déjà';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'btp'
      AND tablename = 'project_phases'
      AND indexname = 'project_phases_external_ref_key'
  ) THEN
    CREATE UNIQUE INDEX project_phases_external_ref_key
      ON btp.project_phases(external_ref)
      WHERE external_ref IS NOT NULL;
    RAISE NOTICE '  ✅ project_phases_external_ref_key créé';
  ELSE
    RAISE NOTICE '  ℹ️  project_phases_external_ref_key existe déjà';
  END IF;
END $$;

-- 2.5 : Index sur phase_code (non-unique, pour recherche)
CREATE INDEX IF NOT EXISTS idx_project_phases_phase_code
  ON btp.project_phases(phase_code)
  WHERE phase_code IS NOT NULL;

-- 2.6 : Commentaires
COMMENT ON COLUMN btp.project_phases.phase_code IS
  'Code de phase (ex: "PRE_CONSTRUCTION") — unique par projet';
COMMENT ON COLUMN btp.project_phases.external_ref IS
  'Référence externe unique pour l''import/export round-trip';

-- =============================================================================
-- ÉTAPE 3 : btp.project_stakeholders — external_ref
-- =============================================================================

-- 3.1 : Vérifier que la table existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'project_stakeholders'
  ) THEN
    RAISE EXCEPTION 'Table btp.project_stakeholders introuvable — migration annulée';
  END IF;
END $$;

-- 3.2 : Ajouter la colonne (idempotent)
ALTER TABLE btp.project_stakeholders
  ADD COLUMN IF NOT EXISTS external_ref TEXT;

DO $$ BEGIN RAISE NOTICE '✅ btp.project_stakeholders : colonne external_ref'; END $$;

-- 3.3 : Déduplication AVANT index unique
SELECT pg_temp.deduplicate_before_unique(
  'btp', 'project_stakeholders', ARRAY['external_ref']
);

-- 3.4 : Créer l'index unique (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'btp'
      AND tablename = 'project_stakeholders'
      AND indexname = 'project_stakeholders_external_ref_key'
  ) THEN
    CREATE UNIQUE INDEX project_stakeholders_external_ref_key
      ON btp.project_stakeholders(external_ref)
      WHERE external_ref IS NOT NULL;
    RAISE NOTICE '  ✅ project_stakeholders_external_ref_key créé';
  ELSE
    RAISE NOTICE '  ℹ️  project_stakeholders_external_ref_key existe déjà';
  END IF;
END $$;

-- 3.5 : Commentaire
COMMENT ON COLUMN btp.project_stakeholders.external_ref IS
  'Référence externe unique pour l''import/export round-trip (ex: "EXT-STK-0001")';

-- =============================================================================
-- ÉTAPE 4 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- Colonnes ajoutées
  RAISE NOTICE 'Colonnes ajoutées :';
  FOR v_rec IN
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'btp'
      AND (
        (table_name = 'projects' AND column_name IN ('external_ref', 'organization_id'))
        OR (table_name = 'project_phases' AND column_name IN ('phase_code', 'external_ref'))
        OR (table_name = 'project_stakeholders' AND column_name = 'external_ref')
      )
    ORDER BY table_name, column_name
  LOOP
    RAISE NOTICE '   • %.% : % (nullable=%)',
      v_rec.table_name, v_rec.column_name,
      v_rec.data_type, v_rec.is_nullable;
  END LOOP;

  -- Index UNIQUE créés
  RAISE NOTICE '';
  RAISE NOTICE 'Index UNIQUE :';
  FOR v_rec IN
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'btp'
      AND indexname IN (
        'projects_external_ref_key',
        'project_phases_project_code_key',
        'project_phases_external_ref_key',
        'project_stakeholders_external_ref_key'
      )
    ORDER BY tablename, indexname
  LOOP
    RAISE NOTICE '   • %.%', v_rec.tablename, v_rec.indexname;
  END LOOP;

  -- FK créées
  RAISE NOTICE '';
  RAISE NOTICE 'Foreign Keys :';
  FOR v_rec IN
    SELECT
      tc.table_name AS source_table,
      tc.constraint_name,
      kcu.column_name AS source_column,
      ccu.table_schema AS target_schema,
      ccu.table_name AS target_table
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'btp'
      AND tc.constraint_name = 'fk_projects_organization'
    ORDER BY tc.table_name
  LOOP
    RAISE NOTICE '   • %.% : % → %.%',
      v_rec.source_table, v_rec.constraint_name,
      v_rec.source_column,
      v_rec.target_schema, v_rec.target_table;
  END LOOP;

  -- Comptage des valeurs
  RAISE NOTICE '';
  RAISE NOTICE 'Remplissage des colonnes :';
  EXECUTE 'SELECT
    (SELECT COUNT(*) FROM btp.projects WHERE external_ref IS NOT NULL) AS projects_ref,
    (SELECT COUNT(*) FROM btp.projects WHERE organization_id IS NOT NULL) AS projects_org,
    (SELECT COUNT(*) FROM btp.project_phases WHERE phase_code IS NOT NULL) AS phases_code,
    (SELECT COUNT(*) FROM btp.project_phases WHERE external_ref IS NOT NULL) AS phases_ref,
    (SELECT COUNT(*) FROM btp.project_stakeholders WHERE external_ref IS NOT NULL) AS stakeholders_ref'
  INTO v_rec;

  RAISE NOTICE '   • projects.external_ref : %', v_rec.projects_ref;
  RAISE NOTICE '   • projects.organization_id : %', v_rec.projects_org;
  RAISE NOTICE '   • project_phases.phase_code : %', v_rec.phases_code;
  RAISE NOTICE '   • project_phases.external_ref : %', v_rec.phases_ref;
  RAISE NOTICE '   • project_stakeholders.external_ref : %', v_rec.stakeholders_ref;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;