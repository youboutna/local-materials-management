-- =============================================================================
-- MIGRATION : 20250815001250_add_inspection_fields.sql
-- Date       : 2025-08-15
-- Objet      : Ajouter les champs step_id, observations, verified_by/at
--              à btp.inspections + index + FK + commentaires
--
-- SÉCURITÉ :
--   - Idempotente : ADD COLUMN IF NOT EXISTS + DROP CONSTRAINT IF EXISTS
--   - Vérification des contraintes FK avant ADD CONSTRAINT
--   - Vérification des index avant CREATE INDEX
--   - FK vers btp.project_phases (fallback) au lieu de phase_steps
--   - FORCE ROW LEVEL SECURITY
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : VÉRIFIER QUE btp.inspections EXISTE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'inspections'
  ) THEN
    RAISE EXCEPTION 'Table btp.inspections introuvable — migration annulée';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : AJOUT DES COLONNES (idempotent)
-- =============================================================================

ALTER TABLE btp.inspections
  ADD COLUMN IF NOT EXISTS step_id UUID;

ALTER TABLE btp.inspections
  ADD COLUMN IF NOT EXISTS observations JSONB NOT NULL DEFAULT '[]'::JSONB;

ALTER TABLE btp.inspections
  ADD COLUMN IF NOT EXISTS observation_notes TEXT;

ALTER TABLE btp.inspections
  ADD COLUMN IF NOT EXISTS verified_by UUID;

ALTER TABLE btp.inspections
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

DO $$ BEGIN RAISE NOTICE '✅ Colonnes inspections ajoutées/vérifiées'; END $$;

-- =============================================================================
-- ÉTAPE 2 : INDEX (idempotents)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_btp_inspections_step_id
  ON btp.inspections(step_id)
  WHERE step_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_btp_inspections_project_step
  ON btp.inspections(project_id, step_id)
  WHERE step_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_btp_inspections_verified_by
  ON btp.inspections(verified_by)
  WHERE verified_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_btp_inspections_verified_at
  ON btp.inspections(verified_at DESC)
  WHERE verified_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_btp_inspections_observations
  ON btp.inspections USING GIN (observations);

DO $$ BEGIN RAISE NOTICE '✅ Index inspections créés/vérifiés'; END $$;

-- =============================================================================
-- ÉTAPE 3 : COMMENTAIRES (idempotents via garde)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'btp' AND table_name = 'inspections'
               AND column_name = 'step_id') THEN
    COMMENT ON COLUMN btp.inspections.step_id IS
      'Référence à l''étape de construction (phase_step)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'btp' AND table_name = 'inspections'
               AND column_name = 'observations') THEN
    COMMENT ON COLUMN btp.inspections.observations IS
      'Observations de l''inspection (format JSON)';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'btp' AND table_name = 'inspections'
               AND column_name = 'observation_notes') THEN
    COMMENT ON COLUMN btp.inspections.observation_notes IS
      'Notes textuelles sur les observations';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'btp' AND table_name = 'inspections'
               AND column_name = 'verified_by') THEN
    COMMENT ON COLUMN btp.inspections.verified_by IS
      'Utilisateur qui a vérifié l''inspection';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'btp' AND table_name = 'inspections'
               AND column_name = 'verified_at') THEN
    COMMENT ON COLUMN btp.inspections.verified_at IS
      'Date de vérification de l''inspection';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 4 : FK step_id → btp.project_phases(id) — AVEC DÉDUPLICATION
-- =============================================================================
-- ✅ Fix 42710 : DROP CONSTRAINT IF EXISTS avant ADD
-- ✅ Priorité : btp.project_phases (existe) > btp.phase_steps (legacy)
-- =============================================================================

DO $$
DECLARE
  v_target_table TEXT;
  v_has_orphans INT := 0;
BEGIN
  -- Déterminer la table cible : project_phases (préféré) ou phase_steps (legacy)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'project_phases'
  ) THEN
    v_target_table := 'project_phases';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'phase_steps'
  ) THEN
    v_target_table := 'phase_steps';
  ELSE
    RAISE NOTICE '  ⚠️  Ni project_phases ni phase_steps n''existent — FK step_id skippée';
    RETURN;
  END IF;

  RAISE NOTICE '  → Table cible FK step_id : btp.%', v_target_table;

  -- Supprimer l'ancienne FK si elle existe (peu importe la cible)
  ALTER TABLE btp.inspections
    DROP CONSTRAINT IF EXISTS fk_inspections_step_id;

  -- Déduplication : détacher les step_id orphelins
  EXECUTE format(
    'UPDATE btp.inspections i
     SET step_id = NULL
     WHERE i.step_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM btp.%I s WHERE s.id = i.step_id)',
    v_target_table
  );

  GET DIAGNOSTICS v_has_orphans = ROW_COUNT;
  IF v_has_orphans > 0 THEN
    RAISE NOTICE '  ✅ % step_id orphelins remis à NULL', v_has_orphans;
  END IF;

  -- Créer la FK vers la table cible
  EXECUTE format(
    'ALTER TABLE btp.inspections
     ADD CONSTRAINT fk_inspections_step_id
     FOREIGN KEY (step_id) REFERENCES btp.%I(id) ON DELETE SET NULL',
    v_target_table
  );

  RAISE NOTICE '  ✅ FK fk_inspections_step_id → btp.% créée', v_target_table;
