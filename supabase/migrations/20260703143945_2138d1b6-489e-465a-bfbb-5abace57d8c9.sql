
ALTER TABLE btp.tender_lot_documents ADD COLUMN IF NOT EXISTS lot_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.tender_lot_documents ADD COLUMN IF NOT EXISTS lot_ids uuid[] NOT NULL DEFAULT '{}';

UPDATE btp.tender_lot_documents SET lot_ids = ARRAY[lot_id] WHERE lot_id IS NOT NULL AND (lot_ids IS NULL OR array_length(lot_ids,1) IS NULL);
UPDATE public.tender_lot_documents SET lot_ids = ARRAY[lot_id] WHERE lot_id IS NOT NULL AND (lot_ids IS NULL OR array_length(lot_ids,1) IS NULL);

CREATE INDEX IF NOT EXISTS idx_btp_tender_lot_documents_lot_ids ON btp.tender_lot_documents USING GIN (lot_ids);
CREATE INDEX IF NOT EXISTS idx_pub_tender_lot_documents_lot_ids ON public.tender_lot_documents USING GIN (lot_ids);
