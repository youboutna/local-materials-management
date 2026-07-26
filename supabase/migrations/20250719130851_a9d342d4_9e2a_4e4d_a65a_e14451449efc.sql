-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON btp.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON btp.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_responsable ON btp.projects(project_responsable_id);
CREATE INDEX IF NOT EXISTS idx_projects_coordinates ON btp.projects(coordinates_latitude, coordinates_longitude);

CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON btp.project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_status ON btp.project_phases(status);
CREATE INDEX IF NOT EXISTS idx_project_phases_dates ON btp.project_phases(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_materials_category ON btp.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_supplier ON btp.materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_materials_code ON btp.materials(material_code);
CREATE INDEX IF NOT EXISTS idx_materials_status ON btp.materials(material_status);

CREATE INDEX IF NOT EXISTS idx_suppliers_category ON btp.suppliers(category);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON btp.suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_rating ON btp.suppliers(rating);

CREATE INDEX IF NOT EXISTS idx_tenders_status ON btp.tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_project ON btp.tenders(project_id);
CREATE INDEX IF NOT EXISTS idx_tenders_dates ON btp.tenders(launch_date, attribution_date);

CREATE INDEX IF NOT EXISTS idx_documents_project ON btp.documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON btp.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON btp.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON btp.documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_quantity_takeoffs_project ON btp.quantity_takeoffs(project_id);
CREATE INDEX IF NOT EXISTS idx_quantity_takeoffs_material ON btp.quantity_takeoffs(material_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON btp.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON btp.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON btp.notifications(type);

CREATE INDEX IF NOT EXISTS idx_project_comments_project ON btp.project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_user ON btp.project_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_material_suppliers_material ON btp.material_suppliers(material_id);
CREATE INDEX IF NOT EXISTS idx_material_suppliers_supplier ON btp.material_suppliers(supplier_id);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON btp.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON btp.project_milestones(status);

CREATE INDEX IF NOT EXISTS idx_project_risks_project ON btp.project_risks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_risks_level ON btp.project_risks(risk_level);

-- Create Triggers for Updated_at columns
CREATE OR REPLACE FUNCTION btp.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at columns
DROP TRIGGER IF EXISTS update_projects_timestamp ON btp.projects;
CREATE TRIGGER update_projects_timestamp
  BEFORE UPDATE ON btp.projects
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();

DROP TRIGGER IF EXISTS update_project_phases_timestamp ON btp.project_phases;
CREATE TRIGGER update_project_phases_timestamp
  BEFORE UPDATE ON btp.project_phases
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

DROP TRIGGER IF EXISTS update_documents_timestamp ON btp.documents;
CREATE TRIGGER update_documents_timestamp
  BEFORE UPDATE ON btp.documents
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();

DROP TRIGGER IF EXISTS update_quantity_takeoffs_timestamp ON btp.quantity_takeoffs;
CREATE TRIGGER update_quantity_takeoffs_timestamp
  BEFORE UPDATE ON btp.quantity_takeoffs
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();

DROP TRIGGER IF EXISTS update_workspaces_timestamp ON btp.workspaces;
CREATE TRIGGER update_workspaces_timestamp
  BEFORE UPDATE ON btp.workspaces
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();

DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();

DROP TRIGGER IF EXISTS update_project_comments_timestamp ON btp.project_comments;
CREATE TRIGGER update_project_comments_timestamp
  BEFORE UPDATE ON btp.project_comments
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();

DROP TRIGGER IF EXISTS update_project_milestones_timestamp ON btp.project_milestones;
CREATE TRIGGER update_project_milestones_timestamp
  BEFORE UPDATE ON btp.project_milestones
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();

DROP TRIGGER IF EXISTS update_project_risks_timestamp ON btp.project_risks;
CREATE TRIGGER update_project_risks_timestamp
  BEFORE UPDATE ON btp.project_risks
  FOR EACH ROW EXECUTE FUNCTION btp.update_timestamp();