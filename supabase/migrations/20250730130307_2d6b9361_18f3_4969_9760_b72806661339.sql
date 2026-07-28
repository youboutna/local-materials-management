-- =============================================================================
-- MIGRATION: add_project_reference
-- Description: Ajoute la colonne project_reference à la table btp.projects
-- =============================================================================

-- Add project_reference column to projects table in btp schema
ALTER TABLE btp.projects ADD COLUMN IF NOT EXISTS project_reference TEXT;

-- Add comment
COMMENT ON COLUMN btp.projects.project_reference IS 'Référence unique du projet';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Colonne project_reference ajoutée à btp.projects';
END $$;