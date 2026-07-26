-- Extend task_assignments to support multiple assignee sources safely
ALTER TABLE btp.task_assignments
  ADD COLUMN IF NOT EXISTS assigned_profile_id uuid,
  ADD COLUMN IF NOT EXISTS assigned_employee_id uuid,
  ADD COLUMN IF NOT EXISTS assigned_supplier_id uuid;

-- Add foreign keys (safe, nullable, set null on delete)
DO $$ BEGIN
  ALTER TABLE btp.task_assignments
    ADD CONSTRAINT task_assignments_assigned_profile_fkey
      FOREIGN KEY (assigned_profile_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL
      DEFERRABLE INITIALLY DEFERRED;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE btp.task_assignments
    ADD CONSTRAINT task_assignments_assigned_employee_fkey
      FOREIGN KEY (assigned_employee_id)
      REFERENCES btp.employees(id)
      ON DELETE SET NULL
      DEFERRABLE INITIALLY DEFERRED;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE btp.task_assignments
    ADD CONSTRAINT task_assignments_assigned_supplier_fkey
      FOREIGN KEY (assigned_supplier_id)
      REFERENCES btp.suppliers(id)
      ON DELETE SET NULL
      DEFERRABLE INITIALLY DEFERRED;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_task_assignments_supplier ON btp.task_assignments(assigned_supplier_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_employee ON btp.task_assignments(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_profile  ON btp.task_assignments(assigned_profile_id);