ALTER TABLE btp.quantity_takeoffs DROP CONSTRAINT IF EXISTS quantity_takeoffs_unit_check;
ALTER TABLE btp.quantity_takeoffs ADD CONSTRAINT quantity_takeoffs_unit_check CHECK (unit = ANY (ARRAY[
  'm³','m²','m','ml','unité','unite','piece','pièce','ens','forfait','jour','h',
  'kg','tonne','t','tons','g','l','litre','sac','u','m2','m3'
]));