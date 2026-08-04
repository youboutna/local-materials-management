-- =============================================================================
-- MIGRATION: unify_project_milestones
-- Description: Fusion des tables de jalons en respectant la convention snake_case
-- =============================================================================

-- 1. Ajout des colonnes manquantes à la table originale (snake_case)
ALTER TABLE btp.project_milestones 
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES btp.project_phases(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stage_type TEXT,
ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS weight DECIMAL(4,3) DEFAULT 0.0;

-- 2. Migration des données depuis la table obsolète, si elle existe encore.
-- Les anciennes versions ne possèdent pas les colonnes ajoutées ci-dessus.
/* DO $$
BEGIN
    IF to_regclass('btp.enhanced_project_milestones') IS NOT NULL THEN
        INSERT INTO btp.project_milestones (
                id, project_id, title, description, phase_id,
                target_date, completion_date, status, notes, weight,
                dependencies, created_at, updated_at
        )
        SELECT
                id, project_id, title, description, phase_id,
                target_date, completion_date, status, NULL::text, 0.0,
                dependencies, created_at, updated_at
        FROM btp.enhanced_project_milestones
        ON CONFLICT (id) DO NOTHING;
    END IF;
END
$$;
*/
-- 3. Suppression définitive de la table en double
DROP TABLE IF EXISTS btp.enhanced_project_milestones CASCADE;

-- 4. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_project_milestones_phase ON btp.project_milestones(phase_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON btp.project_milestones(status);

-- 5. Rechargement du schéma pour PostgREST
NOTIFY pgrst, 'reload schema';