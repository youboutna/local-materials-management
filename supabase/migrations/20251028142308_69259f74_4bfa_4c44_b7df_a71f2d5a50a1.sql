-- ========================================
-- RLS Policies for Tender Estimates (DQE Confidentiality)
-- ========================================
-- Only the creator and admins can access tender estimates
-- This ensures confidentiality of the "Devis Quantitatif et Estimatif"

-- ========================================
-- Enable RLS on tender_estimates table
-- ========================================
ALTER TABLE btp.tender_estimates ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Enable RLS on tender_estimate_items table
-- ========================================
ALTER TABLE btp.tender_estimate_items ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Helper function to check if user is admin or director
-- ========================================
CREATE OR REPLACE FUNCTION btp.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role_name IN ('admin', 'director')
  );
$$;

-- ========================================
-- Policies for tender_estimates
-- ========================================

-- CORRECTION : Suppression avant création pour éviter l'erreur 42710
DROP POLICY IF EXISTS "Users can view own tender estimates" ON btp.tender_estimates;
DROP POLICY IF EXISTS "Users can create tender estimates" ON btp.tender_estimates;
DROP POLICY IF EXISTS "Users can update own tender estimates" ON btp.tender_estimates;
DROP POLICY IF EXISTS "Users can delete own tender estimates" ON btp.tender_estimates;

-- Policy: Users can view their own estimates
CREATE POLICY "Users can view own tender estimates"
ON btp.tender_estimates
FOR SELECT
TO authenticated
USING (
  submitted_by = auth.uid() 
  OR btp.is_current_user_admin()
);

-- Policy: Users can create their own estimates
CREATE POLICY "Users can create tender estimates"
ON btp.tender_estimates
FOR INSERT
TO authenticated
WITH CHECK (
  submitted_by = auth.uid()
);

-- Policy: Users can update their own estimates
CREATE POLICY "Users can update own tender estimates"
ON btp.tender_estimates
FOR UPDATE
TO authenticated
USING (
  submitted_by = auth.uid()
  OR btp.is_current_user_admin()
)
WITH CHECK (
  submitted_by = auth.uid()
  OR btp.is_current_user_admin()
);

-- Policy: Users can delete their own estimates, admins can delete any
CREATE POLICY "Users can delete own tender estimates"
ON btp.tender_estimates
FOR DELETE
TO authenticated
USING (
  submitted_by = auth.uid()
  OR btp.is_current_user_admin()
);

-- ========================================
-- Policies for tender_estimate_items
-- ========================================
-- Items inherit permissions from their parent estimate

-- CORRECTION : Suppression des politiques enfants avant création
DROP POLICY IF EXISTS "Users can view own tender estimate items" ON btp.tender_estimate_items;
DROP POLICY IF EXISTS "Users can create tender estimate items" ON btp.tender_estimate_items;
DROP POLICY IF EXISTS "Users can update own tender estimate items" ON btp.tender_estimate_items;
DROP POLICY IF EXISTS "Users can delete own tender estimate items" ON btp.tender_estimate_items;

-- Policy: Users can view items of estimates they own
CREATE POLICY "Users can view own tender estimate items"
ON btp.tender_estimate_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM btp.tender_estimates
    WHERE id = tender_estimate_items.estimate_id
    AND (submitted_by = auth.uid() OR btp.is_current_user_admin())
  )
);

-- Policy: Users can create items for their own estimates
CREATE POLICY "Users can create tender estimate items"
ON btp.tender_estimate_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM btp.tender_estimates
    WHERE id = tender_estimate_items.estimate_id
    AND submitted_by = auth.uid()
  )
);

-- Policy: Users can update items of their own estimates
CREATE POLICY "Users can update own tender estimate items"
ON btp.tender_estimate_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM btp.tender_estimates
    WHERE id = tender_estimate_items.estimate_id
    AND (submitted_by = auth.uid() OR btp.is_current_user_admin())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM btp.tender_estimates
    WHERE id = tender_estimate_items.estimate_id
    AND (submitted_by = auth.uid() OR btp.is_current_user_admin())
  )
);

-- Policy: Users can delete items of their own estimates
CREATE POLICY "Users can delete own tender estimate items"
ON btp.tender_estimate_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM btp.tender_estimates
    WHERE id = tender_estimate_items.estimate_id
    AND (submitted_by = auth.uid() OR btp.is_current_user_admin())
  )
);

-- ========================================
-- Add helpful comments
-- ========================================
COMMENT ON TABLE btp.tender_estimates IS 'Tender estimates (DQE) - Access restricted to creator and admins for confidentiality';
COMMENT ON TABLE btp.tender_estimate_items IS 'Tender estimate line items - Access inherited from parent estimate';
COMMENT ON FUNCTION btp.is_current_user_admin() IS 'Check if current user has admin or director role';