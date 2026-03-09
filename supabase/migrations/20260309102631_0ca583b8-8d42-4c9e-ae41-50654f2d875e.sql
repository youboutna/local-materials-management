-- Grant SELECT on public views that proxy btp schema tables
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT SELECT ON public.employees TO anon, authenticated;
GRANT SELECT ON public.materials TO anon, authenticated;
GRANT SELECT ON public.documents TO anon, authenticated;
GRANT SELECT ON public.payments TO anon, authenticated;
GRANT SELECT ON public.inspections TO anon, authenticated;
GRANT SELECT ON public.suppliers TO anon, authenticated;

-- Also grant INSERT/UPDATE/DELETE for authenticated users
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.inspections TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;

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