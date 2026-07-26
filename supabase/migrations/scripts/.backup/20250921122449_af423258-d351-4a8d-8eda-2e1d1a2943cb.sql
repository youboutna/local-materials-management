-- Create enhanced tables for project management with relationships, dependencies, and advanced features

-- First, let's add missing columns to task_assignments table for comprehensive task management
ALTER TABLE task_assignments 
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

-- Create task dependencies table for managing task relationships
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Enable RLS on task_dependencies
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- Create policy for task_dependencies
CREATE POLICY "Users can manage task dependencies for accessible projects" ON task_dependencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM task_assignments ta 
      JOIN projects p ON ta.project_id = p.id 
      WHERE ta.id = task_dependencies.task_id
    )
  );

-- Add missing columns to project_risks table for enhanced risk management
ALTER TABLE project_risks 
ADD COLUMN IF NOT EXISTS probability INTEGER CHECK (probability >= 0 AND probability <= 100),
ADD COLUMN IF NOT EXISTS impact INTEGER CHECK (impact >= 0 AND impact <= 100),
ADD COLUMN IF NOT EXISTS risk_score INTEGER GENERATED ALWAYS AS (probability * impact / 100) STORED,
ADD COLUMN IF NOT EXISTS mitigation_plan TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'monitored', 'mitigated', 'resolved')),
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create risk-task relationships table
CREATE TABLE IF NOT EXISTS risk_task_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES project_risks(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(risk_id, task_id)
);

-- Enable RLS on risk_task_relations
ALTER TABLE risk_task_relations ENABLE ROW LEVEL SECURITY;

-- Create policy for risk_task_relations
CREATE POLICY "Users can manage risk-task relations for accessible projects" ON risk_task_relations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM project_risks pr 
      JOIN projects p ON pr.project_id = p.id 
      WHERE pr.id = risk_task_relations.risk_id
    )
  );

-- Add phase dependencies to project_phases
ALTER TABLE project_phases 
ADD COLUMN IF NOT EXISTS weight DECIMAL(3,2) DEFAULT 0.1,
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb;

-- Create project milestones table for tracking key deliverables
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL,
  target_date DATE NOT NULL,
  completed_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
  weight DECIMAL(3,2) DEFAULT 0.1,
  notes TEXT,
  dependencies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on project_milestones
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- Create policy for project_milestones
CREATE POLICY "Users can manage milestones for accessible projects" ON project_milestones
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p 
      WHERE p.id = project_milestones.project_id
    )
  );

-- Create resource assignments table for tracking resource allocation to tasks
CREATE TABLE IF NOT EXISTS resource_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES project_resources(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES task_assignments(id) ON DELETE CASCADE,
  allocation_percentage INTEGER DEFAULT 100 CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
  start_date DATE,
  end_date DATE,
  hourly_rate DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(resource_id, task_id)
);

-- Enable RLS on resource_assignments
ALTER TABLE resource_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy for resource_assignments
CREATE POLICY "Users can manage resource assignments for accessible projects" ON resource_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM task_assignments ta 
      JOIN projects p ON ta.project_id = p.id 
      WHERE ta.id = resource_assignments.task_id
    )
  );

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_risk_task_relations_risk_id ON risk_task_relations(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_task_relations_task_id ON risk_task_relations(task_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_phase_id ON project_milestones(phase_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_resource_id ON resource_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_task_id ON resource_assignments(task_id);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update timestamps
DROP TRIGGER IF EXISTS update_project_risks_updated_at ON project_risks;
CREATE TRIGGER update_project_risks_updated_at
  BEFORE UPDATE ON project_risks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_milestones_updated_at ON project_milestones;
CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();