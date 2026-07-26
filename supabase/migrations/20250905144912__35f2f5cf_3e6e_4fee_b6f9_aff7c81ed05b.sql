-- Create comprehensive project management tables to support the full ProjectData model

-- Project phases table
CREATE TABLE IF NOT EXISTS project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  phase_type TEXT NOT NULL CHECK (phase_type IN ('pre_construction', 'site_preparation', 'foundation', 'framing', 'structural_work', 'finishing', 'post_construction', 'handover')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  estimated_duration INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
  weight DECIMAL(4,3) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  phase_type TEXT NOT NULL CHECK (phase_type IN ('pre_construction', 'site_preparation', 'foundation', 'framing', 'structural_work', 'finishing', 'post_construction', 'handover')),
  stage_type TEXT NOT NULL CHECK (stage_type IN ('planning_design', 'permits_approvals', 'site_clearing', 'excavation', 'foundation_work', 'structural_framing', 'roofing', 'electrical_plumbing', 'interior_finishing', 'exterior_finishing', 'final_inspection', 'handover_complete')),
  target_date DATE NOT NULL,
  completed_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  notes TEXT,
  weight DECIMAL(4,3) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  phase_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  dependencies TEXT[] DEFAULT '{}',
  assigned_to UUID[] DEFAULT '{}',
  estimated_duration INTEGER NOT NULL,
  actual_duration INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  weight DECIMAL(4,3) NOT NULL DEFAULT 0.0,
  cost_estimate DECIMAL(15,2),
  actual_cost DECIMAL(15,2),
  optimistic_estimate INTEGER,
  pessimistic_estimate INTEGER,
  critical_path BOOLEAN DEFAULT FALSE,
  gantt_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (phase_id) REFERENCES project_phases(id) ON DELETE SET NULL
);

-- Project risks table
CREATE TABLE IF NOT EXISTS project_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  probability INTEGER NOT NULL CHECK (probability >= 0 AND probability <= 100),
  impact INTEGER NOT NULL CHECK (impact >= 0 AND impact <= 100),
  mitigation_plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'identified' CHECK (status IN ('identified', 'monitored', 'mitigated', 'resolved')),
  related_tasks TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project resources table
CREATE TABLE IF NOT EXISTS project_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('human', 'material', 'equipment')),
  skills TEXT[] DEFAULT '{}',
  cost_per_hour DECIMAL(10,2),
  availability INTEGER NOT NULL DEFAULT 100 CHECK (availability >= 0 AND availability <= 100),
  assigned_tasks TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project contacts table
CREATE TABLE IF NOT EXISTS project_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project insurance policies table (enhance existing insurance_certificates)
CREATE TABLE IF NOT EXISTS project_insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('assurance', 'garantie_bancaire')),
  reference TEXT NOT NULL,
  issuer TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  coverage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired')),
  renewal_date DATE,
  documents TEXT[] DEFAULT '{}',
  notes TEXT,
  alert_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Project alerts table
CREATE TABLE IF NOT EXISTS project_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('insurance_expiry', 'project_delay', 'inspection_issue', 'financial_risk')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_id UUID,
  trigger_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  action_required BOOLEAN DEFAULT FALSE,
  action_taken TEXT,
  action_taken_by UUID,
  action_taken_at TIMESTAMPTZ,
  escalation_level INTEGER DEFAULT 1,
  available_actions TEXT[] DEFAULT '{}',
  deadline DATE,
  recurrence INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Add new columns to projects table if they don't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS financing_source TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS market_type TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS selection_mode TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS launch_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS attribution_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_responsable_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS main_contractor TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_reference TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS allows_initial_payment BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS initial_payment_percentage INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_phase TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_stage TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS methodology TEXT DEFAULT 'waterfall';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS escalation_thresholds JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS check_schedule JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS coordinates_latitude DECIMAL(10,8);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS coordinates_longitude DECIMAL(11,8);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_risks_project_id ON project_risks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_resources_project_id ON project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contacts_project_id ON project_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_alerts_project_id ON project_alerts(project_id);

-- Enable RLS on all new tables
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view project phases" ON project_phases FOR SELECT USING (true);
CREATE POLICY "Users can manage project phases" ON project_phases FOR ALL USING (true);

CREATE POLICY "Users can view project milestones" ON project_milestones FOR SELECT USING (true);
CREATE POLICY "Users can manage project milestones" ON project_milestones FOR ALL USING (true);

CREATE POLICY "Users can view project tasks" ON project_tasks FOR SELECT USING (true);
CREATE POLICY "Users can manage project tasks" ON project_tasks FOR ALL USING (true);

CREATE POLICY "Users can view project risks" ON project_risks FOR SELECT USING (true);
CREATE POLICY "Users can manage project risks" ON project_risks FOR ALL USING (true);

CREATE POLICY "Users can view project resources" ON project_resources FOR SELECT USING (true);
CREATE POLICY "Users can manage project resources" ON project_resources FOR ALL USING (true);

CREATE POLICY "Users can view project contacts" ON project_contacts FOR SELECT USING (true);
CREATE POLICY "Users can manage project contacts" ON project_contacts FOR ALL USING (true);

CREATE POLICY "Users can view project insurance policies" ON project_insurance_policies FOR SELECT USING (true);
CREATE POLICY "Users can manage project insurance policies" ON project_insurance_policies FOR ALL USING (true);

CREATE POLICY "Users can view project alerts" ON project_alerts FOR SELECT USING (true);
CREATE POLICY "Users can manage project alerts" ON project_alerts FOR ALL USING (true);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_phases_updated_at BEFORE UPDATE ON project_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON project_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_risks_updated_at BEFORE UPDATE ON project_risks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_resources_updated_at BEFORE UPDATE ON project_resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_contacts_updated_at BEFORE UPDATE ON project_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_insurance_policies_updated_at BEFORE UPDATE ON project_insurance_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_alerts_updated_at BEFORE UPDATE ON project_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();