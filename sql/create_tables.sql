-- ============================
-- EXTENSIONS
-- ============================
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

CREATE TYPE user_role AS ENUM (
  'admin', 'manager', 'director', 'agent', 'supplier', 'user'
);

CREATE TYPE document_status AS ENUM (
  'draft', 'pending_review', 'approved', 'rejected', 'archived'
);

-- ============================
-- TABLES
-- ============================

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instance_id UUID,
  aud VARCHAR,
  role VARCHAR,
  email VARCHAR,
  encrypted_password VARCHAR,
  email_confirmed_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ,
  confirmation_token VARCHAR,
  confirmation_sent_at TIMESTAMPTZ,
  recovery_token VARCHAR,
  recovery_sent_at TIMESTAMPTZ,
  email_change_token_new VARCHAR,
  email_change VARCHAR,
  email_change_sent_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  is_super_admin BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  phone TEXT,
  phone_confirmed_at TIMESTAMPTZ,
  phone_change TEXT,
  phone_change_token VARCHAR,
  phone_change_sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  email_change_token_current VARCHAR,
  email_change_confirm_status INT2,
  banned_until TIMESTAMPTZ,
  reauthentication_token VARCHAR,
  reauthentication_sent_at TIMESTAMPTZ,
  is_sso_user BOOLEAN,
  deleted_at TIMESTAMPTZ,
  is_anonymous BOOLEAN
);

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  national_id TEXT,
  avatar_url TEXT,
  role user_role,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- USER ROLES
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_name user_role NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, role_name)
);

-- PROJECTS
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

-- PAYMENTS
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

-- INSPECTIONS
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

-- PROJECT MATERIALS
CREATE TABLE project_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  material_id UUID NOT NULL,
  quantity NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TASK ASSIGNMENTS
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

-- NOTIFICATIONS
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

-- MATERIALS
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  available_quantity NUMERIC(10, 2),
  price_per_unit NUMERIC(12, 2),
  unit TEXT,
  image TEXT,
  localisation JSONB,
  adresse JSONB,
  forme TEXT,
  origin_location TEXT,
  coordinates_latitude DOUBLE PRECISION,
  coordinates_longitude DOUBLE PRECISION,
  workspace_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUPPLIERS
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  contact_person TEXT,
  category TEXT,
  rating NUMERIC(3, 2),
  is_active BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WORKSPACES
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  contact_manager TEXT,
  contact_phone TEXT,
  facilities JSONB,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DOCUMENTS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  document_type TEXT,
  status document_status,
  tags TEXT[],
  assigned_to TEXT,
  inspection_id UUID,
  metadata JSONB,
  uploaded_by TEXT,
  category TEXT,
  subcategory TEXT,
  tender_document_id UUID REFERENCES tender_documents(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TENDER DOCUMENTS
CREATE TABLE tender_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) NOT NULL,
  category TEXT,
  subcategory TEXT,
  is_required BOOLEAN,
  is_submitted BOOLEAN,
  submission_date TIMESTAMPTZ,
  reviewer_notes TEXT,
  status TEXT,
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
-- RLS POLICIES (EXAMPLES)
-- ============================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_projects ON projects
  FOR SELECT TO public
  USING (
    created_by = current_setting('request.jwt.claims', true)::json ->> 'sub'
  );

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

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_own_notifications ON notifications
  FOR SELECT TO public
  USING (
    recipient_id = current_setting('request.jwt.claims', true)::json ->> 'sub'
  );

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_all_inspections ON inspections
  FOR SELECT TO public
  USING (true);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY select_all_payments ON payments
  FOR SELECT TO public
  USING (true);

-- Add similar RLS for other tables as needed.
