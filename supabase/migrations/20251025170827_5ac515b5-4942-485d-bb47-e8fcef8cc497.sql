-- Enhanced tender submissions with secret code protection
-- Extension of existing tender_submissions table

-- Add secret code and security fields to tender_submissions
ALTER TABLE public.tender_submissions
ADD COLUMN IF NOT EXISTS secret_code TEXT,
ADD COLUMN IF NOT EXISTS secret_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS secret_created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS secret_access_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_secret_access INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS is_secret_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS evaluation_phase TEXT,
ADD COLUMN IF NOT EXISTS evaluation_stage TEXT;

-- Create index for secret code lookups
CREATE INDEX IF NOT EXISTS idx_tender_submissions_secret_code ON public.tender_submissions(secret_code) WHERE secret_code IS NOT NULL;

-- Create submission access logs table
CREATE TABLE IF NOT EXISTS public.submission_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.tender_submissions(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accessed_by UUID REFERENCES auth.users(id),
  ip_address TEXT,
  user_agent TEXT,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'evaluate', 'comment', 'approve', 'reject')),
  accessed_sections TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on submission_access_logs
CREATE INDEX IF NOT EXISTS idx_submission_access_logs_submission ON public.submission_access_logs(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_access_logs_accessed_at ON public.submission_access_logs(accessed_at DESC);

-- Enable RLS on submission_access_logs
ALTER TABLE public.submission_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for submission_access_logs
CREATE POLICY "Users can view access logs for their submissions"
ON public.submission_access_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tender_submissions ts
    WHERE ts.id = submission_access_logs.submission_id
    AND ts.user_id = auth.uid()
  )
);

CREATE POLICY "Admins and evaluators can view all access logs"
ON public.submission_access_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role_name IN ('admin', 'manager', 'director', 'evaluator')
  )
);

CREATE POLICY "System can insert access logs"
ON public.submission_access_logs FOR INSERT
WITH CHECK (true);

-- Function to generate submission secret code
CREATE OR REPLACE FUNCTION generate_submission_secret_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a 12-character alphanumeric code
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 4) || '-' ||
                      substring(md5(random()::text || clock_timestamp()::text) from 1 for 4) || '-' ||
                      substring(md5(random()::text || clock_timestamp()::text) from 1 for 4));
    
    -- Check if code already exists
    SELECT EXISTS (
      SELECT 1 FROM public.tender_submissions
      WHERE secret_code = new_code
    ) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to validate submission secret code
CREATE OR REPLACE FUNCTION validate_submission_secret(secret_code_param TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  submission_id UUID,
  tender_id UUID,
  supplier_name TEXT,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  submission_record RECORD;
BEGIN
  -- Find submission with this secret code
  SELECT
    ts.id,
    ts.tender_id,
    ts.supplier_name,
    ts.secret_expires_at,
    ts.is_secret_active,
    ts.secret_access_count,
    ts.max_secret_access
  INTO submission_record
  FROM public.tender_submissions ts
  WHERE ts.secret_code = secret_code_param;
  
  -- Check if submission exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::UUID, NULL::TEXT, 'Code secret invalide'::TEXT;
    RETURN;
  END IF;
  
  -- Check if secret is active
  IF NOT submission_record.is_secret_active THEN
    RETURN QUERY SELECT false, submission_record.id, submission_record.tender_id, 
                        submission_record.supplier_name, 'Code secret désactivé'::TEXT;
    RETURN;
  END IF;
  
  -- Check if secret has expired
  IF submission_record.secret_expires_at IS NOT NULL 
     AND submission_record.secret_expires_at < now() THEN
    RETURN QUERY SELECT false, submission_record.id, submission_record.tender_id,
                        submission_record.supplier_name, 'Code secret expiré'::TEXT;
    RETURN;
  END IF;
  
  -- Check if access limit exceeded
  IF submission_record.max_secret_access IS NOT NULL 
     AND submission_record.secret_access_count >= submission_record.max_secret_access THEN
    RETURN QUERY SELECT false, submission_record.id, submission_record.tender_id,
                        submission_record.supplier_name, 'Limite d''accès atteinte'::TEXT;
    RETURN;
  END IF;
  
  -- Update access count
  UPDATE public.tender_submissions
  SET secret_access_count = secret_access_count + 1
  WHERE id = submission_record.id;
  
  -- Return success
  RETURN QUERY SELECT true, submission_record.id, submission_record.tender_id,
                      submission_record.supplier_name, 'Accès autorisé'::TEXT;
END;
$$;

COMMENT ON TABLE public.submission_access_logs IS 'Logs des accès aux dossiers de soumission pour audit et traçabilité';
COMMENT ON FUNCTION generate_submission_secret_code() IS 'Génère un code secret unique pour protéger l''accès au dossier de soumission';
COMMENT ON FUNCTION validate_submission_secret(TEXT) IS 'Valide un code secret et retourne les informations d''accès à la soumission';