ALTER TABLE btp.organizations
  ADD COLUMN IF NOT EXISTS nif TEXT;

ALTER TABLE btp.boq_lines
  ADD COLUMN IF NOT EXISTS supplier_nif TEXT,
  ADD COLUMN IF NOT EXISTS supplier_nif_status TEXT
    CHECK (supplier_nif_status IS NULL OR supplier_nif_status IN ('active', 'inactive', 'unknown'));

COMMENT ON COLUMN btp.organizations.nif IS 'Identifiant fiscal national de l organisation';
COMMENT ON COLUMN btp.boq_lines.supplier_nif IS 'NIF du fournisseur utilisé pour la déductibilité fiscale';
COMMENT ON COLUMN btp.boq_lines.supplier_nif_status IS 'Statut de validation du NIF fournisseur';
