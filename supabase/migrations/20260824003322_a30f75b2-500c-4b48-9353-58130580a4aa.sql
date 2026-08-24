CREATE TABLE IF NOT EXISTS btp.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text NOT NULL,
  title text NOT NULL,
  project_id uuid,
  tender_id uuid,
  supplier_id uuid,
  source_estimate_id uuid,
  contract_type text NOT NULL DEFAULT 'works',
  status text NOT NULL DEFAULT 'signed',
  start_date date,
  end_date date,
  total_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MRU',
  signed_at timestamptz,
  signed_by uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS contracts_contract_number_key ON btp.contracts (contract_number);
CREATE INDEX IF NOT EXISTS contracts_project_id_idx ON btp.contracts (project_id);
CREATE INDEX IF NOT EXISTS contracts_tender_id_idx ON btp.contracts (tender_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.contracts TO authenticated;
GRANT ALL ON btp.contracts TO service_role;

ALTER TABLE btp.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contracts"
  ON btp.contracts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Managers can create contracts"
  ON btp.contracts FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','manager','director']));

CREATE POLICY "Managers can update contracts"
  ON btp.contracts FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','manager','director']));

CREATE POLICY "Admins can delete contracts"
  ON btp.contracts FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','director']));

CREATE TRIGGER contracts_set_updated_at
  BEFORE UPDATE ON btp.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();