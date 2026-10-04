ALTER TABLE btp.materials
  ADD COLUMN IF NOT EXISTS supplier_id uuid,
  ADD COLUMN IF NOT EXISTS lead_time_days integer;

CREATE INDEX IF NOT EXISTS idx_btp_materials_supplier_id ON btp.materials(supplier_id);

COMMENT ON COLUMN btp.materials.supplier_id IS 'Fournisseur référencé (btp.suppliers) — round-trip UI->DB du sélecteur fournisseur';
COMMENT ON COLUMN btp.materials.lead_time_days IS 'Délai de livraison en jours issu du fournisseur ou saisi manuellement';