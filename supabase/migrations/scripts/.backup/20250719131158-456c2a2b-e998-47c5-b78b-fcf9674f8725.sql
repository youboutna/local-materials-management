-- Enable Row Level Security and create basic policies for existing tables

-- Projects table policies
ALTER TABLE btp.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON btp.projects;
CREATE POLICY "Enable read access for all users" ON btp.projects
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON btp.projects;
CREATE POLICY "Enable insert for authenticated users only" ON btp.projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON btp.projects;
CREATE POLICY "Enable update for authenticated users only" ON btp.projects
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON btp.projects;
CREATE POLICY "Enable delete for authenticated users only" ON btp.projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Materials table policies
ALTER TABLE btp.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to materials" ON btp.materials;
CREATE POLICY "Allow public access to materials" ON btp.materials
    FOR ALL USING (true);

-- Suppliers table policies  
ALTER TABLE btp.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage suppliers" ON btp.suppliers;
CREATE POLICY "Users can manage suppliers" ON btp.suppliers
    FOR ALL USING (true);

-- Tenders table policies
ALTER TABLE btp.tenders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON btp.tenders;
CREATE POLICY "Enable read access for authenticated users" ON btp.tenders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON btp.tenders;
CREATE POLICY "Enable insert access for authenticated users" ON btp.tenders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON btp.tenders;
CREATE POLICY "Enable update access for authenticated users" ON btp.tenders
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON btp.tenders;
CREATE POLICY "Enable delete access for authenticated users" ON btp.tenders
    FOR DELETE USING (true);

-- Documents table policies (already has policies, keeping existing ones)

-- Project materials table policies
ALTER TABLE btp.project_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to project_materials" ON btp.project_materials;
CREATE POLICY "Allow public access to project_materials" ON btp.project_materials
    FOR ALL USING (true);

-- Add basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON btp.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON btp.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_budget ON btp.projects(budget);

CREATE INDEX IF NOT EXISTS idx_materials_category ON btp.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_price ON btp.materials(price_per_unit);

CREATE INDEX IF NOT EXISTS idx_suppliers_category ON btp.suppliers(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON btp.suppliers(is_active);

CREATE INDEX IF NOT EXISTS idx_tenders_status ON btp.tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_project ON btp.tenders(project_id);

-- Create update triggers for timestamp management
CREATE OR REPLACE FUNCTION btp.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables that have updated_at columns
DROP TRIGGER IF EXISTS update_projects_timestamp ON btp.projects;
CREATE TRIGGER update_projects_timestamp
  BEFORE UPDATE ON btp.projects
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();

DROP TRIGGER IF EXISTS update_materials_timestamp ON btp.materials;
CREATE TRIGGER update_materials_timestamp
  BEFORE UPDATE ON btp.materials
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();

DROP TRIGGER IF EXISTS update_suppliers_timestamp ON btp.suppliers;
CREATE TRIGGER update_suppliers_timestamp
  BEFORE UPDATE ON btp.suppliers
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();

DROP TRIGGER IF EXISTS update_tenders_timestamp ON btp.tenders;
CREATE TRIGGER update_tenders_timestamp
  BEFORE UPDATE ON btp.tenders
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();