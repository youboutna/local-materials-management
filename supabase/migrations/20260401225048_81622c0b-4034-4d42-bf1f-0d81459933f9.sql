
-- Grant USAGE on btp schema to anon and authenticated roles
GRANT USAGE ON SCHEMA btp TO anon, authenticated;

-- Grant SELECT on all btp tables to anon and authenticated
GRANT SELECT ON ALL TABLES IN SCHEMA btp TO anon, authenticated;

-- Grant INSERT, UPDATE, DELETE on btp tables for authenticated users
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA btp TO authenticated;

-- Grant SELECT on all public views that proxy btp tables
GRANT SELECT ON public.bank_guarantees TO anon, authenticated;
GRANT SELECT ON public.document_validation_logs TO anon, authenticated;
GRANT SELECT ON public.documents TO anon, authenticated;
GRANT SELECT ON public.employees TO anon, authenticated;
GRANT SELECT ON public.enhanced_project_milestones TO anon, authenticated;
GRANT SELECT ON public.inspections TO anon, authenticated;
GRANT SELECT ON public.insurance_certificates TO anon, authenticated;
GRANT SELECT ON public.material_documents TO anon, authenticated;
GRANT SELECT ON public.material_suppliers TO anon, authenticated;
GRANT SELECT ON public.materials TO anon, authenticated;
GRANT SELECT ON public.organizational_hierarchy TO anon, authenticated;
GRANT SELECT ON public.organizations TO anon, authenticated;
GRANT SELECT ON public.parsed_invoices TO anon, authenticated;
GRANT SELECT ON public.payments TO anon, authenticated;
GRANT SELECT ON public.progress_invoices TO anon, authenticated;
GRANT SELECT ON public.project_materials TO anon, authenticated;
GRANT SELECT ON public.project_organizations TO anon, authenticated;
GRANT SELECT ON public.project_phases TO anon, authenticated;
GRANT SELECT ON public.project_stakeholders TO anon, authenticated;
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT SELECT ON public.quantity_takeoffs TO anon, authenticated;
GRANT SELECT ON public.stock_movements TO anon, authenticated;
GRANT SELECT ON public.submission_activity_logs TO anon, authenticated;
GRANT SELECT ON public.supplier_notifications TO anon, authenticated;
GRANT SELECT ON public.supplier_payment_requests TO anon, authenticated;
GRANT SELECT ON public.suppliers TO anon, authenticated;
GRANT SELECT ON public.task_assignments TO anon, authenticated;
GRANT SELECT ON public.tender_documents TO anon, authenticated;
GRANT SELECT ON public.tender_sharing_secrets TO anon, authenticated;
GRANT SELECT ON public.tender_step_documents TO anon, authenticated;
GRANT SELECT ON public.tender_steps TO anon, authenticated;
GRANT SELECT ON public.tender_submissions TO anon, authenticated;
GRANT SELECT ON public.tenders TO anon, authenticated;
GRANT SELECT ON public.workspaces TO anon, authenticated;

-- Also grant DML on public views for authenticated (needed for INSERT/UPDATE/DELETE through views)
GRANT INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.inspections TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.materials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.project_phases TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.task_assignments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tenders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tender_submissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tender_documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bank_guarantees TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.insurance_certificates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.quantity_takeoffs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.progress_invoices TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.project_materials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.material_suppliers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.material_documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.supplier_payment_requests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.supplier_notifications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.project_stakeholders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tender_steps TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tender_step_documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tender_sharing_secrets TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.submission_activity_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.document_validation_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.parsed_invoices TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.enhanced_project_milestones TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organizational_hierarchy TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.project_organizations TO authenticated;

-- Grant default privileges for future tables in btp schema
ALTER DEFAULT PRIVILEGES IN SCHEMA btp GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA btp GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;
