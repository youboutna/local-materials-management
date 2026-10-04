CREATE TABLE IF NOT EXISTS btp.contract_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id uuid NOT NULL REFERENCES btp.contracts(id) ON DELETE CASCADE,
  source_boq_line_id uuid,
  source_estimate_item_id uuid,
  phase_id uuid,
  lot_id uuid,
  line_code text,
  designation text NOT NULL,
  unit text,
  quantity numeric NOT NULL DEFAULT 0,
  unit_price numeric NOT NULL DEFAULT 0,
  amount_ht numeric NOT NULL DEFAULT 0,
  vat_rate numeric NOT NULL DEFAULT 0,
  amount_ttc numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MRU',
  category text,
  display_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.contract_lines TO authenticated;
GRANT ALL ON btp.contract_lines TO service_role;

ALTER TABLE btp.contract_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contract_lines_select_authenticated"
  ON btp.contract_lines FOR SELECT TO authenticated USING (true);

CREATE POLICY "contract_lines_insert_authenticated"
  ON btp.contract_lines FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "contract_lines_update_authenticated"
  ON btp.contract_lines FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "contract_lines_delete_authenticated"
  ON btp.contract_lines FOR DELETE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_contract_lines_contract ON btp.contract_lines(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_lines_phase ON btp.contract_lines(phase_id);
CREATE INDEX IF NOT EXISTS idx_contract_lines_source_boq ON btp.contract_lines(source_boq_line_id);

CREATE TRIGGER update_contract_lines_updated_at
  BEFORE UPDATE ON btp.contract_lines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE btp.contracts
  ADD COLUMN IF NOT EXISTS signed_document_id uuid,
  ADD COLUMN IF NOT EXISTS signed_document_url text;