-- Normalize business-reference uniqueness for import UPSERTs.
-- The previous partial unique indexes cannot be used by PostgREST's
-- on_conflict=external_ref inference.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM btp.organizations
    WHERE external_ref IS NOT NULL
    GROUP BY external_ref HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate organization external_ref values must be resolved before applying import constraints';
  END IF;

  IF EXISTS (
    SELECT 1 FROM btp.suppliers
    WHERE external_ref IS NOT NULL
    GROUP BY external_ref HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate supplier external_ref values must be resolved before applying import constraints';
  END IF;

  IF EXISTS (
    SELECT 1 FROM btp.projects
    WHERE external_ref IS NOT NULL
    GROUP BY external_ref HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate project external_ref values must be resolved before applying import constraints';
  END IF;
END $$;

DROP INDEX IF EXISTS btp.organizations_external_ref_key;
DROP INDEX IF EXISTS btp.suppliers_external_ref_key;
DROP INDEX IF EXISTS btp.projects_external_ref_key;

ALTER TABLE btp.organizations
  ADD CONSTRAINT organizations_external_ref_unique UNIQUE (external_ref);

ALTER TABLE btp.suppliers
  ADD CONSTRAINT suppliers_external_ref_unique UNIQUE (external_ref);

ALTER TABLE btp.projects
  ADD CONSTRAINT projects_external_ref_unique UNIQUE (external_ref);

NOTIFY pgrst, 'reload schema';
