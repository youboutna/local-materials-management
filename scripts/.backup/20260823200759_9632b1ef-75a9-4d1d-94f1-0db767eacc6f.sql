ALTER TABLE btp.quantity_takeoffs DROP CONSTRAINT IF EXISTS quantity_takeoffs_unit_check;
ALTER TABLE btp.quantity_takeoffs ADD CONSTRAINT quantity_takeoffs_unit_check
  CHECK (unit = ANY (ARRAY['m³','m²','m','unité','jour','forfait','kg','tonne','l','ml','m2','m3','unite','piece']::text[]));