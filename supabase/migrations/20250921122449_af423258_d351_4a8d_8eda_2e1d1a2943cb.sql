-- Create enhanced tables for project management with relationships, dependencies, and advanced features

-- First, let's add missing columns to task_assignments table for comprehensive task management
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

-- Create task dependencies table for managing task relationships
CREATE TABLE IF NOT EXISTS btp.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES btp.task_assignments(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES btp.task_assignments(id) ON DELETE CASCADE,
  dependency_type TEXT DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  lag_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, depends_on_task_id)
);

-- Enable RLS on task_dependencies
ALTER TABLE IF EXISTS btp.task_dependencies ENABLE ROW LEVEL SECURITY;

-- Create policy for task_dependencies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'task_dependencies' AND policyname = 'Users can manage task dependencies for accessible projects'
  ) THEN
    CREATE POLICY "Users can manage task dependencies for accessible projects" ON btp.task_dependencies
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM btp.task_assignments ta 
          JOIN btp.projects p ON ta.project_id = p.id 
          WHERE ta.id = btp.task_dependencies.task_id
        )
      );
  END IF;
END $$;

-- Add missing columns to project_risks table for enhanced risk management
ALTER TABLE btp.project_risks 
ADD COLUMN IF NOT EXISTS probability INTEGER CHECK (probability >= 0 AND probability <= 100),
ADD COLUMN IF NOT EXISTS impact INTEGER CHECK (impact >= 0 AND impact <= 100),
ADD COLUMN IF NOT EXISTS mitigation_plan TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'monitored', 'mitigated', 'resolved')),
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add risk_score column separately
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'btp' 
    AND table_name = 'project_risks' 
    AND column_name = 'risk_score'
  ) THEN
    ALTER TABLE btp.project_risks ADD COLUMN risk_score INTEGER;
  END IF;
END $$;

-- Create function to calculate risk_score (outside DO block)
CREATE OR REPLACE FUNCTION btp.calculate_risk_score()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.probability IS NOT NULL AND NEW.impact IS NOT NULL THEN
    NEW.risk_score := (NEW.probability * NEW.impact) / 100;
  ELSE
    NEW.risk_score := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate risk_score
DROP TRIGGER IF EXISTS calculate_risk_score_trigger ON btp.project_risks;
CREATE TRIGGER calculate_risk_score_trigger
  BEFORE INSERT OR UPDATE OF probability, impact ON btp.project_risks
  FOR EACH ROW
  EXECUTE FUNCTION btp.calculate_risk_score();

-- Update existing rows with calculated risk_score
UPDATE btp.project_risks 
SET risk_score = (probability * impact) / 100 
WHERE probability IS NOT NULL AND impact IS NOT NULL;

-- Create risk-task relationships table
CREATE TABLE IF NOT EXISTS btp.risk_task_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES btp.project_risks(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES btp.task_assignments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(risk_id, task_id)
);

-- Enable RLS on risk_task_relations
ALTER TABLE btp.risk_task_relations ENABLE ROW LEVEL SECURITY;

-- Create policy for risk_task_relations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'risk_task_relations' AND policyname = 'Users can manage risk-task relations for accessible projects'
  ) THEN
    CREATE POLICY "Users can manage risk-task relations for accessible projects" ON btp.risk_task_relations
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM btp.project_risks pr 
          JOIN btp.projects p ON pr.project_id = p.id 
          WHERE pr.id = btp.risk_task_relations.risk_id
        )
      );
  END IF;
END $$;

-- Add phase dependencies to project_phases
ALTER TABLE btp.project_phases 
ADD COLUMN IF NOT EXISTS weight DECIMAL(3,2) DEFAULT 0.1,
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER,
ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb;

-- Create project milestones table for tracking key deliverables
CREATE TABLE IF NOT EXISTS btp.project_milestones (
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

-- Enable RLS on project_milestones
ALTER TABLE btp.project_milestones ENABLE ROW LEVEL SECURITY;

-- Create policy for project_milestones
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'project_milestones' AND policyname = 'Users can manage milestones for accessible projects'
  ) THEN
    CREATE POLICY "Users can manage milestones for accessible projects" ON btp.project_milestones
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM btp.projects p 
          WHERE p.id = btp.project_milestones.project_id
        )
      );
  END IF;
END $$;

-- Create resource assignments table for tracking resource allocation to tasks
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

-- Enable RLS on resource_assignments
ALTER TABLE btp.resource_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy for resource_assignments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'resource_assignments' AND policyname = 'Users can manage resource assignments for accessible projects'
  ) THEN
    CREATE POLICY "Users can manage resource assignments for accessible projects" ON btp.resource_assignments
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM btp.task_assignments ta 
          JOIN btp.projects p ON ta.project_id = p.id 
          WHERE ta.id = btp.resource_assignments.task_id
        )
      );
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_dependencies_task_id ON btp.task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_dependencies_depends_on ON btp.task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_risk_task_relations_risk_id ON btp.risk_task_relations(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_task_relations_task_id ON btp.risk_task_relations(task_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON btp.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_phase_id ON btp.project_milestones(phase_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_resource_id ON btp.resource_assignments(resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_assignments_task_id ON btp.resource_assignments(task_id);

-- Create triggers for updating timestamps
CREATE OR REPLACE FUNCTION btp.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to update timestamps
DROP TRIGGER IF EXISTS update_project_risks_updated_at ON btp.project_risks;
CREATE TRIGGER update_project_risks_updated_at
  BEFORE UPDATE ON btp.project_risks
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_milestones_updated_at ON btp.project_milestones;
CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON btp.project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_updated_at_column();