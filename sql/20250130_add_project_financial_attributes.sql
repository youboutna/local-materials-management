-- Add additional project attributes for financial and construction management
-- Migration: 20250130_add_project_financial_attributes.sql

ALTER TABLE projects 
ADD COLUMN bank_guarantee_required BOOLEAN NULL DEFAULT FALSE,
ADD COLUMN bank_guarantee_amount NUMERIC NULL,
ADD COLUMN bank_guarantee_percentage NUMERIC NULL,
ADD COLUMN insurance_required BOOLEAN NULL DEFAULT FALSE,
ADD COLUMN materials_budget NUMERIC NULL,
ADD COLUMN procurement_lead_time INTEGER NULL,
ADD COLUMN resource_assignment TEXT NULL,
ADD COLUMN reception_status TEXT NULL,
ADD COLUMN closure_notes TEXT NULL;

-- Add comments
COMMENT ON COLUMN projects.bank_guarantee_required IS 'Whether bank guarantee is required for the project';
COMMENT ON COLUMN projects.bank_guarantee_amount IS 'Amount required for bank guarantee';
COMMENT ON COLUMN projects.bank_guarantee_percentage IS 'Percentage of budget for bank guarantee';
COMMENT ON COLUMN projects.insurance_required IS 'Whether insurance is required for the project';
COMMENT ON COLUMN projects.materials_budget IS 'Budget allocated specifically for materials';
COMMENT ON COLUMN projects.procurement_lead_time IS 'Lead time in days for procurement';
COMMENT ON COLUMN projects.resource_assignment IS 'Details of resource assignments';
COMMENT ON COLUMN projects.reception_status IS 'Status of project reception';
COMMENT ON COLUMN projects.closure_notes IS 'Notes for project closure';
