ALTER TABLE btp.project_stakeholders
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS external_name text,
  ADD COLUMN IF NOT EXISTS external_email text,
  ADD COLUMN IF NOT EXISTS external_phone text,
  ADD COLUMN IF NOT EXISTS responsibilities text[],
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS hourly_rate numeric,
  ADD COLUMN IF NOT EXISTS contract_type text,
  ADD COLUMN IF NOT EXISTS notes text;

DROP VIEW IF EXISTS public.project_stakeholders;
CREATE VIEW public.project_stakeholders AS
  SELECT id, project_id, stakeholder_type, stakeholder_entity_type,
         employee_id, supplier_id, role_description, is_primary,
         is_active, external_name, external_email, external_phone,
         responsibilities, start_date, end_date, hourly_rate,
         contract_type, notes, created_at, updated_at
  FROM btp.project_stakeholders;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_stakeholders TO authenticated;
GRANT ALL ON public.project_stakeholders TO service_role;

NOTIFY pgrst, 'reload schema';