-- =============================================================================
-- MIGRATION: align_project_tables_columns
-- Description: Ajout des colonnes manquantes à projects et project_phases
-- =============================================================================

-- PARTIE 1 : AJOUT DES COLONNES À LA TABLE projects
-- =============================================================================

ALTER TABLE btp.projects
ADD COLUMN IF NOT EXISTS referential_code text;

COMMENT ON COLUMN btp.projects.referential_code IS 'Code référentiel du projet (ex: SCAPP, etc.)';


-- PARTIE 2 : AJOUT DES COLONNES À LA TABLE project_phases
-- =============================================================================
-- Cette section aligne la table avec la définition TypeScript utilisée par le frontend.

ALTER TABLE btp.project_phases
ADD COLUMN IF NOT EXISTS phase_name text,
ADD COLUMN IF NOT EXISTS phase_type text,
ADD COLUMN IF NOT EXISTS status text,
ADD COLUMN IF NOT EXISTS progress numeric,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS estimated_cost numeric,
ADD COLUMN IF NOT EXISTS actual_cost numeric,
ADD COLUMN IF NOT EXISTS dependencies jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS milestones jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS construction_phase text,
ADD COLUMN IF NOT EXISTS construction_stage text,
ADD COLUMN IF NOT EXISTS custom_phase_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS materials jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS human_resources jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS suppliers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 0.1,
ADD COLUMN IF NOT EXISTS order_index integer,
ADD COLUMN IF NOT EXISTS actual_duration integer;

COMMENT ON COLUMN btp.project_phases.phase_name IS 'Nom de la phase';
COMMENT ON COLUMN btp.project_phases.phase_type IS 'Type de phase (ex: conception, construction, livraison)';
COMMENT ON COLUMN btp.project_phases.status IS 'Statut de la phase';
COMMENT ON COLUMN btp.project_phases.progress IS 'Pourcentage d''avancement (0-100)';
COMMENT ON COLUMN btp.project_phases.description IS 'Description détaillée de la phase';
COMMENT ON COLUMN btp.project_phases.estimated_cost IS 'Coût estimé de la phase';
COMMENT ON COLUMN btp.project_phases.actual_cost IS 'Coût réel de la phase';
COMMENT ON COLUMN btp.project_phases.dependencies IS 'Liste des dépendances (JSON)';
COMMENT ON COLUMN btp.project_phases.milestones IS 'Jalons associés à la phase (JSON)';
COMMENT ON COLUMN btp.project_phases.notes IS 'Notes supplémentaires sur la phase';
COMMENT ON COLUMN btp.project_phases.construction_phase IS 'Phase de construction associée';
COMMENT ON COLUMN btp.project_phases.construction_stage IS 'Étape de construction associée';
COMMENT ON COLUMN btp.project_phases.custom_phase_data IS 'Données personnalisées de la phase (JSON)';
COMMENT ON COLUMN btp.project_phases.materials IS 'Matériaux associés (JSON)';
COMMENT ON COLUMN btp.project_phases.human_resources IS 'Ressources humaines associées (JSON)';
COMMENT ON COLUMN btp.project_phases.suppliers IS 'Fournisseurs associés (JSON)';
COMMENT ON COLUMN btp.project_phases.location IS 'Localisation géographique de la phase';
COMMENT ON COLUMN btp.project_phases.weight IS 'Poids de la phase dans le projet';
COMMENT ON COLUMN btp.project_phases.order_index IS 'Ordre d''exécution de la phase';


-- PARTIE 3 : SUPPRESSION DES VUES RÉCURSIVES (POUR ÉVITER LES ERREURS FUTURES)
-- =============================================================================
-- Les vues récursives (vue qui porte le même nom que la table) sont inutiles dans Supabase.
-- Elles sont supprimées pour garantir la stabilité des futures migrations.
/*
DROP VIEW IF EXISTS btp.project_phases CASCADE;
DROP VIEW IF EXISTS btp.projects CASCADE;
*/

-- PARTIE 4 : RECHARGEMENT DU SCHÉMA POUR PostgREST
-- =============================================================================
NOTIFY pgrst, 'reload schema';