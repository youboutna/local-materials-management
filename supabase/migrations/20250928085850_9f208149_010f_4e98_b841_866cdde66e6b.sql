-- Create table for project stakeholders (employees/suppliers)
CREATE TABLE IF NOT EXISTS btp.project_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  stakeholder_entity_type TEXT NOT NULL CHECK (stakeholder_entity_type IN ('employee','supplier')),
  stakeholder_type TEXT NOT NULL,
  stakeholder_id UUID NOT NULL,
  role_description TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_project ON btp.project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_entity_type ON btp.project_stakeholders(stakeholder_entity_type);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_stakeholder ON btp.project_stakeholders(stakeholder_id);

-- Trigger for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_update_project_stakeholders_updated_at'
  ) THEN
    CREATE TRIGGER trg_update_project_stakeholders_updated_at
    BEFORE UPDATE ON btp.project_stakeholders
    FOR EACH ROW EXECUTE FUNCTION btp.update_updated_at_column();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE btp.project_stakeholders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view project stakeholders"
ON btp.project_stakeholders
FOR SELECT
USING (EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = project_stakeholders.project_id));

CREATE POLICY "Users can insert project stakeholders"
ON btp.project_stakeholders
FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = project_stakeholders.project_id));

CREATE POLICY "Users can update project stakeholders"
ON btp.project_stakeholders
FOR UPDATE
USING (EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = project_stakeholders.project_id));

CREATE POLICY "Users can delete project stakeholders"
ON btp.project_stakeholders
FOR DELETE
USING (EXISTS (SELECT 1 FROM btp.projects p WHERE p.id = project_stakeholders.project_id));