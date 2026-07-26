-- Create RPC functions for supplier payment requests to bypass TypeScript issues

-- Function to get supplier payment requests
CREATE OR REPLACE FUNCTION btp.get_supplier_payment_requests(supplier_id_param UUID)
RETURNS TABLE (
  id UUID,
  supplier_id UUID,
  project_id UUID,
  amount NUMERIC,
  description TEXT,
  payment_reason TEXT,
  supporting_documents TEXT[],
  status TEXT,
  requested_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    spr.id,
    spr.supplier_id,
    spr.project_id,
    spr.amount,
    spr.description,
    spr.payment_reason,
    spr.supporting_documents,
    spr.status,
    spr.requested_date,
    spr.notes,
    spr.approved_by,
    spr.approved_at,
    spr.rejection_reason,
    spr.created_at,
    spr.updated_at
  FROM btp.supplier_payment_requests spr
  WHERE spr.supplier_id = supplier_id_param
  ORDER BY spr.requested_date DESC;
$$;

-- Function to create supplier payment request
CREATE OR REPLACE FUNCTION btp.create_supplier_payment_request(
  supplier_id_param UUID,
  project_id_param UUID DEFAULT NULL,
  amount_param NUMERIC,
  description_param TEXT,
  payment_reason_param TEXT,
  supporting_documents_param TEXT[] DEFAULT '{}',
  notes_param TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  supplier_id UUID,
  project_id UUID,
  amount NUMERIC,
  description TEXT,
  payment_reason TEXT,
  supporting_documents TEXT[],
  status TEXT,
  requested_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  INSERT INTO btp.supplier_payment_requests (
    supplier_id,
    project_id,
    amount,
    description,
    payment_reason,
    supporting_documents,
    status,
    requested_date,
    notes
  ) VALUES (
    supplier_id_param,
    project_id_param,
    amount_param,
    description_param,
    payment_reason_param,
    supporting_documents_param,
    'pending',
    now(),
    notes_param
  )
  RETURNING 
    id,
    supplier_id,
    project_id,
    amount,
    description,
    payment_reason,
    supporting_documents,
    status,
    requested_date,
    notes,
    created_at,
    updated_at;
$$;