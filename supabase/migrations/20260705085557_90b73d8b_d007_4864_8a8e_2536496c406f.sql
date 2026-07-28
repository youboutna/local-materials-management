
ALTER TABLE btp.quantity_takeoffs
  ADD COLUMN IF NOT EXISTS task_id text NULL,
  ADD COLUMN IF NOT EXISTS milestone_id text NULL,
  ADD COLUMN IF NOT EXISTS phase_id text NULL,
  ADD COLUMN IF NOT EXISTS unit_price numeric NULL,
  ADD COLUMN IF NOT EXISTS total_value numeric NULL,
  ADD COLUMN IF NOT EXISTS vat_rate numeric NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resource_type text NULL DEFAULT 'material',
  ADD COLUMN IF NOT EXISTS source text NULL DEFAULT 'quantity_takeoff';

ALTER TABLE btp.tender_estimate_items
  ADD COLUMN IF NOT EXISTS phase_id text NULL,
  ADD COLUMN IF NOT EXISTS milestone_id text NULL,
  ADD COLUMN IF NOT EXISTS task_id text NULL,
  ADD COLUMN IF NOT EXISTS resource_type text NULL DEFAULT 'material',
  ADD COLUMN IF NOT EXISTS bid_ref text NULL,
  ADD COLUMN IF NOT EXISTS submitted_by uuid NULL,
  ADD COLUMN IF NOT EXISTS source text NULL DEFAULT 'tender_estimate';

DROP VIEW IF EXISTS btp.quantity_takeoffs CASCADE;
CREATE VIEW btp.quantity_takeoffs AS SELECT * FROM btp.quantity_takeoffs;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.quantity_takeoffs TO authenticated;
GRANT ALL ON btp.quantity_takeoffs TO service_role;
