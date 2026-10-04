-- =============================================================================
-- MIGRATION : 20261004000004_fix_stakeholders_unique_constraint.sql
-- Date       : 2026-10-04
-- Objet      : 
--   1. Nettoyer les doublons éventuels dans project_stakeholders.external_ref
--   2. Nettoyer les index/contraintes UNIQUE existants (peu importe le nom)
--   3. Créer UNE SEULE contrainte UNIQUE propre
--   4. S'assurer que les CHECK constraints sont OK
-- Idempotente : OUI (peut être réexécutée sans erreur)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Nettoyer les doublons d'external_ref
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_dup_count INT;
    v_deleted INT := 0;
BEGIN
    SELECT COUNT(*) INTO v_dup_count
    FROM (
        SELECT external_ref
        FROM btp.project_stakeholders
        WHERE external_ref IS NOT NULL
        GROUP BY external_ref
        HAVING COUNT(*) > 1
    ) sub;

    IF v_dup_count > 0 THEN
        RAISE NOTICE '⚠️  % external_ref en doublon — nettoyage...', v_dup_count;

        WITH ranked AS (
            SELECT id,
                   ROW_NUMBER() OVER (
                       PARTITION BY external_ref
                       ORDER BY created_at DESC NULLS LAST, id DESC
                   ) AS rn
            FROM btp.project_stakeholders
            WHERE external_ref IS NOT NULL
        ),
        to_delete AS (
            SELECT id FROM ranked WHERE rn > 1
        )
        DELETE FROM btp.project_stakeholders
        WHERE id IN (SELECT id FROM to_delete);

        GET DIAGNOSTICS v_deleted = ROW_COUNT;
        RAISE NOTICE '✅ % lignes dupliquées supprimées', v_deleted;
    ELSE
        RAISE NOTICE 'ℹ️  Aucun doublon détecté';
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. SUPPRIMER TOUS les index/contraintes UNIQUE existants sur external_ref
-- -----------------------------------------------------------------------------
DO $$
DECLARE
    v_rec RECORD;
    v_count INT := 0;
BEGIN
    -- 2.1 Supprimer les CONTRAINTES UNIQUE
    FOR v_rec IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'btp'
          AND t.relname = 'project_stakeholders'
          AND c.contype = 'u'  -- UNIQUE
          AND pg_get_constraintdef(c.oid) ILIKE '%external_ref%'
    LOOP
        EXECUTE format('ALTER TABLE btp.project_stakeholders DROP CONSTRAINT IF EXISTS %I CASCADE', v_rec.conname);
        RAISE NOTICE '✅ Contrainte UNIQUE supprimée : %', v_rec.conname;
        v_count := v_count + 1;
    END LOOP;

    -- 2.2 Supprimer les INDEX UNIQUE (pas des contraintes)
    FOR v_rec IN
        SELECT i.relname AS index_name
        FROM pg_index ix
        JOIN pg_class i ON i.oid = ix.indexrelid
        JOIN pg_class t ON t.oid = ix.indrelid
        JOIN pg_namespace n ON n.oid = t.relnamespace
        WHERE n.nspname = 'btp'
          AND t.relname = 'project_stakeholders'
          AND ix.indisunique = true
          AND pg_get_indexdef(ix.indexrelid) ILIKE '%external_ref%'
          AND NOT EXISTS (
              SELECT 1 FROM pg_constraint c
              WHERE c.conindid = ix.indexrelid
          )
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS btp.%I CASCADE', v_rec.index_name);
        RAISE NOTICE '✅ Index UNIQUE supprimé : %', v_rec.index_name;
        v_count := v_count + 1;
    END LOOP;

    RAISE NOTICE 'ℹ️  % objets UNIQUE supprimés sur external_ref', v_count;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Créer UNE SEULE contrainte UNIQUE propre sur external_ref
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    ALTER TABLE btp.project_stakeholders
        ADD CONSTRAINT project_stakeholders_external_ref_key
        UNIQUE (external_ref);

    RAISE NOTICE '✅ Contrainte UNIQUE créée : project_stakeholders_external_ref_key';
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE 'ℹ️  Contrainte UNIQUE déjà présente';
    WHEN duplicate_object THEN
        RAISE NOTICE 'ℹ️  Contrainte UNIQUE déjà présente';
    WHEN others THEN
        RAISE WARNING '⚠️  Impossible de créer la contrainte UNIQUE : %', SQLERRM;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Recréer les CHECK constraints propres
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    ALTER TABLE btp.project_stakeholders
        DROP CONSTRAINT IF EXISTS stakeholders_entity_consistency_check;
    ALTER TABLE btp.project_stakeholders
        DROP CONSTRAINT IF EXISTS project_stakeholders_stakeholder_entity_type_check;
    ALTER TABLE btp.project_stakeholders
        DROP CONSTRAINT IF EXISTS stakeholders_entity_type_check;

    ALTER TABLE btp.project_stakeholders
        ADD CONSTRAINT stakeholders_entity_consistency_check
        CHECK (
            organization_id IS NOT NULL
            OR supplier_id IS NOT NULL
            OR employee_id IS NOT NULL
            OR community_type IS NOT NULL
            OR stakeholder_entity_type = 'community'
        );

    ALTER TABLE btp.project_stakeholders
        ADD CONSTRAINT stakeholders_entity_type_check
        CHECK (
            stakeholder_entity_type IS NULL
            OR stakeholder_entity_type IN ('employee', 'supplier', 'organization', 'community')
        );

    RAISE NOTICE '✅ Contraintes CHECK recréées';
END $$;

-- -----------------------------------------------------------------------------
-- 5. Index de performance (non-unique)
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_stakeholders_project_id
    ON btp.project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_organization_id
    ON btp.project_stakeholders(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholders_supplier_id
    ON btp.project_stakeholders(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholders_employee_id
    ON btp.project_stakeholders(employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholders_community_type
    ON btp.project_stakeholders(community_type) WHERE community_type IS NOT NULL;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;

-- =============================================================================
-- VÉRIFICATION FINALE
-- =============================================================================

-- Contraintes sur project_stakeholders
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'btp.project_stakeholders'::regclass
ORDER BY contype, conname;

-- Index UNIQUE sur external_ref (doit y en avoir exactement 1)
SELECT
    i.relname AS index_name,
    ix.indisunique AS is_unique,
    pg_get_indexdef(ix.indexrelid) AS definition
FROM pg_index ix
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_class t ON t.oid = ix.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'btp'
  AND t.relname = 'project_stakeholders'
  AND ix.indisunique = true;