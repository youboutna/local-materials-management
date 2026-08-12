ALTER TABLE btp.project_phases ADD COLUMN IF NOT EXISTS phase_code TEXT;
COMMENT ON COLUMN btp.project_phases.phase_code IS 'Code métier de la phase issu du référentiel (ETUDES, TRAVAUX, ...)';
CREATE INDEX IF NOT EXISTS idx_project_phases_project_phase_code ON btp.project_phases(project_id, phase_code);
UPDATE btp.project_phases SET phase_code = COALESCE(custom_phase_data->>'phaseCode', phase_type) WHERE phase_code IS NULL;