-- Add phase_id columns to existing tables to link items to specific phases
ALTER TABLE task_assignments ADD COLUMN phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL;
ALTER TABLE documents ADD COLUMN phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL;
ALTER TABLE payments ADD COLUMN phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL;
ALTER TABLE inspections ADD COLUMN phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL;
ALTER TABLE project_materials ADD COLUMN phase_id UUID REFERENCES project_phases(id) ON DELETE SET NULL;

-- Create phase_employees table for managing employees assigned to phases
CREATE TABLE phase_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES project_phases(id) ON DELETE CASCADE,
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
ALTER TABLE phase_employees ENABLE ROW LEVEL SECURITY;

-- Create policies for phase_employees
CREATE POLICY "Allow all operations on phase_employees" 
ON phase_employees 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_task_assignments_phase_id ON task_assignments(phase_id);
CREATE INDEX idx_documents_phase_id ON documents(phase_id);
CREATE INDEX idx_payments_phase_id ON payments(phase_id);
CREATE INDEX idx_inspections_phase_id ON inspections(phase_id);
CREATE INDEX idx_project_materials_phase_id ON project_materials(phase_id);
CREATE INDEX idx_phase_employees_phase_id ON phase_employees(phase_id);

-- Add trigger for updated_at on phase_employees
CREATE TRIGGER update_phase_employees_updated_at
  BEFORE UPDATE ON phase_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();