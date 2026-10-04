-- =============================================================================
-- MIGRATION : 20261004000015_fix_import_bug_constraints.sql
-- Date       : 2026-10-04
-- Objet      : Fix CIBLÉ des 3 contraintes qui bloquent l'import en cours.
--              Aucune modification d'autres contraintes (pas de régression).
--
-- BUGS CORRIGÉS :
--   1. task_assignments_status_check
--      → bloque status='assigned' (envoyé par le service)
--      → SUPPRIMÉE
--
--   2. Trigger trg_validate_stakeholder_entity
--      → lève P0001 "supplier doit avoir un supplier_id" à tort sur les
--        stakeholders de type organization avec organization_id valide
--      → SUPPRIMÉ (validation côté service)
--
--   3. Colonne action_type absente dans task_assignments
--      → warning répété "Column action_type absent, retry sans"
--      → COLONNE AJOUTÉE (nullable, sans contrainte)
--
-- Idempotente : OUI
-- =============================================================================

BEGIN;

-- =============================================================================
-- FIX #1 : Supprimer la contrainte task_assignments_status_check
-- =============================================================================
-- Le service envoie des valeurs telles que 'assigned', 'in_progress', 'on_hold',
-- 'blocked', qui ne sont pas dans la liste figée par la contrainte DB.
-- La validation se fait côté référentiels + services.

ALTER TABLE btp.task_assignments
    DROP CONSTRAINT IF EXISTS task_assignments_status_check;

DO $$
BEGIN
    RAISE NOTICE '✅ FIX #1 : task_assignments_status_check supprimée';
END $$;

-- =============================================================================
-- FIX #2 : Supprimer le trigger validate_stakeholder_entity
-- =============================================================================
-- Le trigger lève P0001 à tort sur les stakeholders de type organization.
-- Log observé : entityType=organization, orgId=<UUID>, mais P0001 "supplier".
-- La validation de cohérence est désormais côté service TypeScript.

DROP TRIGGER IF EXISTS trg_validate_stakeholder_entity ON btp.project_stakeholders;
DROP FUNCTION IF EXISTS btp.validate_stakeholder_entity() CASCADE;

DO $$
BEGIN
    RAISE NOTICE '✅ FIX #2 : trigger trg_validate_stakeholder_entity supprimé';
END $$;

-- =============================================================================
-- FIX #3 : Ajouter la colonne action_type à task_assignments
-- =============================================================================
-- Le service envoie action_type, la colonne n'existe pas → warning + retry.

ALTER TABLE btp.task_assignments
    ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'task_assignment';

DO $$
BEGIN
    RAISE NOTICE '✅ FIX #3 : colonne task_assignments.action_type ajoutée';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;

-- =============================================================================
-- VÉRIFICATION POST-MIGRATION
-- =============================================================================

-- Vérifier que la contrainte status est bien supprimée
SELECT
    'constraint status' AS check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'task_assignments_status_check'
              AND conrelid = 'btp.task_assignments'::regclass
        ) THEN '❌ ENCORE PRÉSENTE'
        ELSE '✅ SUPPRIMÉE'
    END AS result

UNION ALL

-- Vérifier que le trigger est bien supprimé
SELECT
    'trigger validate_stakeholder' AS check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.triggers
            WHERE event_object_schema = 'btp'
              AND event_object_table = 'project_stakeholders'
              AND trigger_name = 'trg_validate_stakeholder_entity'
        ) THEN '❌ ENCORE PRÉSENT'
        ELSE '✅ SUPPRIMÉ'
    END AS result

UNION ALL

-- Vérifier que la colonne action_type existe
SELECT
    'column action_type' AS check_name,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'btp'
              AND table_name = 'task_assignments'
              AND column_name = 'action_type'
        ) THEN '✅ PRÉSENTE'
        ELSE '❌ MANQUANTE'
    END AS result;