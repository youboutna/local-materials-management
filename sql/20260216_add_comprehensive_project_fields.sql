-- Migration: Add comprehensive project management fields
-- Date: 2026-02-16
-- Description: Add all missing database fields for enhanced project management

-- Financial and insurance fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bank_guarantee_required BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bank_guarantee_amount DECIMAL(15,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bank_guarantee_percentage DECIMAL(5,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS materials_budget DECIMAL(15,2);

-- Schedule and validation fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS check_schedule_last_run TIMESTAMP WITH TIME ZONE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completion_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS estimated_days INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_consultant_validation BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requires_ministry_approval BOOLEAN DEFAULT FALSE;

-- Project management fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS closure_notes TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS donor_organization VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS forme VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS funding_source VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS localisation JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_frequency VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_workflow_config JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS procurement_lead_time INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_order VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_reference_number VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS reception_status VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS resource_assignment JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS retention_percentage DECIMAL(5,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sector VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_details TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS terrain_type VARCHAR(100);

-- Employee relationship fields (semantic: Employee references)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_responsable_id UUID REFERENCES auth.users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES auth.users(id);

-- Financial management fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS initial_advance_percentage DECIMAL(5,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS initial_payment_percentage DECIMAL(5,2);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_project_responsable_id ON projects(project_responsable_id);
CREATE INDEX IF NOT EXISTS idx_projects_supervisor_id ON projects(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_projects_sector ON projects(sector);
CREATE INDEX IF NOT EXISTS idx_projects_completion_date ON projects(completion_date);
CREATE INDEX IF NOT EXISTS idx_projects_donor_organization ON projects(donor_organization);

-- Comments for documentation
COMMENT ON COLUMN projects.bank_guarantee_required IS 'Whether bank guarantee is required for this project';
COMMENT ON COLUMN projects.bank_guarantee_amount IS 'Amount of bank guarantee in project currency';
COMMENT ON COLUMN projects.bank_guarantee_percentage IS 'Percentage of contract value for bank guarantee';
COMMENT ON COLUMN projects.check_schedule_last_run IS 'Timestamp of last schedule check execution';
COMMENT ON COLUMN projects.closure_notes IS 'Notes recorded during project closure';
COMMENT ON COLUMN projects.completion_date IS 'Actual completion date of the project';
COMMENT ON COLUMN projects.donor_organization IS 'Organization providing funding/donations';
COMMENT ON COLUMN projects.estimated_days IS 'Estimated duration in days';
COMMENT ON COLUMN projects.forme IS 'Legal form/type of the project';
COMMENT ON COLUMN projects.funding_source IS 'Source of project funding';
COMMENT ON COLUMN projects.localisation IS 'Geographic localization data (JSON)';
COMMENT ON COLUMN projects.materials_budget IS 'Budget allocated for materials';
COMMENT ON COLUMN projects.payment_frequency IS 'Frequency of payments (monthly, quarterly, etc.)';
COMMENT ON COLUMN projects.payment_mode IS 'Mode of payment (check, transfer, etc.)';
COMMENT ON COLUMN projects.payment_workflow_config IS 'Payment workflow configuration (JSON)';
COMMENT ON COLUMN projects.procurement_lead_time IS 'Lead time for procurement in days';
COMMENT ON COLUMN projects.project_order IS 'Project order/reference number';
COMMENT ON COLUMN projects.project_reference_number IS 'Official project reference number';
COMMENT ON COLUMN projects.project_responsable_id IS 'Employee ID of project responsable (references auth.users)';
COMMENT ON COLUMN projects.reception_status IS 'Status of project reception/validation';
COMMENT ON COLUMN projects.requires_consultant_validation IS 'Whether consultant validation is required';
COMMENT ON COLUMN projects.requires_ministry_approval IS 'Whether ministry approval is required';
COMMENT ON COLUMN projects.resource_assignment IS 'Resource assignment configuration (JSON)';
COMMENT ON COLUMN projects.retention_percentage IS 'Percentage retained from payments';
COMMENT ON COLUMN projects.sector IS 'Project sector/category';
COMMENT ON COLUMN projects.site_details IS 'Detailed information about the project site';
COMMENT ON COLUMN projects.supervisor_id IS 'Employee ID of project supervisor (references auth.users)';
COMMENT ON COLUMN projects.terrain_type IS 'Type of terrain at project site';
COMMENT ON COLUMN projects.initial_advance_percentage IS 'Initial advance payment percentage';
COMMENT ON COLUMN projects.initial_payment_percentage IS 'Initial payment percentage';

-- Update existing records with default values where appropriate
UPDATE projects SET
  bank_guarantee_required = COALESCE(bank_guarantee_required, FALSE),
  requires_consultant_validation = COALESCE(requires_consultant_validation, FALSE),
  requires_ministry_approval = COALESCE(requires_ministry_approval, FALSE)
WHERE bank_guarantee_required IS NULL
   OR requires_consultant_validation IS NULL
   OR requires_ministry_approval IS NULL;
