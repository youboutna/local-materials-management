-- Add missing columns to projects table with proper foreign key relationships

-- Client reference (links to suppliers table for external clients)
ALTER TABLE btp.projects 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES btp.suppliers(id) ON DELETE SET NULL;

-- Engineering consultant reference (links to suppliers table)
ALTER TABLE btp.projects 
ADD COLUMN IF NOT EXISTS engineering_consultant_id uuid REFERENCES btp.suppliers(id) ON DELETE SET NULL;

-- Technical manager reference (links to employees table)
ALTER TABLE btp.projects 
ADD COLUMN IF NOT EXISTS technical_manager_id uuid REFERENCES btp.employees(id) ON DELETE SET NULL;

-- Site supervisor reference (links to employees table)
ALTER TABLE btp.projects 
ADD COLUMN IF NOT EXISTS supervisor_id uuid REFERENCES btp.employees(id) ON DELETE SET NULL;

-- Project responsable foreign key (if not already constrained)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_project_responsable_id_fkey'
  ) THEN
    ALTER TABLE btp.projects 
    ADD CONSTRAINT projects_project_responsable_id_fkey 
    FOREIGN KEY (project_responsable_id) REFERENCES btp.employees(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Workspace reference
ALTER TABLE btp.projects 
ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES btp.workspaces(id) ON DELETE SET NULL;

-- Plain data columns
ALTER TABLE btp.projects 
ADD COLUMN IF NOT EXISTS area_sqm numeric;

ALTER TABLE btp.projects 
ADD COLUMN IF NOT EXISTS site_details text;

ALTER TABLE btp.projects 
ADD COLUMN IF NOT EXISTS donor_organization text;

-- Create indexes for new foreign keys
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON btp.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_engineering_consultant_id ON btp.projects(engineering_consultant_id);
CREATE INDEX IF NOT EXISTS idx_projects_technical_manager_id ON btp.projects(technical_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_supervisor_id ON btp.projects(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON btp.projects(workspace_id);