-- Enable Row Level Security and create basic policies for existing tables

-- Projects table policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.projects;
CREATE POLICY "Enable read access for all users" ON public.projects
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.projects;
CREATE POLICY "Enable insert for authenticated users only" ON public.projects
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.projects;
CREATE POLICY "Enable update for authenticated users only" ON public.projects
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.projects;
CREATE POLICY "Enable delete for authenticated users only" ON public.projects
    FOR DELETE USING (auth.role() = 'authenticated');

-- Materials table policies
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to materials" ON public.materials;
CREATE POLICY "Allow public access to materials" ON public.materials
    FOR ALL USING (true);

-- Suppliers table policies  
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage suppliers" ON public.suppliers;
CREATE POLICY "Users can manage suppliers" ON public.suppliers
    FOR ALL USING (true);

-- Tenders table policies
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.tenders;
CREATE POLICY "Enable read access for authenticated users" ON public.tenders
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.tenders;
CREATE POLICY "Enable insert access for authenticated users" ON public.tenders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.tenders;
CREATE POLICY "Enable update access for authenticated users" ON public.tenders
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.tenders;
CREATE POLICY "Enable delete access for authenticated users" ON public.tenders
    FOR DELETE USING (true);

-- Documents table policies (already has policies, keeping existing ones)

-- Project materials table policies
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access to project_materials" ON public.project_materials;
CREATE POLICY "Allow public access to project_materials" ON public.project_materials
    FOR ALL USING (true);

-- Add basic indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_budget ON public.projects(budget);

CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_price ON public.materials(price_per_unit);

CREATE INDEX IF NOT EXISTS idx_suppliers_category ON public.suppliers(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);

CREATE INDEX IF NOT EXISTS idx_tenders_status ON public.tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_project ON public.tenders(project_id);

-- Create update triggers for timestamp management
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables that have updated_at columns
DROP TRIGGER IF EXISTS update_projects_timestamp ON public.projects;
CREATE TRIGGER update_projects_timestamp
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_materials_timestamp ON public.materials;
CREATE TRIGGER update_materials_timestamp
  BEFORE UPDATE ON public.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_suppliers_timestamp ON public.suppliers;
CREATE TRIGGER update_suppliers_timestamp
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_tenders_timestamp ON public.tenders;
CREATE TRIGGER update_tenders_timestamp
  BEFORE UPDATE ON public.tenders
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();