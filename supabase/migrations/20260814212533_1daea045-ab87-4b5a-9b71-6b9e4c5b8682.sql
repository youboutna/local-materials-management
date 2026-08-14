-- Grants manquants (cause des erreurs 400 sur les garanties bancaires et assurances)
GRANT USAGE ON SCHEMA btp TO authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.bank_guarantees TO authenticated;
GRANT ALL ON btp.bank_guarantees TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.insurance_certificates TO authenticated;
GRANT ALL ON btp.insurance_certificates TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_guarantees TO authenticated;
GRANT ALL ON public.bank_guarantees TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.insurance_certificates TO authenticated;
GRANT ALL ON public.insurance_certificates TO service_role;

-- Politique DELETE manquante
DROP POLICY IF EXISTS "Authenticated users can delete btp.bank_guarantees" ON btp.bank_guarantees;
CREATE POLICY "Authenticated users can delete btp.bank_guarantees"
  ON btp.bank_guarantees FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete btp.insurance_certificates" ON btp.insurance_certificates;
CREATE POLICY "Authenticated users can delete btp.insurance_certificates"
  ON btp.insurance_certificates FOR DELETE TO authenticated USING (true);

-- Le titulaire (contractor) n'est pas toujours connu à la saisie
ALTER TABLE btp.bank_guarantees ALTER COLUMN contractor_id DROP NOT NULL;
ALTER TABLE btp.insurance_certificates ALTER COLUMN contractor_id DROP NOT NULL;
ALTER TABLE btp.insurance_certificates ALTER COLUMN contractor_name DROP NOT NULL;