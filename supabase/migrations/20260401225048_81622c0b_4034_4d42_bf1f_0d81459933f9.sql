
-- Grant USAGE on btp schema to anon and authenticated roles
GRANT USAGE ON SCHEMA btp TO anon, authenticated;

-- Grant SELECT on all btp tables to anon and authenticated
GRANT SELECT ON ALL TABLES IN SCHEMA btp TO anon, authenticated;

-- Grant INSERT, UPDATE, DELETE on btp tables for authenticated users
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA btp TO authenticated;

-- Grant SELECT on all public views that proxy btp tables
GRANT SELECT ON btp.bank_guarantees TO anon, authenticated;
GRANT SELECT ON btp.document_validation_logs TO anon, authenticated;
GRANT SELECT ON btp.documents TO anon, authenticated;
GRANT SELECT ON btp.employees TO anon, authenticated;
GRANT SELECT ON btp.enhanced_project_milestones TO anon, authenticated;
GRANT SELECT ON btp.inspections TO anon, authenticated;
GRANT SELECT ON btp.insurance_certificates TO anon, authenticated;
GRANT SELECT ON btp.material_documents TO anon, authenticated;
GRANT SELECT ON btp.material_suppliers TO anon, authenticated;
GRANT SELECT ON btp.materials TO anon, authenticated;
GRANT SELECT ON btp.organizational_hierarchy TO anon, authenticated;
GRANT SELECT ON btp.organizations TO anon, authenticated;
GRANT SELECT ON btp.parsed_invoices TO anon, authenticated;
GRANT SELECT ON btp.payments TO anon, authenticated;
GRANT SELECT ON btp.progress_invoices TO anon, authenticated;
GRANT SELECT ON btp.project_materials TO anon, authenticated;
GRANT SELECT ON btp.project_organizations TO anon, authenticated;
GRANT SELECT ON btp.project_phases TO anon, authenticated;
GRANT SELECT ON btp.project_stakeholders TO anon, authenticated;
GRANT SELECT ON btp.projects TO anon, authenticated;
GRANT SELECT ON btp.quantity_takeoffs TO anon, authenticated;
GRANT SELECT ON btp.stock_movements TO anon, authenticated;
GRANT SELECT ON btp.submission_activity_logs TO anon, authenticated;
GRANT SELECT ON btp.supplier_notifications TO anon, authenticated;
GRANT SELECT ON btp.supplier_payment_requests TO anon, authenticated;
GRANT SELECT ON btp.suppliers TO anon, authenticated;
GRANT SELECT ON btp.task_assignments TO anon, authenticated;
GRANT SELECT ON btp.tender_documents TO anon, authenticated;
GRANT SELECT ON btp.tender_sharing_secrets TO anon, authenticated;
GRANT SELECT ON btp.tender_step_documents TO anon, authenticated;
GRANT SELECT ON btp.tender_steps TO anon, authenticated;
GRANT SELECT ON btp.tender_submissions TO anon, authenticated;
GRANT SELECT ON btp.tenders TO anon, authenticated;
GRANT SELECT ON btp.workspaces TO anon, authenticated;

-- Also grant DML on public views for authenticated (needed for INSERT/UPDATE/DELETE through views)
GRANT INSERT, UPDATE, DELETE ON btp.documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.employees TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.inspections TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.materials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.payments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.projects TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.project_phases TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.suppliers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.task_assignments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.tenders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.tender_submissions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.tender_documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.bank_guarantees TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.insurance_certificates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.workspaces TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.quantity_takeoffs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.progress_invoices TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.project_materials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.material_suppliers TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.material_documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.supplier_payment_requests TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.supplier_notifications TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.project_stakeholders TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.tender_steps TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.tender_step_documents TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.tender_sharing_secrets TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.submission_activity_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.document_validation_logs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.parsed_invoices TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.stock_movements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.enhanced_project_milestones TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.organizational_hierarchy TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.organizations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.project_organizations TO authenticated;

-- Grant default privileges for future tables in btp schema
ALTER DEFAULT PRIVILEGES IN SCHEMA btp GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA btp GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;
