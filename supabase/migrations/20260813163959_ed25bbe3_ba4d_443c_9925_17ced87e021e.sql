ALTER TABLE btp.employees
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES btp.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS employee_type text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS probation_end_date date,
  ADD COLUMN IF NOT EXISTS hourly_rate numeric,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'MRU',
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS performance_rating numeric,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS tags text[],
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS national_id text;

CREATE INDEX IF NOT EXISTS idx_employees_organization_id ON btp.employees(organization_id);

ALTER TABLE btp.organizational_hierarchy
  ALTER COLUMN position_title DROP NOT NULL,
  ALTER COLUMN department DROP NOT NULL,
  ALTER COLUMN level SET DEFAULT 3;

ALTER TABLE btp.organizational_hierarchy ALTER COLUMN level DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_org_hierarchy_employee ON btp.organizational_hierarchy(organization_id, employee_id) WHERE employee_id IS NOT NULL;