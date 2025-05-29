
-- Extensions recommandées pour Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================
-- ENUM TYPES
-- ============================

CREATE TYPE project_status AS ENUM (
  'en cours', 'terminé', 'en attente', 'en inspection', 'suspendu', 'annulé'
);

CREATE TYPE inspection_status AS ENUM (
  'approved', 'requires_changes', 'rejected', 'pending'
);

CREATE TYPE task_status AS ENUM (
  'pending', 'in_progress', 'completed', 'cancelled'
);

CREATE TYPE task_priority AS ENUM (
  'low', 'medium', 'high', 'urgent'
);

CREATE TYPE notification_type AS ENUM (
  'task_assignment', 'project_update', 'inspection_required',
  'payment_due', 'document_review', 'system'
);

CREATE TYPE task_type AS ENUM (
  'project', 'inspection', 'document', 'payment', 'material', 'general'
);

-- ============================
-- TABLES
-- ============================

-- Table: projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  status project_status NOT NULL,
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  budget NUMERIC(12, 2),
  start_date DATE NOT NULL,
  end_date DATE,
  thumbnail TEXT,
  team_size INTEGER,
  coordinates_latitude DOUBLE PRECISION,
  coordinates_longitude DOUBLE PRECISION,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  progress_at_payment INTEGER CHECK (progress_at_payment >= 0 AND progress_at_payment <= 100),
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: inspections
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status inspection_status NOT NULL,
  inspector TEXT NOT NULL,
  progress_at_inspection INTEGER CHECK (progress_at_inspection >= 0 AND progress_at_inspection <= 100),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: project_materials
CREATE TABLE project_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  material_id UUID NOT NULL,
  quantity NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: task_assignments
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  status task_status NOT NULL,
  priority task_priority NOT NULL,
  due_date DATE,
  completion_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type NOT NULL,
  related_id UUID,
  metadata JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- INDEXES
-- ============================

CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_inspections_project_id ON inspections(project_id);
CREATE INDEX idx_project_materials_project_id ON project_materials(project_id);
CREATE INDEX idx_task_assignments_project_id ON task_assignments(project_id);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_task_assignments_status ON task_assignments(status);
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================
-- RLS POLICIES
-- ============================

-- RLS for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_projects ON projects
FOR SELECT TO public
USING (
  created_by = current_setting('request.jwt.claims', true)::json ->> 'sub'
);

-- RLS for task_assignments
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_tasks ON task_assignments
FOR SELECT TO public
USING (
  assigned_to = current_setting('request.jwt.claims', true)::json ->> 'sub'
);

CREATE POLICY insert_task_policy ON task_assignments
FOR INSERT TO public
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('project_manager', 'admin')
);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_own_notifications ON notifications
FOR SELECT TO public
USING (
  recipient_id = current_setting('request.jwt.claims', true)::json ->> 'sub'
);

-- RLS for inspections
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_all_inspections ON inspections
FOR SELECT TO public
USING (true);

-- RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_all_payments ON payments
FOR SELECT TO public
USING (true);
