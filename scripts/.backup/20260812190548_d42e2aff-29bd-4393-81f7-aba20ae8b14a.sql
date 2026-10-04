ALTER TABLE btp.inspections
  ADD COLUMN IF NOT EXISTS step_id uuid,
  ADD COLUMN IF NOT EXISTS observations jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_btp_inspections_step_id ON btp.inspections(step_id);