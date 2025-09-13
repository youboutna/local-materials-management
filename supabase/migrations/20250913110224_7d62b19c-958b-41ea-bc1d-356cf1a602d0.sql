-- Create workflow status table for tracking tender/project workflow progress
CREATE TABLE public.workflow_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'tender')),
  phase_code TEXT NOT NULL,
  stage_code TEXT NOT NULL,
  task_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  assigned_to UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(entity_id, entity_type, phase_code, stage_code, task_id)
);

-- Enable RLS
ALTER TABLE public.workflow_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view workflow status"
  ON public.workflow_status FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage workflow status"
  ON public.workflow_status FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_workflow_status_entity ON public.workflow_status(entity_id, entity_type);
CREATE INDEX idx_workflow_status_phase ON public.workflow_status(phase_code, stage_code);
CREATE INDEX idx_workflow_status_due_date ON public.workflow_status(due_date) WHERE due_date IS NOT NULL;

-- Add trigger for updated_at
CREATE TRIGGER update_workflow_status_updated_at
  BEFORE UPDATE ON public.workflow_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();