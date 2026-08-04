-- =============================================================================
-- MIGRATION: add_remaining_milestone_columns
-- Description: Ajoute les dernières colonnes manquantes pour Milestone
-- =============================================================================

-- Colonnes non encore ajoutées
ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS is_from_template BOOLEAN DEFAULT false;

ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'checkpoint';

ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS assigned_to UUID;