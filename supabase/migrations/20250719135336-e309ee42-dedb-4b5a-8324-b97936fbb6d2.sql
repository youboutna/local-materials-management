-- Clean up project_phases table to prevent UUID errors
-- First, let's safely clean up any invalid data

-- Clean up any existing invalid data that might cause UUID errors
-- Use proper UUID comparison instead of string comparison
DELETE FROM project_phases WHERE project_id IS NULL;

-- Update any phases with empty string UUIDs to NULL for optional fields
-- Handle created_by field safely
UPDATE project_phases 
SET created_by = NULL 
WHERE created_by::text = '';

-- Add proper constraints after cleaning data
ALTER TABLE project_phases 
ALTER COLUMN project_id SET NOT NULL;

-- Add proper foreign key constraint for project_id
ALTER TABLE project_phases 
DROP CONSTRAINT IF EXISTS project_phases_project_id_fkey;

ALTER TABLE project_phases 
ADD CONSTRAINT project_phases_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Ensure proper indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_status ON project_phases(status);

-- Ensure proper data types and constraints
ALTER TABLE project_phases 
ALTER COLUMN phase_name SET NOT NULL;

ALTER TABLE project_phases 
ALTER COLUMN phase_type SET NOT NULL;