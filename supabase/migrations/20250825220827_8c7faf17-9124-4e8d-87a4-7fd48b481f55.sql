-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  description text,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create organizational hierarchy table
CREATE TABLE IF NOT EXISTS public.organizational_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  position_title text NOT NULL,
  department text NOT NULL,
  level integer NOT NULL, -- 1 = top level, higher numbers = lower levels
  parent_id uuid REFERENCES public.organizational_hierarchy(id) ON DELETE SET NULL,
  direct_reports_count integer DEFAULT 0,
  can_approve_projects boolean DEFAULT false,
  can_approve_payments boolean DEFAULT false,
  can_escalate_to_director boolean DEFAULT false,
  notification_preferences jsonb DEFAULT '{"email": true, "sms": false, "in_app": true}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, employee_id)
);

-- Create project_organizations link table
CREATE TABLE IF NOT EXISTS public.project_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text NOT NULL, -- 'owner', 'contractor', 'subcontractor', 'consultant'
  is_primary boolean DEFAULT false,
  contract_amount numeric,
  contract_start_date date,
  contract_end_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(project_id, organization_id, role)
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizational_hierarchy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations
CREATE POLICY "Users can view organizations" 
ON public.organizations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage organizations" 
ON public.organizations 
FOR ALL 
USING (is_current_user_admin());

-- Create RLS policies for organizational_hierarchy
CREATE POLICY "Users can view org hierarchy" 
ON public.organizational_hierarchy 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage org hierarchy" 
ON public.organizational_hierarchy 
FOR ALL 
USING (is_current_user_admin());

-- Create RLS policies for project_organizations
CREATE POLICY "Users can view project organizations" 
ON public.project_organizations 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage project organizations" 
ON public.project_organizations 
FOR ALL 
USING (is_current_user_admin());

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizational_hierarchy_updated_at
  BEFORE UPDATE ON public.organizational_hierarchy
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();