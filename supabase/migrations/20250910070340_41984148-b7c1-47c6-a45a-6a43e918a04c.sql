-- Add missing fields to tenders table for enhanced tender management
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS current_phase TEXT;
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS current_stage TEXT;
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS deadline_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS procurement_type TEXT;
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS estimated_value NUMERIC;
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS evaluation_deadline TIMESTAMP WITH TIME ZONE;

-- Create tender workflow tracking table
CREATE TABLE IF NOT EXISTS public.tender_workflow_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  stage TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  responsible_person UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on tender_workflow_status
ALTER TABLE public.tender_workflow_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for tender workflow status
CREATE POLICY "Users can view tender workflow status"
  ON public.tender_workflow_status
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tender workflow status"
  ON public.tender_workflow_status
  FOR ALL
  USING (is_current_user_admin());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tender_workflow_status_tender_id ON public.tender_workflow_status(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_workflow_status_phase_stage ON public.tender_workflow_status(phase, stage);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tender_workflow_status_updated_at
  BEFORE UPDATE ON public.tender_workflow_status
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();