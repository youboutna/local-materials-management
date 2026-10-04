ALTER TABLE btp.payments
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE INDEX IF NOT EXISTS idx_btp_payments_status ON btp.payments(status);
CREATE INDEX IF NOT EXISTS idx_btp_payments_created_by ON btp.payments(created_by);