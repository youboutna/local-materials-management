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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_own_user ON users;
CREATE POLICY select_own_user ON users
  FOR SELECT TO public
  USING (
    id = current_setting('request.jwt.claims', true)::json ->> 'sub'
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director')
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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_own_profile ON profiles;
CREATE POLICY select_own_profile ON profiles
  FOR SELECT TO public
  USING (
    id = current_setting('request.jwt.claims', true)::json ->> 'sub'
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director')
  );
DROP POLICY IF EXISTS manage_profiles_admin_director ON profiles;
CREATE POLICY manage_profiles_admin_director ON profiles
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director')
  );

-- USER ROLES
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_name user_role NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, role_name)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_own_user_roles ON user_roles;
CREATE POLICY select_own_user_roles ON user_roles
  FOR SELECT TO public
  USING (
    user_id = current_setting('request.jwt.claims', true)::json ->> 'sub'
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director')
  );
DROP POLICY IF EXISTS manage_roles_admin_director ON user_roles;
CREATE POLICY manage_roles_admin_director ON user_roles
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director')
  );

UPDATE user_roles SET role_name = 'manager' WHERE role_name = 'project_manager';

-- PROJECTS
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_projects_by_role ON projects;
CREATE POLICY select_projects_by_role ON projects
  FOR SELECT TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager', 'agent')
    OR created_by = current_setting('request.jwt.claims', true)::json ->> 'sub'
  );
DROP POLICY IF EXISTS manage_projects_admin_director_manager ON projects;
CREATE POLICY manage_projects_admin_director_manager ON projects
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  );

-- PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method TEXT,
  progress_at_payment INTEGER CHECK (progress_at_payment >= 0 AND progress_at_payment <= 100),
  transaction_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_payments_by_role ON payments;
CREATE POLICY select_payments_by_role ON payments
  FOR SELECT TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager', 'agent', 'supplier')
  );
DROP POLICY IF EXISTS manage_payments_admin_director_manager ON payments;
CREATE POLICY manage_payments_admin_director_manager ON payments
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  );

-- INSPECTIONS
CREATE TABLE inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status inspection_status NOT NULL,
  inspector TEXT NOT NULL,
  progress_at_inspection INTEGER CHECK (progress_at_inspection >= 0 AND progress_at_inspection <= 100),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_inspections_by_role ON inspections;
CREATE POLICY select_inspections_by_role ON inspections
  FOR SELECT TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager', 'agent')
  );
DROP POLICY IF EXISTS manage_inspections_admin_director_manager ON inspections;
CREATE POLICY manage_inspections_admin_director_manager ON inspections
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  );

-- PROJECT MATERIALS
CREATE TABLE project_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  material_id UUID NOT NULL,
  quantity NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_project_materials_by_role ON project_materials;
CREATE POLICY select_project_materials_by_role ON project_materials
  FOR SELECT TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager', 'agent')
  );
DROP POLICY IF EXISTS manage_project_materials_admin_director_manager ON project_materials;
CREATE POLICY manage_project_materials_admin_director_manager ON project_materials
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  );

-- TASK ASSIGNMENTS
CREATE TABLE task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_tasks_by_role ON task_assignments;
CREATE POLICY select_tasks_by_role ON task_assignments
  FOR SELECT TO public
  USING (
    assigned_to = current_setting('request.jwt.claims', true)::json ->> 'sub'
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  );
DROP POLICY IF EXISTS manage_tasks_admin_director_manager ON task_assignments;
CREATE POLICY manage_tasks_admin_director_manager ON task_assignments
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  );

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_own_notifications ON notifications;
CREATE POLICY select_own_notifications ON notifications
  FOR SELECT TO public
  USING (
    recipient_id = current_setting('request.jwt.claims', true)::json ->> 'sub'
    OR (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director')
  );
DROP POLICY IF EXISTS manage_notifications_admin_director ON notifications;
CREATE POLICY manage_notifications_admin_director ON notifications
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director')
  );

-- MATERIALS
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE btp.materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_materials_by_role ON materials;
CREATE POLICY select_materials_by_role ON materials
  FOR SELECT TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager', 'agent', 'supplier')
  );
DROP POLICY IF EXISTS manage_materials_admin_director_manager ON materials;
CREATE POLICY manage_materials_admin_director_manager ON materials
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  );

-- SUPPLIERS
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_suppliers_by_role ON suppliers;
CREATE POLICY select_suppliers_by_role ON suppliers
  FOR SELECT TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager', 'agent', 'supplier')
  );
DROP POLICY IF EXISTS manage_suppliers_admin_director ON suppliers;
CREATE POLICY manage_suppliers_admin_director ON suppliers
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director')
  );

-- WORKSPACES
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  contact_manager TEXT,
  contact_phone TEXT,
  facilities JSONB,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_workspaces_by_role ON workspaces;
CREATE POLICY select_workspaces_by_role ON workspaces
  FOR SELECT TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager', 'agent', 'supplier')
  );
DROP POLICY IF EXISTS manage_workspaces_admin_director_manager ON workspaces;
CREATE POLICY manage_workspaces_admin_director_manager ON workspaces
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  );

-- DOCUMENTS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_documents_by_role ON documents;
CREATE POLICY select_documents_by_role ON documents
  FOR SELECT TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager', 'agent', 'supplier')
    OR project_id IS NULL
  );
DROP POLICY IF EXISTS manage_documents_admin_director_manager ON documents;
CREATE POLICY manage_documents_admin_director_manager ON documents
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  );

-- TENDER DOCUMENTS
CREATE TABLE tender_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

ALTER TABLE tender_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS select_tender_documents_by_role ON tender_documents;
CREATE POLICY select_tender_documents_by_role ON tender_documents
  FOR SELECT TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager', 'agent')
  );
DROP POLICY IF EXISTS manage_tender_documents_admin_director_manager ON tender_documents;
CREATE POLICY manage_tender_documents_admin_director_manager ON tender_documents
  FOR ALL TO public
  USING (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  )
  WITH CHECK (
    (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('admin', 'director', 'manager')
  );

-- ============================
-- INDEXES
-- ============================
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON payments(project_id);
CREATE INDEX IF NOT EXISTS idx_inspections_project_id ON inspections(project_id);
CREATE INDEX IF NOT EXISTS idx_project_materials_project_id ON project_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_project_id ON task_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
