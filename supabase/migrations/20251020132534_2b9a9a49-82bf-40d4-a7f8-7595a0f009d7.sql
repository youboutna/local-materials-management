-- Drop FK constraint on assigned_to so it can reference employees, suppliers, or profiles
ALTER TABLE task_assignments 
  DROP CONSTRAINT IF EXISTS task_assignments_assigned_to_fkey;

-- Drop FK constraint on assigned_by  
ALTER TABLE task_assignments 
  DROP CONSTRAINT IF EXISTS task_assignments_assigned_by_fkey;

-- Drop the type-specific FK columns since we're using assigned_to as universal field
ALTER TABLE task_assignments 
  DROP COLUMN IF EXISTS assigned_employee_id,
  DROP COLUMN IF EXISTS assigned_supplier_id,
  DROP COLUMN IF EXISTS assigned_profile_id;

-- Add index on assigned_to for performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_to ON task_assignments(assigned_to);

-- Add index on assignee_type for filtering
CREATE INDEX IF NOT EXISTS idx_task_assignments_assignee_type ON task_assignments(assignee_type);

-- Add comment explaining the new pattern
COMMENT ON COLUMN task_assignments.assigned_to IS 'Universal assignee ID - can reference employees.id, suppliers.id, or profiles.id. Use assignee_type to determine the table.';
COMMENT ON COLUMN task_assignments.assignee_type IS 'Type of assignee: employee, supplier, or user';
COMMENT ON COLUMN task_assignments.assigned_by IS 'ID of user who created the assignment (references profiles/auth.users)';
