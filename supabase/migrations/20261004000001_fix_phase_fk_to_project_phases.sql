-- =============================================================================
-- MIGRATION : 20261004000002_dedupe_milestones_fk.sql
-- Date       : 2026-10-04
-- Objet      : Supprimer la contrainte FK dupliquée sur project_milestones.phase_id
--
-- Contexte :
--   Deux contraintes FK redondantes existent sur la même colonne :
--     - milestones_phase_id_fkey         (ajoutée par la migration précédente)
--     - project_milestones_phase_id_fkey (native du schéma initial)
--   Les deux pointent vers btp.project_phases(id). On garde la native
--   (nom conventionnel aligné sur la table) et on supprime l'autre.
-- =============================================================================

BEGIN;

DO $$
DECLARE
    fk_count INT;
BEGIN
    -- Compter les FK existantes sur project_milestones.phase_id
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'btp'
      AND tc.table_name = 'project_milestones'
      AND kcu.column_name = 'phase_id';

    RAISE NOTICE 'FK trouvées sur project_milestones.phase_id : %', fk_count;

    -- Si la contrainte ajoutée par erreur est présente, la supprimer
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = 'btp'
          AND table_name = 'project_milestones'
          AND constraint_name = 'milestones_phase_id_fkey'
    ) THEN
        ALTER TABLE btp.project_milestones
            DROP CONSTRAINT milestones_phase_id_fkey;
        RAISE NOTICE '✅ Contrainte "milestones_phase_id_fkey" supprimée (doublon)';
    ELSE
        RAISE NOTICE 'ℹ️  Contrainte "milestones_phase_id_fkey" déjà absente';
    END IF;

    -- Vérifier qu'il ne reste qu'UNE seule FK
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'btp'
      AND tc.table_name = 'project_milestones'
      AND kcu.column_name = 'phase_id';

    IF fk_count = 1 THEN
        RAISE NOTICE '✅ project_milestones.phase_id a maintenant 1 seule FK';
    ELSIF fk_count = 0 THEN
        RAISE EXCEPTION '❌ Aucune FK sur project_milestones.phase_id — migration invalide';
    ELSE
        RAISE EXCEPTION '❌ % FK persistent sur project_milestones.phase_id', fk_count;
    END IF;
END $$;

COMMIT;

-- =============================================================================
-- FIN DE LA MIGRATION
-- =============================================================================