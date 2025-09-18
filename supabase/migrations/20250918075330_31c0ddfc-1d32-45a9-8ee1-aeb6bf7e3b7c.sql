-- Fix the migration syntax error
CREATE TABLE IF NOT EXISTS public.workflow_status (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id UUID NOT NULL,
    entity_type TEXT NOT NULL,
    phase_code TEXT NOT NULL,
    stage_code TEXT NOT NULL,
    task_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT valid_entity_type CHECK (entity_type IN ('project', 'tender')),
    CONSTRAINT valid_workflow_status CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked'))
);

-- Create unique constraint separately to avoid syntax issues
CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_status_unique 
ON public.workflow_status (entity_id, entity_type, phase_code, stage_code, COALESCE(task_id, ''));

-- Enable RLS
ALTER TABLE public.workflow_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view workflow status" ON public.workflow_status
    FOR SELECT USING (true);

CREATE POLICY "Users can manage workflow status" ON public.workflow_status
    FOR ALL USING (true);