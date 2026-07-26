
-- 1) Normalization function: converts any legacy shape ([], single-zone object,
--    v2 { zones: [...] }) to canonical v3 { version: 3, zones: [...], geocodingMeta? }
CREATE OR REPLACE FUNCTION btp.normalize_intervention_zones(input jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_zones jsonb;
  v_meta  jsonb;
  v_out   jsonb;
  z       jsonb;
  acc     jsonb := '[]'::jsonb;
BEGIN
  IF input IS NULL THEN
    RETURN jsonb_build_object('version', 3, 'zones', '[]'::jsonb);
  END IF;

  -- Case A: already an object
  IF jsonb_typeof(input) = 'object' THEN
    IF input ? 'zones' AND jsonb_typeof(input->'zones') = 'array' THEN
      v_zones := input->'zones';
      v_meta  := input->'geocodingMeta';
    -- Legacy mono-zone object: has "type" + "coordinates"
    ELSIF input ? 'type' AND input ? 'coordinates' THEN
      v_zones := jsonb_build_array(input);
    ELSE
      v_zones := '[]'::jsonb;
    END IF;
  -- Case B: bare array (old format from very early records)
  ELSIF jsonb_typeof(input) = 'array' THEN
    v_zones := input;
  ELSE
    v_zones := '[]'::jsonb;
  END IF;

  -- Ensure every zone carries a geocodingMeta key (empty object if missing)
  FOR z IN SELECT * FROM jsonb_array_elements(v_zones) LOOP
    IF jsonb_typeof(z) = 'object' THEN
      IF NOT (z ? 'geocodingMeta') THEN
        z := z || jsonb_build_object('geocodingMeta', '{}'::jsonb);
      END IF;
      acc := acc || jsonb_build_array(z);
    END IF;
  END LOOP;

  v_out := jsonb_build_object('version', 3, 'zones', acc);
  IF v_meta IS NOT NULL THEN
    v_out := v_out || jsonb_build_object('geocodingMeta', v_meta);
  END IF;
  RETURN v_out;
END;
$$;

-- 2) Backfill existing rows (idempotent)
UPDATE btp.projects
   SET localisation = btp.normalize_intervention_zones(localisation)
 WHERE localisation IS NOT NULL
   AND (jsonb_typeof(localisation) <> 'object' OR (localisation->>'version') IS DISTINCT FROM '3');

-- 3) Trigger: keep normalization on writes
CREATE OR REPLACE FUNCTION btp.tg_normalize_project_localisation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.localisation IS NOT NULL THEN
    NEW.localisation := btp.normalize_intervention_zones(NEW.localisation);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_localisation ON btp.projects;
CREATE TRIGGER trg_normalize_localisation
BEFORE INSERT OR UPDATE OF localisation ON btp.projects
FOR EACH ROW EXECUTE FUNCTION btp.tg_normalize_project_localisation();

-- 4) GIN index to support future geo-search on zones
CREATE INDEX IF NOT EXISTS idx_btp_projects_localisation_gin
  ON btp.projects USING gin (localisation jsonb_path_ops);

-- 5) Refresh public view if it exists (no-op if missing)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.views
     WHERE table_schema='public' AND table_name='projects'
  ) THEN
    -- btp.projects is a view over btp.projects; nothing to do, it inherits.
    PERFORM 1;
  END IF;
END$$;
