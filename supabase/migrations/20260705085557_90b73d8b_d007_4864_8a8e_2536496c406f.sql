-- =============================================================================
-- MIGRATION: enhance_quantity_takeoffs_and_tender_estimate_items
-- Description: Ajout des colonnes de liaison aux tables de métrés et d'estimations
-- =============================================================================

-- 1. Ajout des colonnes à la table quantity_takeoffs
ALTER TABLE btp.quantity_takeoffs
  ADD COLUMN IF NOT EXISTS task_id text NULL,
  ADD COLUMN IF NOT EXISTS milestone_id text NULL,
  ADD COLUMN IF NOT EXISTS phase_id text NULL,
  ADD COLUMN IF NOT EXISTS unit_price numeric NULL,
  ADD COLUMN IF NOT EXISTS total_value numeric NULL,
  ADD COLUMN IF NOT EXISTS vat_rate numeric NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS resource_type text NULL DEFAULT 'material',
  ADD COLUMN IF NOT EXISTS source text NULL DEFAULT 'quantity_takeoff';

-- 2. Ajout des colonnes à la table tender_estimate_items
ALTER TABLE btp.tender_estimate_items
  ADD COLUMN IF NOT EXISTS phase_id text NULL,
  ADD COLUMN IF NOT EXISTS milestone_id text NULL,
  ADD COLUMN IF NOT EXISTS task_id text NULL,
  ADD COLUMN IF NOT EXISTS resource_type text NULL DEFAULT 'material',
  ADD COLUMN IF NOT EXISTS bid_ref text NULL,
  ADD COLUMN IF NOT EXISTS submitted_by uuid NULL,
  ADD COLUMN IF NOT EXISTS source text NULL DEFAULT 'tender_estimate';

-- 3. Commentaires de documentation
COMMENT ON COLUMN btp.quantity_takeoffs.task_id IS 'ID de la tâche associée (si applicable)';
COMMENT ON COLUMN btp.quantity_takeoffs.milestone_id IS 'ID du jalon associé (si applicable)';
COMMENT ON COLUMN btp.quantity_takeoffs.phase_id IS 'ID de la phase associée (si applicable)';
COMMENT ON COLUMN btp.quantity_takeoffs.unit_price IS 'Prix unitaire de l''item';
COMMENT ON COLUMN btp.quantity_takeoffs.total_value IS 'Valeur totale (quantité * prix unitaire)';
COMMENT ON COLUMN btp.quantity_takeoffs.vat_rate IS 'Taux de TVA applicable';
COMMENT ON COLUMN btp.quantity_takeoffs.resource_type IS 'Type de ressource (material, labor, equipment, etc.)';
COMMENT ON COLUMN btp.quantity_takeoffs.source IS 'Source de la donnée (quantity_takeoff, tender_estimate, etc.)';

COMMENT ON COLUMN btp.tender_estimate_items.phase_id IS 'ID de la phase associée (si applicable)';
COMMENT ON COLUMN btp.tender_estimate_items.milestone_id IS 'ID du jalon associé (si applicable)';
COMMENT ON COLUMN btp.tender_estimate_items.task_id IS 'ID de la tâche associée (si applicable)';
COMMENT ON COLUMN btp.tender_estimate_items.resource_type IS 'Type de ressource (material, labor, equipment, etc.)';
COMMENT ON COLUMN btp.tender_estimate_items.bid_ref IS 'Référence de l''offre (si applicable)';
COMMENT ON COLUMN btp.tender_estimate_items.submitted_by IS 'ID de l''utilisateur ayant soumis l''estimation';
COMMENT ON COLUMN btp.tender_estimate_items.source IS 'Source de la donnée (tender_estimate, quantity_takeoff, etc.)';

-- 4. Octroi des droits (SANS les vues inutiles)
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.quantity_takeoffs TO authenticated;
GRANT ALL ON btp.quantity_takeoffs TO service_role;

-- 5. Rechargement du schéma pour PostgREST
NOTIFY pgrst, 'reload schema';