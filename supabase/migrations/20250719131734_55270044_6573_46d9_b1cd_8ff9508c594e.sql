-- Create project_phases table
CREATE TABLE btp.project_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  phase_name TEXT NOT NULL,
  phase_type TEXT NOT NULL DEFAULT 'construction',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  description TEXT,
  estimated_cost NUMERIC,
  actual_cost NUMERIC,
  dependencies JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

-- Add foreign key constraint to projects table
ALTER TABLE btp.project_phases 
ADD CONSTRAINT fk_project_phases_project 
FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE btp.project_phases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON btp.project_phases
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON btp.project_phases
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON btp.project_phases
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON btp.project_phases
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON btp.project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_status ON btp.project_phases(status);
CREATE INDEX IF NOT EXISTS idx_project_phases_dates ON btp.project_phases(start_date, end_date);

-- Add trigger for updated_at timestamp
CREATE TRIGGER update_project_phases_timestamp
  BEFORE UPDATE ON btp.project_phases
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();