-- Create document_validation_logs table
CREATE TABLE IF NOT EXISTS public.document_validation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.tender_submissions(id) ON DELETE CASCADE,
  is_valid BOOLEAN NOT NULL DEFAULT false,
  errors JSONB,
  warnings JSONB,
  validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create submission_activity_logs table
CREATE TABLE IF NOT EXISTS public.submission_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.tender_submissions(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.document_validation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_validation_logs
CREATE POLICY "Users can view validation logs for their submissions"
  ON public.document_validation_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tender_submissions ts
      WHERE ts.id = document_validation_logs.submission_id
      AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage validation logs"
  ON public.document_validation_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for submission_activity_logs
CREATE POLICY "Users can view activity logs for their submissions"
  ON public.submission_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tender_submissions ts
      WHERE ts.id = submission_activity_logs.submission_id
      AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create activity logs"
  ON public.submission_activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_validation_logs_document_id 
  ON public.document_validation_logs(document_id);

CREATE INDEX IF NOT EXISTS idx_document_validation_logs_submission_id 
  ON public.document_validation_logs(submission_id);

CREATE INDEX IF NOT EXISTS idx_submission_activity_logs_submission_id 
  ON public.submission_activity_logs(submission_id);

CREATE INDEX IF NOT EXISTS idx_submission_activity_logs_created_at 
  ON public.submission_activity_logs(created_at DESC);

-- Function to automatically log submission status changes
CREATE OR REPLACE FUNCTION public.log_submission_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.submission_activity_logs (
      submission_id,
      action,
      details,
      performed_by
    ) VALUES (
      NEW.id,
      'status_changed',
      format('Statut changé de %s à %s', OLD.status, NEW.status),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic logging
DROP TRIGGER IF EXISTS trigger_log_submission_status_change ON public.tender_submissions;
CREATE TRIGGER trigger_log_submission_status_change
  AFTER UPDATE ON public.tender_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_submission_status_change();

-- Enable realtime for submission updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.tender_submissions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submission_activity_logs;