-- Alerts: align btp.project_alerts with application model
ALTER TABLE btp.project_alerts
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS project_title TEXT,
  ADD COLUMN IF NOT EXISTS related_entity_id UUID,
  ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trigger_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS recurrence INTEGER,
  ADD COLUMN IF NOT EXISTS action_required BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS action_taken TEXT,
  ADD COLUMN IF NOT EXISTS action_taken_by UUID,
  ADD COLUMN IF NOT EXISTS action_taken_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS available_actions TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS action_proof JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS delay_days INTEGER;

UPDATE btp.project_alerts SET message = COALESCE(message, description, title) WHERE message IS NULL;

-- Stakeholders: organization link (organigramme) + external reference
ALTER TABLE btp.project_stakeholders
  ADD COLUMN IF NOT EXISTS organization_id UUID,
  ADD COLUMN IF NOT EXISTS external_ref TEXT;

CREATE INDEX IF NOT EXISTS idx_project_stakeholders_organization_id
  ON btp.project_stakeholders(organization_id);