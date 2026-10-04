ALTER TABLE btp.notifications
  ADD COLUMN IF NOT EXISTS project_id uuid,
  ADD COLUMN IF NOT EXISTS phase_id uuid,
  ADD COLUMN IF NOT EXISTS priority text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS action_url text;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS project_id uuid,
  ADD COLUMN IF NOT EXISTS phase_id uuid;

ALTER TABLE btp.insurance_certificates ADD COLUMN IF NOT EXISTS phase_id uuid;
ALTER TABLE btp.project_stakeholders ADD COLUMN IF NOT EXISTS phase_id uuid;

CREATE INDEX IF NOT EXISTS idx_btp_notifications_project ON btp.notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_btp_notifications_phase ON btp.notifications(phase_id);
CREATE INDEX IF NOT EXISTS idx_btp_insurance_cert_phase ON btp.insurance_certificates(phase_id);
CREATE INDEX IF NOT EXISTS idx_btp_project_stakeholders_phase ON btp.project_stakeholders(phase_id);