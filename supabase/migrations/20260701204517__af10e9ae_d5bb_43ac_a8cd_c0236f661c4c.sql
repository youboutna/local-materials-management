
ALTER TABLE btp.tender_estimate_items
  ADD COLUMN IF NOT EXISTS item_code TEXT,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS specifications TEXT,
  ADD COLUMN IF NOT EXISTS resource_kind TEXT CHECK (resource_kind IN ('internal_qualification','external_provider','material')),
  ADD COLUMN IF NOT EXISTS employee_qualification_id UUID,
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS supplier_contract_ref TEXT,
  ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC;

CREATE INDEX IF NOT EXISTS idx_tender_estimate_items_resource_kind ON btp.tender_estimate_items(resource_kind);
CREATE INDEX IF NOT EXISTS idx_tender_estimate_items_employee_qual ON btp.tender_estimate_items(employee_qualification_id);
CREATE INDEX IF NOT EXISTS idx_tender_estimate_items_supplier ON btp.tender_estimate_items(supplier_id);
