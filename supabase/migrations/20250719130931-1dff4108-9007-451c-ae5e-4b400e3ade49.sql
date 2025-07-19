-- Create Indexes for Performance (corrected)
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON public.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_coordinates ON public.projects(coordinates_latitude, coordinates_longitude);

CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON public.project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_status ON public.project_phases(status);
CREATE INDEX IF NOT EXISTS idx_project_phases_dates ON public.project_phases(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_materials_category ON public.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_supplier ON public.materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_materials_code ON public.materials(material_code);
CREATE INDEX IF NOT EXISTS idx_materials_status ON public.materials(material_status);

CREATE INDEX IF NOT EXISTS idx_suppliers_category ON public.suppliers(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON public.suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON public.suppliers(rating);

CREATE INDEX IF NOT EXISTS idx_tenders_status ON public.tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_project ON public.tenders(project_id);
CREATE INDEX IF NOT EXISTS idx_tenders_dates ON public.tenders(launch_date, attribution_date);

CREATE INDEX IF NOT EXISTS idx_documents_project ON public.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON public.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_quantity_takeoffs_project ON public.quantity_takeoffs(project_id);
CREATE INDEX IF NOT EXISTS idx_quantity_takeoffs_material ON public.quantity_takeoffs(material_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Create Triggers for Updated_at columns
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
DROP TRIGGER IF EXISTS update_projects_timestamp ON public.projects;
CREATE TRIGGER update_projects_timestamp
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_project_phases_timestamp ON public.project_phases;
CREATE TRIGGER update_project_phases_timestamp
  BEFORE UPDATE ON public.project_phases
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

DROP TRIGGER IF EXISTS update_documents_timestamp ON public.documents;
CREATE TRIGGER update_documents_timestamp
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_quantity_takeoffs_timestamp ON public.quantity_takeoffs;
CREATE TRIGGER update_quantity_takeoffs_timestamp
  BEFORE UPDATE ON public.quantity_takeoffs
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_workspaces_timestamp ON public.workspaces;
CREATE TRIGGER update_workspaces_timestamp
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();