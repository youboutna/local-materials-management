
-- Normalize existing material localisation to v3 shape (address + coords + multi-polygon zones)
UPDATE btp.materials
SET localisation = public.normalize_intervention_zones(localisation)
WHERE localisation IS NOT NULL
  AND (
    jsonb_typeof(localisation) <> 'object'
    OR NOT (localisation ? 'version')
    OR (localisation->>'version') <> '3'
  );

-- GIN index for JSONB search on warehouse localisation/zones
CREATE INDEX IF NOT EXISTS idx_btp_materials_localisation_gin
  ON btp.materials USING GIN (localisation jsonb_path_ops);

-- Optional trigger to auto-normalize on insert/update
CREATE OR REPLACE FUNCTION btp.materials_normalize_localisation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.localisation IS NOT NULL THEN
    NEW.localisation := public.normalize_intervention_zones(NEW.localisation);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_materials_normalize_localisation ON btp.materials;
CREATE TRIGGER trg_materials_normalize_localisation
BEFORE INSERT OR UPDATE OF localisation ON btp.materials
FOR EACH ROW EXECUTE FUNCTION btp.materials_normalize_localisation();
