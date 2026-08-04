-- =============================================================================
-- MIGRATION: add_missing_columns_to_project_milestones
-- Description: Ajoute uniquement les colonnes manquantes dans btp.project_milestones
-- =============================================================================

-- 1. Ajouter les colonnes manquantes (non présentes dans votre CREATE TABLE)
ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS is_critical BOOLEAN DEFAULT false;

ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS milestone_type TEXT DEFAULT 'checkpoint';

ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal';

ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS predecessor_ids TEXT[] DEFAULT '{}';

ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS expected_deliverables TEXT[] DEFAULT '{}';

ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS approval_requirements TEXT[] DEFAULT '{}';

ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS relative_offset_days INTEGER DEFAULT 0;

ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS assigned_to UUID;

ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb;