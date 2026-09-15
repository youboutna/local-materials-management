-- Correction de la contrainte stakeholders
ALTER TABLE btp.project_stakeholders
  DROP CONSTRAINT IF EXISTS stakeholder_entity_check;

ALTER TABLE btp.project_stakeholders
  DROP CONSTRAINT IF EXISTS project_stakeholders_stakeholder_entity_type_check;

ALTER TABLE btp.project_stakeholders
  ADD CONSTRAINT project_stakeholders_stakeholder_entity_type_check
  CHECK (
    stakeholder_entity_type IS NULL
    OR stakeholder_entity_type IN ('employee', 'supplier', 'organization', 'community')
  );

-- Rechargement cache PostgREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';


-- ============================================================
-- CORRECTIF : Ajouter completed_at à btp.task_assignments
-- Date : 2026-09-15
-- Objectif : Résoudre PGRST204 "Could not find 'completed_at' column"
-- ============================================================

BEGIN;

-- 1. Ajouter la colonne completed_at (nullable, timestamptz)
ALTER TABLE btp.task_assignments
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- 2. Index partiel pour les recherches (uniquement les lignes complétées)
CREATE INDEX IF NOT EXISTS idx_task_assignments_completed_at
  ON btp.task_assignments(completed_at)
  WHERE completed_at IS NOT NULL;

-- 3. Recharger le cache PostgREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;

-- ============================================================
-- VÉRIFICATION
-- ============================================================

-- 3.1 Vérifier que la colonne existe
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'btp'
  AND table_name = 'task_assignments'
  AND column_name = 'completed_at';

-- 3.2 Vérifier que l'index existe
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'btp'
  AND tablename = 'task_assignments'
  AND indexname = 'idx_task_assignments_completed_at';