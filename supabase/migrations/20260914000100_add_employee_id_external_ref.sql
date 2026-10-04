-- ============================================================
-- AJUSTER LA TABLE btp.employees POUR SUPPORTER
-- employee_id ALPHANUMÉRIQUE + external_ref
-- ============================================================

-- 3.1 Ajouter la colonne external_ref si elle n'existe pas
ALTER TABLE btp.employees
  ADD COLUMN IF NOT EXISTS external_ref text;

-- 3.2 S'assurer que employee_id est de type text (alphanumérique)
-- (déjà le cas si vous avez utilisé text dès le départ)

-- 3.3 Rendre employee_id nullable avec DEFAULT auto-généré
ALTER TABLE btp.employees
  ALTER COLUMN employee_id DROP NOT NULL;

ALTER TABLE btp.employees
  ALTER COLUMN employee_id SET DEFAULT ('EMP-' || upper(substring(gen_random_uuid()::text, 1, 8)));

-- 3.4 Créer un index unique sur employee_id (si pas déjà fait)
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_employee_id_unique
  ON btp.employees(employee_id)
  WHERE employee_id IS NOT NULL;

-- 3.5 Créer un index unique sur external_ref (si pas déjà fait)
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_external_ref_unique
  ON btp.employees(external_ref)
  WHERE external_ref IS NOT NULL;

-- 3.6 Vérifier la structure finale
