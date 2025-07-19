-- Additional Essential Tables and Enhancements

-- Quantity Takeoffs Table
CREATE TABLE IF NOT EXISTS public.quantity_takeoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id),
    element_type TEXT NOT NULL,
    unit TEXT NOT NULL,
    length NUMERIC,
    width NUMERIC,
    height NUMERIC,
    quantity NUMERIC GENERATED ALWAYS AS (
        CASE 
            WHEN width IS NOT NULL AND height IS NOT NULL THEN length * width * height
            WHEN width IS NOT NULL THEN length * width
            ELSE length
        END
    ) STORED,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces Table
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_name TEXT NOT NULL,
    assigned_by UUID,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role_name)
);

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    full_name TEXT,
    phone TEXT,
    national_id TEXT,
    role TEXT DEFAULT 'user',
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Project Comments Table
CREATE TABLE IF NOT EXISTS public.project_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    comment TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.project_comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Material Suppliers Junction Table
CREATE TABLE IF NOT EXISTS public.material_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    unit_price NUMERIC,
    lead_time_days INTEGER DEFAULT 0,
    minimum_order_quantity NUMERIC DEFAULT 1,
    is_preferred BOOLEAN DEFAULT FALSE,
    last_price_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(material_id, supplier_id)
);

-- Project Milestones Table
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    completion_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')),
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Risks Table
CREATE TABLE IF NOT EXISTS public.project_risks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    risk_title TEXT NOT NULL,
    risk_description TEXT,
    probability TEXT CHECK (probability IN ('low', 'medium', 'high')),
    impact TEXT CHECK (impact IN ('low', 'medium', 'high')),
    risk_level TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN probability = 'high' AND impact = 'high' THEN 'critical'
            WHEN (probability = 'high' AND impact = 'medium') OR (probability = 'medium' AND impact = 'high') THEN 'high'
            WHEN (probability = 'medium' AND impact = 'medium') OR (probability = 'high' AND impact = 'low') OR (probability = 'low' AND impact = 'high') THEN 'medium'
            ELSE 'low'
        END
    ) STORED,
    mitigation_strategy TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'mitigated', 'closed')),
    identified_by UUID,
    identified_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);