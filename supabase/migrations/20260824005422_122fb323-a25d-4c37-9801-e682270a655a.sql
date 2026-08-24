ALTER TABLE btp.tender_lots
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS awarded_to text,
  ADD COLUMN IF NOT EXISTS awarded_submission_id uuid,
  ADD COLUMN IF NOT EXISTS awarded_at timestamptz,
  ADD COLUMN IF NOT EXISTS awarded_amount numeric;

ALTER TABLE btp.tender_submissions
  ADD COLUMN IF NOT EXISTS lot_id uuid;

CREATE INDEX IF NOT EXISTS idx_tender_submissions_lot_id ON btp.tender_submissions(lot_id);
CREATE INDEX IF NOT EXISTS idx_tender_lots_status ON btp.tender_lots(status);