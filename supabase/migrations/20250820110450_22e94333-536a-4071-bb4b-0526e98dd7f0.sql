-- Fix the SQL function with proper parameter defaults
CREATE OR REPLACE FUNCTION public.create_supplier_payment_request(
  supplier_id_param UUID,
  amount_param NUMERIC,
  description_param TEXT,
  payment_reason_param TEXT,
  project_id_param UUID DEFAULT NULL,
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
  INSERT INTO public.supplier_payment_requests (
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