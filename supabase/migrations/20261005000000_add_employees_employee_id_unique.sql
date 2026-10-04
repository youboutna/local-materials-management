-- ============================================================
-- MIGRATION : UNIQUE constraint sur btp.employees.employee_id
-- Date       : 2026-10-05
-- Raison     : Supabase refuse ON CONFLICT(employee_id) sans UNIQUE
--              (erreur 42P10 lors du POST /rest/v1/employees)
-- Idempotent : OUI (peut être relancée sans erreur)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Détection des doublons sur employee_id
-- ============================================================
DO $$
DECLARE
  v_duplicates int;
  v_examples   text;
BEGIN
  SELECT COUNT(*), string_agg(employee_id || ' (x' || cnt || ')', ', ')
  INTO v_duplicates, v_examples
  FROM (
    SELECT employee_id, COUNT(*) AS cnt
    FROM btp.employees
    WHERE employee_id IS NOT NULL
    GROUP BY employee_id
    HAVING COUNT(*) > 1
  ) AS dup;

  IF v_duplicates > 0 THEN
    RAISE EXCEPTION
      'Impossible d''ajouter UNIQUE : % doublon(s) trouvé(s) sur employee_id. Exemples : %',
      v_duplicates, v_examples;
  END IF;

  RAISE NOTICE '✅ Aucun doublon sur employee_id';
END $$;

-- ============================================================
-- 2. Ajout de la contrainte UNIQUE (idempotent)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'employees_employee_id_key'
      AND conrelid = 'btp.employees'::regclass
  ) THEN
    ALTER TABLE btp.employees
      ADD CONSTRAINT employees_employee_id_key UNIQUE (employee_id);

    RAISE NOTICE '✅ Contrainte employees_employee_id_key ajoutée';
  ELSE
    RAISE NOTICE '⚠️  Contrainte employees_employee_id_key déjà présente';
  END IF;
END $$;

-- ============================================================
-- 3. Index pour la performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_employee_id
  ON btp.employees(employee_id)
  WHERE employee_id IS NOT NULL;

-- ============================================================
-- 4. Rechargement du cache PostgREST
-- ============================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;

-- ============================================================
-- 5. Vérification finale
-- ============================================================
DO $$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_constraintdef(oid)
  INTO v_def
  FROM pg_constraint
  WHERE conname = 'employees_employee_id_key'
    AND conrelid = 'btp.employees'::regclass;

  IF v_def IS NULL THEN
    RAISE EXCEPTION '❌ La contrainte employees_employee_id_key n''a pas été créée';
  END IF;

  RAISE NOTICE '✅ Contrainte créée : %', v_def;
END $$;