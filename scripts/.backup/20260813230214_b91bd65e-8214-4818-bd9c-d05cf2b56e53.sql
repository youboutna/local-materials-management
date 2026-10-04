ALTER TABLE btp.bank_guarantees
  ADD COLUMN IF NOT EXISTS guarantee_number text,
  ADD COLUMN IF NOT EXISTS conditions text,
  ADD COLUMN IF NOT EXISTS documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'MRU',
  ADD COLUMN IF NOT EXISTS exchange_rate numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS phase_id uuid REFERENCES btp.project_phases(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bank_guarantees_phase_id ON btp.bank_guarantees(phase_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bank_guarantees_number ON btp.bank_guarantees(guarantee_number) WHERE guarantee_number IS NOT NULL;