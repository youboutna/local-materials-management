
-- Update RLS policies for tenders table to allow authenticated users to insert
DROP POLICY IF EXISTS "Authenticated users can create tenders" ON public.tenders;
DROP POLICY IF EXISTS "Authenticated users can view tenders" ON public.tenders;
DROP POLICY IF EXISTS "Authenticated users can update tenders" ON public.tenders;
DROP POLICY IF EXISTS "Authenticated users can delete tenders" ON public.tenders;

-- Create new policies that work with the current authentication context
CREATE POLICY "Enable read access for authenticated users" 
  ON public.tenders 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
  ON public.tenders 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" 
  ON public.tenders 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for authenticated users" 
  ON public.tenders 
  FOR DELETE 
  TO authenticated
  USING (true);
