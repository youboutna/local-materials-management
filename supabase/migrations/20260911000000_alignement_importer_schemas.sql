-- Round-trip alignment for project import/export & workflow edition
ALTER TABLE btp.projects
  ADD COLUMN IF NOT EXISTS external_ref TEXT,
  ADD COLUMN IF NOT EXISTS organization_id UUID;

CREATE UNIQUE INDEX IF NOT EXISTS projects_external_ref_key
  ON btp.projects (external_ref) WHERE external_ref IS NOT NULL;

ALTER TABLE btp.project_phases
  ADD COLUMN IF NOT EXISTS phase_code TEXT,
  ADD COLUMN IF NOT EXISTS external_ref TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS project_phases_project_code_key
  ON btp.project_phases (project_id, phase_code) WHERE phase_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS project_phases_external_ref_key
  ON btp.project_phases (external_ref) WHERE external_ref IS NOT NULL;

ALTER TABLE btp.project_stakeholders
  ADD COLUMN IF NOT EXISTS external_ref TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS project_stakeholders_external_ref_key
  ON btp.project_stakeholders (external_ref) WHERE external_ref IS NOT NULL;