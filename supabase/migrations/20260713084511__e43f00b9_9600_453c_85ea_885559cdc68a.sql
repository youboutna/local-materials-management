-- Sync btp.tender_estimate_items with public columns used by BoqLineMapper
ALTER TABLE btp.tender_estimate_items
  ADD COLUMN IF NOT EXISTS phase_id text NULL,
  ADD COLUMN IF NOT EXISTS milestone_id text NULL,
  ADD COLUMN IF NOT EXISTS task_id text NULL,
  ADD COLUMN IF NOT EXISTS resource_type text NULL DEFAULT 'material',
  ADD COLUMN IF NOT EXISTS resource_kind text NULL,
  ADD COLUMN IF NOT EXISTS bid_ref text NULL,
  ADD COLUMN IF NOT EXISTS submitted_by uuid NULL,
  ADD COLUMN IF NOT EXISTS source text NULL DEFAULT 'tender_estimate',
  ADD COLUMN IF NOT EXISTS vat_rate numeric NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS note text NULL,
  ADD COLUMN IF NOT EXISTS length numeric NULL,
  ADD COLUMN IF NOT EXISTS width numeric NULL,
  ADD COLUMN IF NOT EXISTS height numeric NULL;

NOTIFY pgrst, 'reload schema';
