ALTER TABLE btp.phase_employees
  ADD COLUMN IF NOT EXISTS employee_id uuid NULL REFERENCES btp.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_phase_employees_employee_id
  ON btp.phase_employees(employee_id);

COMMENT ON COLUMN btp.phase_employees.employee_id IS
  'Référence canonique vers l employé interne; les libellés restent des instantanés historiques.';