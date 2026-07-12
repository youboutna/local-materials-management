-- Ensure `source` column exists (idempotent) and reload PostgREST schema cache.
ALTER TABLE public.tender_estimate_items ADD COLUMN IF NOT EXISTS source text;
COMMENT ON COLUMN public.tender_estimate_items.source IS 'BOQ source: dqe | tender | quantity_takeoff';
CREATE INDEX IF NOT EXISTS tender_estimate_items_source_idx ON public.tender_estimate_items(source);
NOTIFY pgrst, 'reload schema';