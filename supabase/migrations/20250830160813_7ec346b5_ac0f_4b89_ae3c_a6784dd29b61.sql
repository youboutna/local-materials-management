-- Add phase_id columns to existing tables to link items to specific phases
ALTER TABLE btp.task_assignments ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES btp.project_phases(id) ON DELETE SET NULL;
ALTER TABLE btp.documents ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES btp.project_phases(id) ON DELETE SET NULL;
ALTER TABLE btp.payments ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES btp.project_phases(id) ON DELETE SET NULL;
ALTER TABLE btp.inspections ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES btp.project_phases(id) ON DELETE SET NULL;
ALTER TABLE btp.project_materials ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES btp.project_phases(id) ON DELETE SET NULL;

-- Create phase_employees table for managing employees assigned to phases
CREATE TABLE btp.phase_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES btp.project_phases(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  employee_role TEXT NOT NULL,
  employee_contact TEXT,
  daily_rate NUMERIC,
  start_date DATE,
  end_date DATE,
  is_primary_supplier BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on phase_employees
ALTER TABLE btp.phase_employees ENABLE ROW LEVEL SECURITY;

-- Create policies for phase_employees
CREATE POLICY "Allow all operations on phase_employees" 
ON btp.phase_employees 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_phase_id ON btp.task_assignments(phase_id);
CREATE INDEX IF NOT EXISTS idx_documents_phase_id ON btp.documents(phase_id);
CREATE INDEX IF NOT EXISTS idx_payments_phase_id ON btp.payments(phase_id);
CREATE INDEX IF NOT EXISTS idx_inspections_phase_id ON btp.inspections(phase_id);
CREATE INDEX IF NOT EXISTS idx_project_materials_phase_id ON btp.project_materials(phase_id);
CREATE INDEX IF NOT EXISTS idx_phase_employees_phase_id ON btp.phase_employees(phase_id);

-- Add trigger for updated_at on phase_employees
CREATE TRIGGER update_phase_employees_updated_at
  BEFORE UPDATE ON btp.phase_employees
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_timestamp();