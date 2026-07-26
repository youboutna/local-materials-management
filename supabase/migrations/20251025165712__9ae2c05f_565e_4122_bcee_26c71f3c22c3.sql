-- Create secure sharing secrets table for tender document sharing
CREATE TABLE IF NOT EXISTS btp.tender_sharing_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES btp.tenders(id) ON DELETE CASCADE,
  secret_code TEXT NOT NULL UNIQUE,
  shared_by UUID REFERENCES auth.users(id),
  supplier_email TEXT,
  supplier_id UUID REFERENCES btp.suppliers(id),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  access_count INTEGER DEFAULT 0,
  max_access_count INTEGER DEFAULT 10,
  workflow_phase TEXT,
  workflow_stage TEXT,
  allowed_document_ids TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create access logs for audit trail
CREATE TABLE IF NOT EXISTS btp.tender_sharing_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sharing_secret_id UUID NOT NULL REFERENCES btp.tender_sharing_secrets(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  accessed_documents TEXT[],
  action_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies for secure access
ALTER TABLE btp.tender_sharing_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_sharing_access_logs ENABLE ROW LEVEL SECURITY;

-- Project managers can create and view secrets for their tenders
CREATE POLICY "Project managers can manage tender sharing secrets"
ON btp.tender_sharing_secrets
FOR ALL
USING (
  shared_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_name IN ('admin', 'director', 'project_manager')
  )
);

-- Suppliers can view secrets shared with them (by email match)
CREATE POLICY "Suppliers can view their sharing secrets"
ON btp.tender_sharing_secrets
FOR SELECT
USING (
  supplier_email = auth.jwt()->>'email'
  OR supplier_id IN (
    SELECT id FROM btp.suppliers WHERE email = auth.jwt()->>'email'
  )
);

-- Authenticated users can log access
CREATE POLICY "Authenticated users can create access logs"
ON btp.tender_sharing_access_logs
FOR INSERT
WITH CHECK (true);

-- Users can view their own access logs
CREATE POLICY "Users can view access logs"
ON btp.tender_sharing_access_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM btp.tender_sharing_secrets tss
    WHERE tss.id = sharing_secret_id
    AND (
      tss.shared_by = auth.uid()
      OR tss.supplier_email = auth.jwt()->>'email'
      OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role_name IN ('admin', 'director')
      )
    )
  )
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tender_sharing_secrets_tender_id ON btp.tender_sharing_secrets(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_sharing_secrets_secret_code ON btp.tender_sharing_secrets(secret_code);
CREATE INDEX IF NOT EXISTS idx_tender_sharing_secrets_expires_at ON btp.tender_sharing_secrets(expires_at);
CREATE INDEX IF NOT EXISTS idx_tender_sharing_access_logs_secret_id ON btp.tender_sharing_access_logs(sharing_secret_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_tender_sharing_secrets_updated_at ON btp.tender_sharing_secrets;
CREATE TRIGGER update_tender_sharing_secrets_updated_at
BEFORE UPDATE ON btp.tender_sharing_secrets
FOR EACH ROW
EXECUTE FUNCTION btp.update_updated_at_column();

-- Function to generate unique secret code
CREATE OR REPLACE FUNCTION btp.generate_tender_secret_code()
RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and track secret access
CREATE OR REPLACE FUNCTION btp.validate_tender_secret(secret_code_param TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  tender_id UUID,
  allowed_documents TEXT[],
  message TEXT
) AS $$
DECLARE
  secret_record RECORD;
BEGIN
  SELECT * INTO secret_record
  FROM btp.tender_sharing_secrets
  WHERE secret_code = secret_code_param
  AND is_active = true
  AND expires_at > NOW();
  
  IF secret_record IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT[], 'Code invalide ou expiré';
    RETURN;
  END IF;
  
  IF secret_record.max_access_count IS NOT NULL 
     AND secret_record.access_count >= secret_record.max_access_count THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT[], 'Limite d''accès atteinte';
    RETURN;
  END IF;
  
  -- Increment access count
  UPDATE btp.tender_sharing_secrets
  SET access_count = access_count + 1
  WHERE id = secret_record.id;
  
  RETURN QUERY SELECT 
    true, 
    secret_record.tender_id, 
    secret_record.allowed_document_ids,
    'Accès autorisé'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;