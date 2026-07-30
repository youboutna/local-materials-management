-- =============================================================================
-- MIGRATION: enhance_project_stakeholders_columns
-- Description: Ajout des nouvelles colonnes à la table btp.project_stakeholders
-- =============================================================================

-- 1. Ajout des colonnes à la table (sans toucher aux vues inutiles)
ALTER TABLE btp.project_stakeholders
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS external_name text,
  ADD COLUMN IF NOT EXISTS external_email text,
  ADD COLUMN IF NOT EXISTS external_phone text,
  ADD COLUMN IF NOT EXISTS responsibilities text[],
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS hourly_rate numeric,
  ADD COLUMN IF NOT EXISTS contract_type text,
  ADD COLUMN IF NOT EXISTS notes text;

-- 2. Mise à jour des commentaires pour documenter les nouveaux champs
COMMENT ON COLUMN btp.project_stakeholders.is_active IS 'Indique si le stakeholder est actuellement actif sur le projet';
COMMENT ON COLUMN btp.project_stakeholders.external_name IS 'Nom complet de la personne externe (si pas employee/supplier)';
COMMENT ON COLUMN btp.project_stakeholders.external_email IS 'Email de la personne externe';
COMMENT ON COLUMN btp.project_stakeholders.external_phone IS 'Numéro de téléphone de la personne externe';
COMMENT ON COLUMN btp.project_stakeholders.responsibilities IS 'Liste des responsabilités assumées par ce stakeholder';
COMMENT ON COLUMN btp.project_stakeholders.start_date IS 'Date de début d''intervention du stakeholder';
COMMENT ON COLUMN btp.project_stakeholders.end_date IS 'Date de fin d''intervention du stakeholder';
COMMENT ON COLUMN btp.project_stakeholders.hourly_rate IS 'Taux horaire facturé par le stakeholder (si applicable)';
COMMENT ON COLUMN btp.project_stakeholders.contract_type IS 'Type de contrat liant le stakeholder au projet';
COMMENT ON COLUMN btp.project_stakeholders.notes IS 'Notes supplémentaires concernant le stakeholder';

-- 3. Octroi des permissions GRANT (Aucune vue n'est nécessaire)
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.project_stakeholders TO authenticated;
GRANT ALL ON btp.project_stakeholders TO service_role;

-- 4. Rechargement du schéma pour PostgREST
NOTIFY pgrst, 'reload schema';