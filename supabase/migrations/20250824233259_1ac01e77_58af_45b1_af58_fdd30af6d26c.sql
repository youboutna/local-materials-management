-- =============================================================================
-- MIGRATION : 20250824233259_add_nif_to_suppliers.sql
-- Date       : 2025-08-24
-- Objet      : Ajouter nif à btp.suppliers + index de performance
--
-- SÉCURITÉ :
--   - Idempotente : ADD COLUMN IF NOT EXISTS
--   - Vérification des colonnes avant CREATE INDEX
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : VÉRIFICATION PRÉALABLE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'suppliers'
  ) THEN
    RAISE EXCEPTION 'Table btp.suppliers introuvable — migration annulée';
  END IF;
  RAISE NOTICE '✅ Table btp.suppliers présente';
END $$;

-- =============================================================================
-- ÉTAPE 2 : AJOUTER LES COLONNES (idempotent)
-- =============================================================================

ALTER TABLE btp.suppliers
  ADD COLUMN IF NOT EXISTS nif VARCHAR(50);

ALTER TABLE btp.suppliers
  ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);

DO $$ BEGIN RAISE NOTICE '✅ Colonnes nif et contact_person vérifiées'; END $$;

-- =============================================================================
-- ÉTAPE 3 : INDEX (idempotents + vérifiés)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'nif'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_suppliers_nif ON btp.suppliers(nif) WHERE nif IS NOT NULL';
    RAISE NOTICE '  ✅ idx_suppliers_nif';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'contact_person'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_suppliers_contact_person ON btp.suppliers(contact_person) WHERE contact_person IS NOT NULL';
    RAISE NOTICE '  ✅ idx_suppliers_contact_person';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'suppliers' AND column_name = 'name'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_suppliers_name ON btp.suppliers(name)';
    RAISE NOTICE '  ✅ idx_suppliers_name';
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 4 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION — btp.suppliers';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'suppliers'
      AND column_name IN ('nif', 'contact_person', 'name')
    ORDER BY column_name
  LOOP
    RAISE NOTICE '  • % : % (nullable=%)', v_rec.column_name, v_rec.data_type, v_rec.is_nullable;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;