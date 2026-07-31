-- Organizations
ALTER TABLE btp.organizations
  ADD COLUMN IF NOT EXISTS org_type text,
  ADD COLUMN IF NOT EXISTS external_ref text;
CREATE UNIQUE INDEX IF NOT EXISTS organizations_external_ref_key ON btp.organizations(external_ref) WHERE external_ref IS NOT NULL;

-- Suppliers
ALTER TABLE btp.suppliers
  ADD COLUMN IF NOT EXISTS supplier_type text,
  ADD COLUMN IF NOT EXISTS parent_supplier_id uuid REFERENCES btp.suppliers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bank_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS specialization text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS contract_start date,
  ADD COLUMN IF NOT EXISTS contract_end date,
  ADD COLUMN IF NOT EXISTS external_ref text;
CREATE UNIQUE INDEX IF NOT EXISTS suppliers_external_ref_key ON btp.suppliers(external_ref) WHERE external_ref IS NOT NULL;

-- Projects
ALTER TABLE btp.projects
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES btp.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS budget_sources jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS external_ref text;
CREATE UNIQUE INDEX IF NOT EXISTS projects_external_ref_key ON btp.projects(external_ref) WHERE external_ref IS NOT NULL;

-- Phases
ALTER TABLE btp.project_phases
  ADD COLUMN IF NOT EXISTS phase_code text,
  ADD COLUMN IF NOT EXISTS duration_days integer;

-- Milestones
ALTER TABLE btp.project_milestones
  ADD COLUMN IF NOT EXISTS phase_id uuid REFERENCES btp.project_phases(id) ON DELETE CASCADE;

-- Stakeholders
ALTER TABLE btp.project_stakeholders
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES btp.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_ref text;

NOTIFY pgrst, 'reload schema';