END $$;

-- =============================================================================
-- ÉTAPE 5 : FK verified_by → auth.users(id) — AVEC DROP PRÉALABLE
-- =============================================================================
-- ✅ Fix 42710 : DROP CONSTRAINT IF EXISTS avant ADD
-- =============================================================================

DO $$
DECLARE
  v_has_orphans INT := 0;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) THEN
    RAISE NOTICE '  ⚠️  auth.users n''existe pas — FK verified_by skippée';
    RETURN;
  END IF;

  -- Supprimer l'ancienne FK si elle existe
  ALTER TABLE btp.inspections
    DROP CONSTRAINT IF EXISTS fk_inspections_verified_by;

  -- Déduplication : détacher les verified_by orphelins
  UPDATE btp.inspections i
  SET verified_by = NULL
  WHERE i.verified_by IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = i.verified_by);

  GET DIAGNOSTICS v_has_orphans = ROW_COUNT;
  IF v_has_orphans > 0 THEN
    RAISE NOTICE '  ✅ % verified_by orphelins remis à NULL', v_has_orphans;
  END IF;

  -- Créer la FK
  ALTER TABLE btp.inspections
    ADD CONSTRAINT fk_inspections_verified_by
    FOREIGN KEY (verified_by) REFERENCES auth.users(id) ON DELETE SET NULL;

  RAISE NOTICE '  ✅ FK fk_inspections_verified_by créée';
END $$;

-- =============================================================================
-- ÉTAPE 6 : RLS + FORCE (sécurisation)
-- =============================================================================

ALTER TABLE btp.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.inspections FORCE ROW LEVEL SECURITY;

DO $$ BEGIN RAISE NOTICE '✅ RLS + FORCE sur btp.inspections'; END $$;

-- =============================================================================
-- ÉTAPE 7 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_missing TEXT[] := ARRAY[]::TEXT[];
  v_required_columns TEXT[] := ARRAY[
    'step_id', 'observations', 'observation_notes', 'verified_by', 'verified_at'
  ];
  v_col TEXT;
  v_fk_count INT;
  v_index_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION — btp.inspections';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- Colonnes ajoutées
  RAISE NOTICE 'Colonnes :';
  FOREACH v_col IN ARRAY v_required_columns
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'btp' AND table_name = 'inspections'
        AND column_name = v_col
    ) THEN
      RAISE NOTICE '   ✅ %', v_col;
    ELSE
      RAISE NOTICE '   ❌ MANQUANTE : %', v_col;
      v_missing := array_append(v_missing, v_col);
    END IF;
  END LOOP;

  -- FK
  SELECT COUNT(*) INTO v_fk_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'btp'
    AND t.relname = 'inspections'
    AND c.contype = 'f'
    AND c.conname IN ('fk_inspections_step_id', 'fk_inspections_verified_by');

  RAISE NOTICE '';
  RAISE NOTICE 'FK présentes : % / 2', v_fk_count;

  -- Index
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'btp'
    AND tablename = 'inspections'
    AND indexname IN (
      'idx_btp_inspections_step_id',
      'idx_btp_inspections_project_step',
      'idx_btp_inspections_verified_by',
      'idx_btp_inspections_verified_at',
      'idx_btp_inspections_observations'
    );

  RAISE NOTICE 'Index présents : % / 5', v_index_count;

  -- RLS
  RAISE NOTICE '';
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'btp' AND c.relname = 'inspections'
      AND c.relrowsecurity = true AND c.relforcerowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS activé + FORCE';
  ELSE
    RAISE NOTICE '⚠️  RLS ou FORCE manquant';
  END IF;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE NOTICE '';
    RAISE WARNING '⚠️  Colonnes manquantes : %', array_to_string(v_missing, ', ');
  END IF;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 8 : NOTIFY POSTGREST
-- =============================================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;