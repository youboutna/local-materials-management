-- Fix project_stakeholders table structure and relationships
-- First, drop the existing table to recreate it properly
DROP TABLE IF EXISTS public.project_stakeholders CASCADE;

-- Create project_stakeholders table with proper structure
CREATE TABLE public.project_stakeholders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    stakeholder_type TEXT NOT NULL, -- 'project_manager', 'technical_manager', 'supervisor', 'client', etc.
    stakeholder_entity_type TEXT NOT NULL CHECK (stakeholder_entity_type IN ('employee', 'supplier')),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    role_description TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Ensure only one of employee_id or supplier_id is set based on entity_type
    CONSTRAINT stakeholder_entity_check CHECK (
        (stakeholder_entity_type = 'employee' AND employee_id IS NOT NULL AND supplier_id IS NULL) OR
        (stakeholder_entity_type = 'supplier' AND supplier_id IS NOT NULL AND employee_id IS NULL)
    )
);

-- Enable RLS
ALTER TABLE public.project_stakeholders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view project stakeholders"
ON public.project_stakeholders FOR SELECT
USING (true);

CREATE POLICY "Users can insert project stakeholders"
ON public.project_stakeholders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update project stakeholders"
ON public.project_stakeholders FOR UPDATE
USING (true);

CREATE POLICY "Users can delete project stakeholders"
ON public.project_stakeholders FOR DELETE
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_project_stakeholders_updated_at
    BEFORE UPDATE ON public.project_stakeholders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();