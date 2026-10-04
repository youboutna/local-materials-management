-- =============================================================================
-- MIGRATION : 20251029093721_add_missing_fk_constraints.sql
-- Date       : 2025-10-29
-- Objet      : Ajouter les FK manquantes (idempotent)
--
-- SÉCURITÉ :
--   - Idempotente : vérification pg_constraint avant ADD CONSTRAINT
--   - Vérification de l'existence de la table et de la colonne cible
--   - Vérification de l'existence de la table référencée
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : S'ASSURER QUE btp.projects EXISTE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'projects'
  ) THEN
    RAISE EXCEPTION 'Table btp.projects introuvable — migration annulée';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : FK bank_guarantees.project_id → btp.projects(id)
-- =============================================================================

DO $$
BEGIN
  -- 1.1 : Vérifier que la table source existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'bank_guarantees'
  ) THEN
    RAISE NOTICE '⚠️  btp.bank_guarantees absente — skip';
    RETURN;
  END IF;

  -- 1.2 : Vérifier que la colonne project_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'bank_guarantees'
      AND column_name = 'project_id'
  ) THEN
    RAISE NOTICE '⚠️  btp.bank_guarantees.project_id absente — skip';
    RETURN;
  END IF;

  -- 1.3 : Vérifier que la FK n'existe pas déjà (par nom)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_bank_guarantees_project'
      AND conrelid = 'btp.bank_guarantees'::regclass
  ) THEN
    RAISE NOTICE 'ℹ️  FK fk_bank_guarantees_project existe déjà';
    RETURN;
  END IF;

  -- 1.4 : Vérifier qu'il n'y a PAS une autre FK sur la même colonne
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'btp'
      AND tc.table_name = 'bank_guarantees'
      AND kcu.column_name = 'project_id'
  ) THEN
    RAISE NOTICE 'ℹ️  Une FK existe déjà sur bank_guarantees.project_id (autre nom)';
    RETURN;
  END IF;

  -- 1.5 : Créer la FK
  ALTER TABLE btp.bank_guarantees
    ADD CONSTRAINT fk_bank_guarantees_project
    FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE;

  RAISE NOTICE '✅ FK fk_bank_guarantees_project créée';
END $$;

-- =============================================================================
-- ÉTAPE 2 : FK payment_blocks.project_id → btp.projects(id)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'payment_blocks'
  ) THEN
    RAISE NOTICE '⚠️  btp.payment_blocks absente — skip';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'payment_blocks'
      AND column_name = 'project_id'
  ) THEN
    RAISE NOTICE '⚠️  btp.payment_blocks.project_id absente — skip';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_payment_blocks_project'
      AND conrelid = 'btp.payment_blocks'::regclass
  ) THEN
    RAISE NOTICE 'ℹ️  FK fk_payment_blocks_project existe déjà';
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'btp'
      AND tc.table_name = 'payment_blocks'
      AND kcu.column_name = 'project_id'
  ) THEN
    RAISE NOTICE 'ℹ️  Une FK existe déjà sur payment_blocks.project_id (autre nom)';
    RETURN;
  END IF;

  ALTER TABLE btp.payment_blocks
    ADD CONSTRAINT fk_payment_blocks_project
    FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE;

  RAISE NOTICE '✅ FK fk_payment_blocks_project créée';
END $$;

-- =============================================================================
-- ÉTAPE 3 : COMMENTAIRES (avec guard)
-- =============================================================================

DO $$
BEGIN
  -- Commentaire FK bank_guarantees
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_bank_guarantees_project'
      AND conrelid = 'btp.bank_guarantees'::regclass
  ) THEN
    COMMENT ON CONSTRAINT fk_bank_guarantees_project ON btp.bank_guarantees
      IS 'Links bank guarantees to their associated projects';
    RAISE NOTICE '  ✅ Commentaire FK bank_guarantees';
  END IF;

  -- Commentaire FK payment_blocks
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_payment_blocks_project'
      AND conrelid = 'btp.payment_blocks'::regclass
  ) THEN
    COMMENT ON CONSTRAINT fk_payment_blocks_project ON btp.payment_blocks
      IS 'Links payment blocks to their associated projects';
    RAISE NOTICE '  ✅ Commentaire FK payment_blocks';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 4 : INDEX SUR LES COLONNES FK (pour performance)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'bank_guarantees'
      AND column_name = 'project_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bank_guarantees_project_id
             ON btp.bank_guarantees(project_id)
             WHERE project_id IS NOT NULL';
    RAISE NOTICE '  ✅ Index idx_bank_guarantees_project_id';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'payment_blocks'
      AND column_name = 'project_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_payment_blocks_project_id
             ON btp.payment_blocks(project_id)
             WHERE project_id IS NOT NULL';
    RAISE NOTICE '  ✅ Index idx_payment_blocks_project_id';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 5 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT
      tc.table_name AS source_table,
      tc.constraint_name,
      kcu.column_name AS source_column,
      ccu.table_name AS target_table,
      ccu.column_name AS target_column,
      rc.delete_rule AS on_delete
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
     AND rc.constraint_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'btp'
      AND tc.table_name IN ('bank_guarantees', 'payment_blocks')
      AND kcu.column_name = 'project_id'
    ORDER BY tc.table_name
  LOOP
    RAISE NOTICE '  • %.% : %.% → %.% (ON DELETE %)',
      v_rec.source_table, v_rec.constraint_name,
      v_rec.source_table, v_rec.source_column,
      v_rec.target_table, v_rec.target_column,
      v_rec.on_delete;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;