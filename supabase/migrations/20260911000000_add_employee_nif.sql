ALTER TABLE btp.employees
  ADD COLUMN IF NOT EXISTS nif TEXT;

COMMENT ON COLUMN btp.employees.nif IS
  'Numéro d identification fiscale de l employé, utilisable lorsqu une facture lui est adressée';
