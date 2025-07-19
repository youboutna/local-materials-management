-- Ensure project_phases table has proper constraints and defaults
-- This will help prevent UUID errors when saving phases

-- Add NOT NULL constraint to project_id if not already present
ALTER TABLE project_phases 
ALTER COLUMN project_id SET NOT NULL;

-- Add constraint to ensure created_by references auth.users when not null
-- but allow it to be null for system-created phases
ALTER TABLE project_phases 
DROP CONSTRAINT IF EXISTS project_phases_created_by_fkey;

-- Add proper foreign key constraint for project_id
ALTER TABLE project_phases 
DROP CONSTRAINT IF EXISTS project_phases_project_id_fkey;

ALTER TABLE project_phases 
ADD CONSTRAINT project_phases_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Ensure proper indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_status ON project_phases(status);

-- Clean up any existing invalid data that might cause UUID errors
DELETE FROM project_phases WHERE project_id IS NULL OR project_id = '';

-- Update any phases with empty string UUIDs to NULL for optional fields
UPDATE project_phases 
SET created_by = NULL 
WHERE created_by = '';

-- Ensure proper data types and constraints
ALTER TABLE project_phases 
ALTER COLUMN phase_name SET NOT NULL;

ALTER TABLE project_phases 
ALTER COLUMN phase_type SET NOT NULL;