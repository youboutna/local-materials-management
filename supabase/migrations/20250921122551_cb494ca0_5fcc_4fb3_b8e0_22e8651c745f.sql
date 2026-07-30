-- =============================================================================
-- MIGRATION: enhance_project_tables_v2
-- Description: Ajout de fonctionnalités avancées (tâches, dépendances, risques)
-- =============================================================================

-- 1. Ajout des colonnes manquantes à task_assignments
ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
ADD COLUMN IF NOT EXISTS actual_duration INTEGER,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS weight DECIMAL(3,2) DEFAULT 0.1,
ADD COLUMN IF NOT EXISTS cost_estimate DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS optimistic_estimate INTEGER,
ADD COLUMN IF NOT EXISTS pessimistic_estimate INTEGER,
ADD COLUMN IF NOT EXISTS most_likely_estimate INTEGER,
ADD COLUMN IF NOT EXISTS critical_path BOOLEAN DEFAULT false;

-- 2. Création de la table task_dependencies
CREATE TABLE IF NOT EXISTS btp.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES btp.task_assignments(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES btp.task_assignments(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

ALTER TABLE btp.task_dependencies ENABLE ROW LEVEL SECURITY;

-- CORRECTION : Supprime la politique si elle existe déjà avant de la créer
DROP POLICY IF EXISTS "Users can manage task dependencies for accessible projects" ON btp.task_dependencies;

CREATE POLICY "Users can manage task dependencies for accessible projects" ON btp.task_dependencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM btp.task_assignments ta 
      JOIN btp.projects p ON ta.project_id = p.id 
      WHERE ta.id = btp.task_dependencies.task_id
    )
  );

-- 3. Ajout des colonnes à project_risks (en utilisant des noms uniques pour éviter les conflits)
ALTER TABLE btp.project_risks 
ADD COLUMN IF NOT EXISTS probability_numeric INTEGER CHECK (probability_numeric >= 0 AND probability_numeric <= 100),
ADD COLUMN IF NOT EXISTS impact_numeric INTEGER CHECK (impact_numeric >= 0 AND impact_numeric <= 100),
ADD COLUMN IF NOT EXISTS risk_score INTEGER,
ADD COLUMN IF NOT EXISTS mitigation_plan TEXT,
ADD COLUMN IF NOT EXISTS status_new TEXT DEFAULT 'identified' CHECK (status_new IN ('identified', 'monitored', 'mitigated', 'resolved')),
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS due_date DATE;

-- 4. Création de la table risk_task_relations
CREATE TABLE IF NOT EXISTS btp.risk_task_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES btp.project_risks(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES btp.task_assignments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(risk_id, task_id)
);

ALTER TABLE btp.risk_task_relations ENABLE ROW LEVEL SECURITY;

-- CORRECTION : Supprime la politique si elle existe déjà
DROP POLICY IF EXISTS "Users can manage risk-task relations for accessible projects" ON btp.risk_task_relations;

CREATE POLICY "Users can manage risk-task relations for accessible projects" ON btp.risk_task_relations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM btp.project_risks pr 
      JOIN btp.projects p ON pr.project_id = p.id 
      WHERE pr.id = btp.risk_task_relations.risk_id
    )
  );

-- 5. Ajout de colonnes aux phases de projet
ALTER TABLE btp.project_phases 
ADD COLUMN IF NOT EXISTS weight DECIMAL(3,2) DEFAULT 0.1,
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER;

-- 6. Création de la table enhanced_project_milestones
CREATE TABLE IF NOT EXISTS btp.enhanced_project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES btp.projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES btp.project_phases(id) ON DELETE SET NULL,
  target_date DATE NOT NULL,
  completed_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  weight DECIMAL(3,2) DEFAULT 0.1,
  notes TEXT,
  dependencies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE btp.enhanced_project_milestones ENABLE ROW LEVEL SECURITY;

-- CORRECTION : Supprime la politique si elle existe déjà
DROP POLICY IF EXISTS "Users can manage milestones for accessible projects" ON btp.enhanced_project_milestones;

CREATE POLICY "Users can manage milestones for accessible projects" ON btp.enhanced_project_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM btp.projects p 
      WHERE p.id = btp.enhanced_project_milestones.project_id
    )
  );

-- 7. Création de la table resource_assignments
CREATE TABLE IF NOT EXISTS btp.resource_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES btp.project_resources(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES btp.task_assignments(id) ON DELETE CASCADE,
  allocation_percentage INTEGER DEFAULT 100 CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
  start_date DATE,
  end_date DATE,
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource_id, task_id)
);

ALTER TABLE btp.resource_assignments ENABLE ROW LEVEL SECURITY;

-- CORRECTION : Supprime la politique si elle existe déjà
DROP POLICY IF EXISTS "Users can manage resource assignments for accessible projects" ON btp.resource_assignments;

CREATE POLICY "Users can manage resource assignments for accessible projects" ON btp.resource_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM btp.task_assignments ta 
      JOIN btp.projects p ON ta.project_id = p.id 
      WHERE ta.id = btp.resource_assignments.task_id
    )
  );

-- 8. Ajout des index pour les performances
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON btp.task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON btp.task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_risk_task_relations_risk_id ON btp.risk_task_relations(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_task_relations_task_id ON btp.risk_task_relations(task_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_project_milestones_project_id ON btp.enhanced_project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_project_milestones_phase_id ON btp.enhanced_project_milestones(phase_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_resource_id ON btp.resource_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_task_id ON btp.resource_assignments(task_id);

-- 9. Ajout des triggers pour la mise à jour des timestamps

-- Vérification que la fonction update_updated_at_column existe (pour éviter les erreurs si elle n'est pas créée)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_enhanced_project_milestones_updated_at ON btp.enhanced_project_milestones;
CREATE TRIGGER update_enhanced_project_milestones_updated_at
  BEFORE UPDATE ON btp.enhanced_project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();