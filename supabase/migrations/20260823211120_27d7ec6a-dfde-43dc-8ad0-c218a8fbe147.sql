-- 1) Tables avec RLS activé mais AUCUNE policy => totalement inaccessibles (bug fonctionnel) et grants anon trop larges.

-- btp.material_suppliers : référentiel fournisseurs/prix matériaux
REVOKE ALL ON btp.material_suppliers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.material_suppliers TO authenticated;
GRANT ALL ON btp.material_suppliers TO service_role;
CREATE POLICY "material_suppliers_read_authenticated" ON btp.material_suppliers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "material_suppliers_write_managers" ON btp.material_suppliers
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','director','manager']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','director','manager']));

-- btp.profit_distributions : données financières sensibles
REVOKE ALL ON btp.profit_distributions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.profit_distributions TO authenticated;
GRANT ALL ON btp.profit_distributions TO service_role;
CREATE POLICY "profit_distributions_read_own_or_admin" ON btp.profit_distributions
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','director']));
CREATE POLICY "profit_distributions_write_admin" ON btp.profit_distributions
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','director']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','director']));

-- btp.supply_requests : demandes d'approvisionnement
REVOKE ALL ON btp.supply_requests FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.supply_requests TO authenticated;
GRANT ALL ON btp.supply_requests TO service_role;
CREATE POLICY "supply_requests_read_authenticated" ON btp.supply_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "supply_requests_insert_own" ON btp.supply_requests
  FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());
CREATE POLICY "supply_requests_update_own_or_manager" ON btp.supply_requests
  FOR UPDATE TO authenticated
  USING (requested_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','director','manager']));
CREATE POLICY "supply_requests_delete_manager" ON btp.supply_requests
  FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','director','manager']));

-- public.payment_blocks : blocages de paiement (contrôle des paiements)
REVOKE ALL ON public.payment_blocks FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_blocks TO authenticated;
GRANT ALL ON public.payment_blocks TO service_role;
CREATE POLICY "payment_blocks_read_authenticated" ON public.payment_blocks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "payment_blocks_write_controllers" ON public.payment_blocks
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','director','manager']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','director','manager']));

-- public.profit_distributions
REVOKE ALL ON public.profit_distributions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profit_distributions TO authenticated;
GRANT ALL ON public.profit_distributions TO service_role;
CREATE POLICY "pub_profit_distributions_read_own_or_admin" ON public.profit_distributions
  FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','director']));
CREATE POLICY "pub_profit_distributions_write_admin" ON public.profit_distributions
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','director']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','director']));

-- public.project_risks : registre des risques projet
REVOKE ALL ON public.project_risks FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_risks TO authenticated;
GRANT ALL ON public.project_risks TO service_role;
CREATE POLICY "project_risks_read_authenticated" ON public.project_risks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "project_risks_insert_authenticated" ON public.project_risks
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "project_risks_update_owner_or_manager" ON public.project_risks
  FOR UPDATE TO authenticated
  USING (identified_by = auth.uid() OR owner_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','director','manager']));
CREATE POLICY "project_risks_delete_manager" ON public.project_risks
  FOR DELETE TO authenticated
  USING (identified_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','director','manager']));

-- public.supply_requests
REVOKE ALL ON public.supply_requests FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supply_requests TO authenticated;
GRANT ALL ON public.supply_requests TO service_role;
CREATE POLICY "pub_supply_requests_read_authenticated" ON public.supply_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "pub_supply_requests_insert_own" ON public.supply_requests
  FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid());
CREATE POLICY "pub_supply_requests_update_own_or_manager" ON public.supply_requests
  FOR UPDATE TO authenticated
  USING (requested_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY['admin','director','manager']));
CREATE POLICY "pub_supply_requests_delete_manager" ON public.supply_requests
  FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','director','manager']));

-- 2) Harmonisation du vocabulaire des unités du métré (tonnes/pluriel + unités BOQ manquantes)
ALTER TABLE btp.quantity_takeoffs DROP CONSTRAINT IF EXISTS quantity_takeoffs_unit_check;
ALTER TABLE btp.quantity_takeoffs ADD CONSTRAINT quantity_takeoffs_unit_check CHECK (
  unit IN (
    'm','ml','m2','m²','m3','m³','kg','t','tonne','tonnes','tons',
    'u','unite','unité','piece','pièce','ens','ensemble','forfait','ft',
    'l','litre','litres','sac','sacs','jour','jours','h','heure','heures',
    'mois','an','ans','%','lot','pt','points'
  )
);