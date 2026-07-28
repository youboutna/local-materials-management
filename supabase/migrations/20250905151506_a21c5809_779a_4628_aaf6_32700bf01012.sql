-- Add check_schedule_last_run column to projects table
ALTER TABLE btp.projects 
ADD COLUMN IF NOT EXISTS check_schedule_last_run JSONB DEFAULT '{}'::jsonb;

-- Drop and recreate project_resources with simplified structure
DROP TABLE IF EXISTS btp.project_resources CASCADE;

CREATE TABLE IF NOT EXISTS btp.project_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES btp.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('human', 'material')),
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit TEXT,
  cost_per_unit DECIMAL(15,2),
  total_cost DECIMAL(15,2),
  allocation_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_alerts table
CREATE TABLE IF NOT EXISTS btp.project_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES btp.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  source TEXT,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  escalation_level INTEGER DEFAULT 1,
  assigned_actions TEXT[],
  action_proofs JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
--alter tables
  ALTER TABLE btp.project_alerts
  ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
  
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_resources_project_id ON btp.project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_type ON btp.project_resources(type);
CREATE INDEX IF NOT EXISTS idx_project_alerts_project_id ON btp.project_alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_alerts_severity ON btp.project_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_project_alerts_acknowledged ON btp.project_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_project_alerts_resolved ON btp.project_alerts(resolved);

-- Enable Row Level Security
ALTER TABLE btp.project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.project_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_resources
/* CREATE POLICY "Users can view project resources if they have project access" 
ON btp.project_resources 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM btp.projects 
    WHERE projects.id = project_resources.project_id 
    AND (projects.project_responsable_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM btp.task_assignmentss WHERE project_id = projects.id
    ))
  )
);

CREATE POLICY "Users can create project resources if they have project access" 
ON btp.project_resources 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM btp.projects 
    WHERE projects.id = project_resources.project_id 
    AND (projects.project_responsable_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM btp.task_assignmentss WHERE project_id = projects.id
    ))
  )
);

CREATE POLICY "Users can update project resources if they have project access" 
ON btp.project_resources 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM btp.projects 
    WHERE projects.id = project_resources.project_id 
    AND (projects.project_responsable_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM btp.task_assignmentss WHERE project_id = projects.id
    ))
  )
);

CREATE POLICY "Users can delete project resources if they have project access" 
ON btp.project_resources 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM btp.projects 
    WHERE projects.id = project_resources.project_id 
    AND (projects.project_responsable_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM btp.task_assignmentss WHERE project_id = projects.id
    ))
  )
);

-- Create RLS policies for project_alerts
CREATE POLICY "Users can view project alerts if they have project access" 
ON btp.project_alerts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM btp.projects 
    WHERE projects.id = project_alerts.project_id 
    AND (projects.project_responsable_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM btp.task_assignmentss WHERE project_id = projects.id
    ))
  )
);

CREATE POLICY "Users can create project alerts if they have project access" 
ON btp.project_alerts 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM btp.projects 
    WHERE projects.id = project_alerts.project_id 
    AND (projects.project_responsable_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM btp.task_assignmentss WHERE project_id = projects.id
    ))
  )
);

CREATE POLICY "Users can update project alerts if they have project access" 
ON btp.project_alerts 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM btp.projects 
    WHERE projects.id = project_alerts.project_id 
    AND (projects.project_responsable_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM btp.task_assignmentss WHERE project_id = projects.id
    ))
  )
);

CREATE POLICY "Users can delete project alerts if they have project access" 
ON btp.project_alerts 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM btp.projects 
    WHERE projects.id = project_alerts.project_id 
    AND (projects.project_responsable_id = auth.uid() OR auth.uid() IN (
      SELECT user_id FROM btp.task_assignmentss WHERE project_id = projects.id
    ))
  )
);


-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_project_resources_updated_at
BEFORE UPDATE ON btp.project_resources
FOR EACH ROW
EXECUTE FUNCTION btp.update_updated_at_column();

CREATE TRIGGER update_project_alerts_updated_at
BEFORE UPDATE ON btp.project_alerts
FOR EACH ROW
EXECUTE FUNCTION btp.update_updated_at_column();
*/