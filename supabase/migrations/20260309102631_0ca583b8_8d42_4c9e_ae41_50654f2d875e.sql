-- Grant SELECT on public views that proxy btp schema tables
GRANT SELECT ON btp.projects TO anon, authenticated;
GRANT SELECT ON btp.employees TO anon, authenticated;
GRANT SELECT ON btp.materials TO anon, authenticated;
GRANT SELECT ON btp.documents TO anon, authenticated;
GRANT SELECT ON btp.payments TO anon, authenticated;
GRANT SELECT ON btp.inspections TO anon, authenticated;
GRANT SELECT ON btp.suppliers TO anon, authenticated;

-- Also grant INSERT/UPDATE/DELETE for authenticated users
GRANT INSERT, UPDATE, DELETE ON btp.projects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.employees TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.materials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.payments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.inspections TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.suppliers TO authenticated;

-- Grant usage on btp schema
GRANT USAGE ON SCHEMA btp TO anon, authenticated;

-- Grant SELECT on underlying btp tables
GRANT SELECT ON btp.projects TO anon, authenticated;
GRANT SELECT ON btp.employees TO anon, authenticated;
GRANT SELECT ON btp.materials TO anon, authenticated;
GRANT SELECT ON btp.documents TO anon, authenticated;
GRANT SELECT ON btp.payments TO anon, authenticated;
GRANT SELECT ON btp.inspections TO anon, authenticated;
GRANT SELECT ON btp.suppliers TO anon, authenticated;

-- Grant DML on btp tables for authenticated
GRANT INSERT, UPDATE, DELETE ON btp.projects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.employees TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.materials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.payments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.inspections TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.suppliers TO authenticated;