-- 1. Structure hardening for btp.escalation_thresholds
ALTER TABLE btp.escalation_thresholds
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

UPDATE btp.escalation_thresholds SET id = gen_random_uuid() WHERE id IS NULL;

ALTER TABLE btp.escalation_thresholds ALTER COLUMN id SET NOT NULL;
ALTER TABLE btp.escalation_thresholds ALTER COLUMN threshold_type SET NOT NULL;
ALTER TABLE btp.escalation_thresholds ALTER COLUMN threshold_name SET NOT NULL;
ALTER TABLE btp.escalation_thresholds ALTER COLUMN threshold_value SET NOT NULL;
ALTER TABLE btp.escalation_thresholds ALTER COLUMN threshold_unit SET DEFAULT 'days';
ALTER TABLE btp.escalation_thresholds ALTER COLUMN severity_level SET DEFAULT 'medium';
ALTER TABLE btp.escalation_thresholds ALTER COLUMN escalation_level SET DEFAULT 1;
ALTER TABLE btp.escalation_thresholds ALTER COLUMN is_active SET DEFAULT true;
ALTER TABLE btp.escalation_thresholds ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE btp.escalation_thresholds ALTER COLUMN updated_at SET DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'btp.escalation_thresholds'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE btp.escalation_thresholds ADD PRIMARY KEY (id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS escalation_thresholds_type_name_key
  ON btp.escalation_thresholds (threshold_type, threshold_name);

-- 2. Data API grants (absents jusqu'ici : la table était injoignable)
GRANT SELECT ON btp.escalation_thresholds TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.escalation_thresholds TO authenticated;
GRANT ALL ON btp.escalation_thresholds TO service_role;

-- 3. RLS
ALTER TABLE btp.escalation_thresholds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS escalation_thresholds_select ON btp.escalation_thresholds;
CREATE POLICY escalation_thresholds_select
  ON btp.escalation_thresholds FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS escalation_thresholds_write ON btp.escalation_thresholds;
CREATE POLICY escalation_thresholds_write
  ON btp.escalation_thresholds FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','director','manager']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','director','manager']));

-- 4. Seed depuis le référentiel métier (valeurs par défaut idempotentes)
INSERT INTO btp.escalation_thresholds
  (threshold_type, threshold_name, threshold_value, threshold_unit, severity_level, escalation_level, description, is_active)
VALUES
  ('project_delay','Retard modéré',7,'days','low',1,'Retard de planning supérieur à 7 jours : alerte chef de projet',true),
  ('project_delay','Retard significatif',15,'days','medium',2,'Retard supérieur à 15 jours : escalade au directeur de projet',true),
  ('project_delay','Retard critique',30,'days','critical',3,'Retard supérieur à 30 jours : escalade direction générale',true),
  ('project_delay','Dérive avancement',10,'percentage','high',2,'Écart avancement planifié/réalisé supérieur à 10 %',true),
  ('insurance_expiry','Préavis standard',60,'days','low',1,'Assurance expirant dans 60 jours : notification gestionnaire',true),
  ('insurance_expiry','Préavis rapproché',30,'days','medium',2,'Assurance expirant dans 30 jours : relance formelle',true),
  ('insurance_expiry','Préavis critique',7,'days','critical',3,'Assurance expirant dans 7 jours : blocage des paiements',true),
  ('payment_validation','Validation en attente',10,'days','medium',1,'Demande de paiement non validée après 10 jours',true),
  ('payment_validation','Validation bloquée',20,'days','high',2,'Demande de paiement bloquée depuis 20 jours',true),
  ('payment_validation','Écart montant',5,'percentage','critical',3,'Écart supérieur à 5 % entre montant demandé et montant certifié',true),
  ('inspection_overdue','Inspection en retard',5,'days','medium',1,'Inspection planifiée non réalisée après 5 jours',true),
  ('inspection_overdue','Inspection très en retard',15,'days','high',2,'Inspection non réalisée après 15 jours',true),
  ('inspection_overdue','Non-conformité non levée',30,'days','critical',3,'Non-conformité ouverte depuis plus de 30 jours',true),
  ('material_wastage','Gaspillage toléré',5,'percentage','low',1,'Écart métré/consommé supérieur à 5 %',true),
  ('material_wastage','Gaspillage anormal',10,'percentage','high',2,'Écart métré/consommé supérieur à 10 %',true),
  ('budget_allocation','Consommation élevée',80,'percentage','medium',1,'Budget de phase consommé à plus de 80 %',true),
  ('budget_allocation','Dépassement budget',100,'percentage','critical',3,'Budget de projet dépassé (engagement > crédit)',true)
ON CONFLICT (threshold_type, threshold_name) DO NOTHING;