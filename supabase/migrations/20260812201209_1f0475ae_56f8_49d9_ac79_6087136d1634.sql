ALTER TABLE btp.organizations
  ADD COLUMN IF NOT EXISTS org_type text,
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES btp.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS organizations_external_ref_uidx
  ON btp.organizations(external_ref) WHERE external_ref IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS organizations_single_default_uidx
  ON btp.organizations(is_default) WHERE is_default;

CREATE INDEX IF NOT EXISTS organizations_parent_idx ON btp.organizations(parent_id);

ALTER TABLE btp.projects
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES btp.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_organization_idx ON btp.projects(organization_id);

UPDATE btp.projects p
SET organization_id = o.id
FROM btp.organizations o
WHERE o.is_default AND p.organization_id IS NULL;