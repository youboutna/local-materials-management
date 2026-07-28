-- Enable RLS on locations
ALTER TABLE btp.locations ENABLE ROW LEVEL SECURITY;

-- Anyone can read locations
CREATE POLICY "Anyone can read locations"
ON btp.locations
FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated users can manage locations
CREATE POLICY "Authenticated users can manage locations"
ON btp.locations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);