
CREATE TABLE public.tender_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL,
  project_id UUID,
  number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL DEFAULT '',
  description TEXT,
  estimated_amount NUMERIC,
  linked_phase_ids UUID[] NOT NULL DEFAULT '{}',
  linked_step_ids UUID[] NOT NULL DEFAULT '{}',
  requirements TEXT[] NOT NULL DEFAULT '{}',
  deliverables TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tender_lots_tender_id ON public.tender_lots(tender_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tender_lots TO authenticated;
GRANT ALL ON public.tender_lots TO service_role;

ALTER TABLE public.tender_lots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view tender lots"
  ON public.tender_lots FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert tender lots"
  ON public.tender_lots FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update tender lots"
  ON public.tender_lots FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete tender lots"
  ON public.tender_lots FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER trg_tender_lots_updated_at
  BEFORE UPDATE ON public.tender_lots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
