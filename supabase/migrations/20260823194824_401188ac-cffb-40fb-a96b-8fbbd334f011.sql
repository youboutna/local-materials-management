-- =============================================================
-- Référentiels configurables : code technique + labels fr/ar/en
-- =============================================================

CREATE TABLE IF NOT EXISTS btp.referential_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  code TEXT NOT NULL,
  label_fr TEXT NOT NULL,
  label_ar TEXT,
  label_en TEXT,
  parent_code TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_custom BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  project_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS referential_items_domain_code_project_uidx
  ON btp.referential_items (domain, code, COALESCE(project_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX IF NOT EXISTS referential_items_domain_idx ON btp.referential_items (domain, is_active, order_index);

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.referential_items TO authenticated;
GRANT ALL ON btp.referential_items TO service_role;

ALTER TABLE btp.referential_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referential_items_select_authenticated"
  ON btp.referential_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "referential_items_write_managers"
  ON btp.referential_items FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','director','directeur_cnh','directeur_dgp','manager']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','director','directeur_cnh','directeur_dgp','manager']));

CREATE TRIGGER referential_items_set_updated_at
  BEFORE UPDATE ON btp.referential_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- -------------------------------------------------------------
-- Labels multilingues sur les référentiels configurables existants
-- -------------------------------------------------------------
ALTER TABLE btp.project_phases
  ADD COLUMN IF NOT EXISTS label_fr TEXT,
  ADD COLUMN IF NOT EXISTS label_ar TEXT,
  ADD COLUMN IF NOT EXISTS label_en TEXT;

UPDATE btp.project_phases SET label_fr = COALESCE(label_fr, phase_name) WHERE label_fr IS NULL;

ALTER TABLE btp.tender_steps
  ADD COLUMN IF NOT EXISTS label_fr TEXT,
  ADD COLUMN IF NOT EXISTS label_ar TEXT,
  ADD COLUMN IF NOT EXISTS label_en TEXT;

ALTER TABLE btp.workflow_status
  ADD COLUMN IF NOT EXISTS label_fr TEXT,
  ADD COLUMN IF NOT EXISTS label_ar TEXT,
  ADD COLUMN IF NOT EXISTS label_en TEXT;

-- -------------------------------------------------------------
-- Seed des référentiels système configurables
-- -------------------------------------------------------------
INSERT INTO btp.referential_items (domain, code, label_fr, label_ar, label_en, order_index, is_custom)
VALUES
  ('document_category','administrative','Administratif','إداري','Administrative',1,false),
  ('document_category','technical','Technique','تقني','Technical',2,false),
  ('document_category','inspection','Inspections & Rapports','التفتيش والتقارير','Inspections & Reports',3,false),
  ('document_category','financial','Financier','مالي','Financial',4,false),
  ('document_category','compliance','Conformité','المطابقة','Compliance',5,false),
  ('document_category','tender','Appels d''offres','المناقصات','Tenders',6,false),
  ('document_category','delivery','Livraisons','التسليمات','Deliveries',7,false),
  ('document_category','media','Photos & Médias','الصور والوسائط','Photos & Media',8,false),
  ('document_category','hr','Ressources humaines','الموارد البشرية','Human resources',9,false),
  ('document_category','other','Autres','أخرى','Other',10,false),
  ('material_category','construction','Matériaux de construction','مواد البناء','Construction materials',1,false),
  ('material_category','electrical','Matériaux électriques','مواد كهربائية','Electrical materials',2,false),
  ('material_category','plumbing','Plomberie','السباكة','Plumbing',3,false),
  ('material_category','finishing','Finition','التشطيب','Finishing',4,false),
  ('weighting_model','pareto','Pareto 80/20','باريتو 80/20','Pareto 80/20',1,false),
  ('weighting_model','somelec_standard','SOMELEC standard','سوملك القياسي','SOMELEC standard',2,false),
  ('weighting_model','eter_road_maintenance','ETER entretien routier','إيتير صيانة الطرق','ETER road maintenance',3,false)
ON CONFLICT DO NOTHING;