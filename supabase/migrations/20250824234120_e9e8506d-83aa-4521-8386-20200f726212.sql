-- Enable RLS on inspections table
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all inspections
CREATE POLICY "Allow authenticated users to view inspections" 
ON public.inspections 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow authenticated users to insert inspections 
CREATE POLICY "Allow authenticated users to insert inspections" 
ON public.inspections 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to update inspections
CREATE POLICY "Allow authenticated users to update inspections" 
ON public.inspections 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Allow authenticated users to delete inspections (optional, for admins)
CREATE POLICY "Allow authenticated users to delete inspections" 
ON public.inspections 
FOR DELETE 
TO authenticated 
USING (true);