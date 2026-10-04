ALTER TABLE btp.payments ADD COLUMN IF NOT EXISTS notes text;
COMMENT ON COLUMN btp.payments.notes IS 'Notes additionnelles du paiement';