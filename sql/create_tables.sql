-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- USERS & ROLES STRUCTURE (Outside Supabase)
-- =========================================

-- Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL UNIQUE
);

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  phone VARCHAR,
  national_id VARCHAR UNIQUE,
  password_hash TEXT,
  role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Profiles Table (extended user data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  avatar_url VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =========================================
-- PROJECTS & MATERIALS & RELATIONS
-- =========================================

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR NOT NULL,
  status VARCHAR NOT NULL,
  progress INT NOT NULL,
  budget DECIMAL NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  thumbnail VARCHAR,
  team_size INT NOT NULL,
  coordinates_latitude FLOAT,
  coordinates_longitude FLOAT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL,
  unit VARCHAR NOT NULL,
  price_per_unit DECIMAL NOT NULL,
  inventory_count INT NOT NULL,
  source_location VARCHAR,
  coordinates_latitude FLOAT,
  coordinates_longitude FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (project_id, material_id)
);

-- =========================================
-- ROW LEVEL SECURITY CONFIGURATION
-- =========================================

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------
-- POLICIES using JWT claims (via pgjwt / Keycloak headers)
-- -----------------------------------------

-- Grant SELECT on own profile
CREATE POLICY select_own_profile ON public.profiles
FOR SELECT TO public
USING (
  id::text = current_setting('request.jwt.claims', true)::json ->> 'sub'
);

-- Grant UPDATE on own profile
CREATE POLICY update_own_profile ON public.profiles
FOR UPDATE TO public
USING (
  id::text = current_setting('request.jwt.claims', true)::json ->> 'sub'
)
WITH CHECK (
  id::text = current_setting('request.jwt.claims', true)::json ->> 'sub'
);

-- Grant SELECT on projects to everyone authenticated
CREATE POLICY select_all_projects ON public.projects
FOR SELECT TO public
USING (true);

-- Allow INSERT if role is project_manager or admin
CREATE POLICY insert_project_policy ON public.projects
FOR INSERT TO public
WITH CHECK (
  (current_setting('request.jwt.claims', true)::json ->> 'role') IN ('project_manager', 'admin')
);

-- Allow UPDATE on own projects
CREATE POLICY update_own_project_policy ON public.projects
FOR UPDATE TO public
USING (
  created_by::text = current_setting('request.jwt.claims', true)::json ->> 'sub'
);

-- Allow DELETE on own projects
CREATE POLICY delete_own_project_policy ON public.projects
FOR DELETE TO public
USING (
  created_by::text = current_setting('request.jwt.claims', true)::json ->> 'sub'
);

-- Read-only access to materials and project_materials
CREATE POLICY select_materials_policy ON public.materials
FOR SELECT TO public
USING (true);

CREATE POLICY select_project_materials_policy ON public.project_materials
FOR SELECT TO public
USING (true);

-- =========================================
-- DEFAULT ROLE SEEDING (Optional)
-- =========================================

INSERT INTO public.roles (id, name) VALUES
  (uuid_generate_v4(), 'admin'),
  (uuid_generate_v4(), 'project_manager'),
  (uuid_generate_v4(), 'supervisor'),
  (uuid_generate_v4(), 'viewer')
ON CONFLICT DO NOTHING;

-- =========================================
-- Optional Trigger: auto-create profile on insert (non-Supabase)
-- =========================================

CREATE OR REPLACE FUNCTION public.create_profile_after_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_profile ON public.users;

CREATE TRIGGER trigger_create_profile
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.create_profile_after_user();

