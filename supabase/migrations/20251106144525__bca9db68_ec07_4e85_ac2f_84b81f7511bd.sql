-- Create RPC functions to query new tables (workaround for type generation)

-- Function to get submission activity logs
CREATE OR REPLACE FUNCTION btp.get_submission_activity_logs(p_submission_id UUID)
RETURNS TABLE (
  id UUID,
  submission_id UUID,
  action TEXT,
  details TEXT,
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sal.id,
    sal.submission_id,
    sal.action,
    sal.details,
    sal.performed_by,
    sal.created_at
  FROM btp.submission_activity_logs sal
  WHERE sal.submission_id = p_submission_id
  ORDER BY sal.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get validation logs
CREATE OR REPLACE FUNCTION btp.get_validation_logs(p_submission_id UUID)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  submission_id UUID,
  is_valid BOOLEAN,
  errors JSONB,
  warnings JSONB,
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dvl.id,
    dvl.document_id,
    dvl.submission_id,
    dvl.is_valid,
    dvl.errors,
    dvl.warnings,
    dvl.validated_at,
    dvl.created_at
  FROM btp.document_validation_logs dvl
  WHERE dvl.submission_id = p_submission_id
  ORDER BY dvl.validated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;