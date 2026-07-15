
CREATE TABLE IF NOT EXISTS btp.boq_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES btp.projects(id) ON DELETE CASCADE,
  tender_id     uuid,
  submission_id uuid,
  estimate_id   uuid,
  phase_id      uuid,
  milestone_id  uuid,
  task_id       uuid,
  phase_code     text,
  milestone_code text,
  task_code      text,
  resource_id   uuid,
  resource_kind text,
  line_type   text NOT NULL CHECK (line_type IN (
    'quantity_takeoff','estimate','supplier_bid','invoice','progress_invoice'
  )),
  source_type text,
  designation  text NOT NULL,
  element_type text,
  btp_code     text,
  unit         text,
  length       numeric,
  width        numeric,
  height       numeric,
  quantity     numeric NOT NULL DEFAULT 0,
  unit_price_ht numeric,
  vat_rate  numeric,
  ras_rate  numeric,
  fees      numeric NOT NULL DEFAULT 0,
  discount  numeric NOT NULL DEFAULT 0,
  total_ht  numeric GENERATED ALWAYS AS
    (round((coalesce(quantity,0) * coalesce(unit_price_ht,0))::numeric, 4)) STORED,
  total_tva numeric GENERATED ALWAYS AS
    (round((coalesce(quantity,0) * coalesce(unit_price_ht,0) * coalesce(vat_rate,0))::numeric, 4)) STORED,
  total_ras numeric GENERATED ALWAYS AS
    (round((coalesce(quantity,0) * coalesce(unit_price_ht,0) * coalesce(ras_rate,0))::numeric, 4)) STORED,
  total_ttc numeric GENERATED ALWAYS AS
    (round((coalesce(quantity,0) * coalesce(unit_price_ht,0)
       * (1 + coalesce(vat_rate,0) - coalesce(ras_rate,0)))::numeric, 4)) STORED,
  sender_id    uuid,
  recipient_id uuid,
  document_id  uuid,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','submitted','validated','rejected','invoiced','paid','archived'
  )),
  import_source text,
  note          text,
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boq_lines_project_type ON btp.boq_lines(project_id, line_type);
CREATE INDEX IF NOT EXISTS idx_boq_lines_tender_type  ON btp.boq_lines(tender_id, line_type);
CREATE INDEX IF NOT EXISTS idx_boq_lines_submission   ON btp.boq_lines(submission_id);
CREATE INDEX IF NOT EXISTS idx_boq_lines_estimate     ON btp.boq_lines(estimate_id);
CREATE INDEX IF NOT EXISTS idx_boq_lines_status       ON btp.boq_lines(status);
CREATE INDEX IF NOT EXISTS idx_boq_lines_sender       ON btp.boq_lines(sender_id);
CREATE INDEX IF NOT EXISTS idx_boq_lines_document     ON btp.boq_lines(document_id);

GRANT USAGE ON SCHEMA btp TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.boq_lines TO authenticated;
GRANT ALL ON btp.boq_lines TO service_role;

ALTER TABLE btp.boq_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boq_lines_select" ON btp.boq_lines;
CREATE POLICY "boq_lines_select" ON btp.boq_lines FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid()
         OR project_id IN (SELECT id FROM btp.projects));

DROP POLICY IF EXISTS "boq_lines_insert" ON btp.boq_lines;
CREATE POLICY "boq_lines_insert" ON btp.boq_lines FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() OR sender_id IS NULL);

DROP POLICY IF EXISTS "boq_lines_update" ON btp.boq_lines;
CREATE POLICY "boq_lines_update" ON btp.boq_lines FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR sender_id IS NULL)
  WITH CHECK (sender_id = auth.uid() OR sender_id IS NULL);

DROP POLICY IF EXISTS "boq_lines_delete" ON btp.boq_lines;
CREATE POLICY "boq_lines_delete" ON btp.boq_lines FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR sender_id IS NULL);

CREATE OR REPLACE FUNCTION btp.tg_boq_lines_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_boq_lines_updated_at ON btp.boq_lines;
CREATE TRIGGER trg_boq_lines_updated_at
  BEFORE UPDATE ON btp.boq_lines
  FOR EACH ROW EXECUTE FUNCTION btp.tg_boq_lines_updated_at();

