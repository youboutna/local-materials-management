-- Livraison 4: alignement BTP (source_type + btp_code)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='btp' AND table_name='quantity_takeoffs') THEN
    ALTER TABLE btp.quantity_takeoffs
      ADD COLUMN IF NOT EXISTS source_type text,
      ADD COLUMN IF NOT EXISTS btp_code text;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='btp' AND table_name='tender_estimate_items') THEN
    ALTER TABLE btp.tender_estimate_items
      ADD COLUMN IF NOT EXISTS source_type text,
      ADD COLUMN IF NOT EXISTS btp_code text;
  END IF;
END$$;

ALTER TABLE btp.tender_estimate_items
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS btp_code text;

CREATE INDEX IF NOT EXISTS idx_public_tender_estimate_items_btp_code
  ON btp.tender_estimate_items(btp_code) WHERE btp_code IS NOT NULL;

NOTIFY pgrst, 'reload schema';