-- Migration data : quantity_takeoffs (phase/milestone/task_id sont TEXT côté legacy)
INSERT INTO btp.boq_lines (
  id, project_id, phase_code, milestone_code, task_code,
  resource_id, resource_kind,
  line_type, source_type, designation, element_type, btp_code, unit,
  length, width, height, quantity, unit_price_ht, vat_rate, note,
  created_at, updated_at
)
SELECT
  qt.id, qt.project_id,
  qt.phase_id, qt.milestone_id, qt.task_id,
  qt.material_id, qt.resource_type,
  'quantity_takeoff',
  COALESCE(qt.source_type, 'manual'),
  COALESCE(NULLIF(qt.element_type,''), 'Métré'),
  qt.element_type, qt.btp_code, qt.unit,
  qt.length, qt.width, qt.height,
  COALESCE(qt.quantity, 0), qt.unit_price, qt.vat_rate, qt.note,
  qt.created_at, qt.updated_at
FROM btp.quantity_takeoffs qt
WHERE NOT EXISTS (SELECT 1 FROM btp.boq_lines b WHERE b.id = qt.id);

-- Migration data : tender_estimate_items (phase/milestone/task_id types ?)
DO $mig$
DECLARE
  ph_type text; ms_type text; tk_type text;
BEGIN
  SELECT data_type INTO ph_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tender_estimate_items' AND column_name='phase_id';
  SELECT data_type INTO ms_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tender_estimate_items' AND column_name='milestone_id';
  SELECT data_type INTO tk_type FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tender_estimate_items' AND column_name='task_id';

  IF ph_type = 'uuid' THEN
    INSERT INTO btp.boq_lines (
      id, estimate_id, tender_id, phase_id, milestone_id, task_id,
      resource_id, resource_kind,
      line_type, source_type, designation, element_type, btp_code, unit,
      quantity, unit_price_ht, sender_id, created_at, updated_at
    )
    SELECT tei.id, tei.estimate_id, te.tender_id,
      tei.phase_id, tei.milestone_id, tei.task_id,
      tei.material_id, tei.resource_kind,
      CASE WHEN tei.source='supplier_bid' THEN 'supplier_bid' ELSE 'estimate' END,
      COALESCE(tei.source_type,'import'),
      COALESCE(NULLIF(tei.description,''), NULLIF(tei.item_code,''), 'Ligne'),
      tei.item_type, tei.btp_code, tei.unit,
      COALESCE(tei.quantity,0), tei.unit_price, tei.submitted_by,
      tei.created_at, tei.updated_at
    FROM public.tender_estimate_items tei
    LEFT JOIN public.tender_estimates te ON te.id = tei.estimate_id
    WHERE NOT EXISTS (SELECT 1 FROM btp.boq_lines b WHERE b.id = tei.id);
  ELSE
    INSERT INTO btp.boq_lines (
      id, estimate_id, tender_id, phase_code, milestone_code, task_code,
      resource_id, resource_kind,
      line_type, source_type, designation, element_type, btp_code, unit,
      quantity, unit_price_ht, sender_id, created_at, updated_at
    )
    SELECT tei.id, tei.estimate_id, te.tender_id,
      tei.phase_id::text, tei.milestone_id::text, tei.task_id::text,
      tei.material_id, tei.resource_kind,
      CASE WHEN tei.source='supplier_bid' THEN 'supplier_bid' ELSE 'estimate' END,
      COALESCE(tei.source_type,'import'),
      COALESCE(NULLIF(tei.description,''), NULLIF(tei.item_code,''), 'Ligne'),
      tei.item_type, tei.btp_code, tei.unit,
      COALESCE(tei.quantity,0), tei.unit_price, tei.submitted_by,
      tei.created_at, tei.updated_at
    FROM public.tender_estimate_items tei
    LEFT JOIN public.tender_estimates te ON te.id = tei.estimate_id
    WHERE NOT EXISTS (SELECT 1 FROM btp.boq_lines b WHERE b.id = tei.id);
  END IF;
END $mig$;

-- Vues de compatibilité
CREATE OR REPLACE VIEW public.v_boq_quantity_takeoffs AS
  SELECT * FROM btp.boq_lines WHERE line_type = 'quantity_takeoff';
CREATE OR REPLACE VIEW public.v_boq_estimates AS
  SELECT * FROM btp.boq_lines WHERE line_type IN ('estimate','supplier_bid');
CREATE OR REPLACE VIEW public.v_boq_invoices AS
  SELECT * FROM btp.boq_lines WHERE line_type IN ('invoice','progress_invoice');

GRANT SELECT ON public.v_boq_quantity_takeoffs TO authenticated;
GRANT SELECT ON public.v_boq_estimates          TO authenticated;
GRANT SELECT ON public.v_boq_invoices           TO authenticated;
