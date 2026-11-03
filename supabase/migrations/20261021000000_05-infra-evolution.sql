-- =============================================================================
-- MIGRATION 05-infra-evolution.sql
-- Schéma infra — modèle générique multi-réseaux (Utility Network adapté)
-- Contraintes structurelles uniquement. Référentiels ouverts au métier.
-- =============================================================================

BEGIN;

-- 1. ENRICHISSEMENT infra.structures
ALTER TABLE infra.structures
  ADD COLUMN IF NOT EXISTS asset_type_code text REFERENCES infra.asset_types(code),
  ADD COLUMN IF NOT EXISTS operational_status text NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS lifecycle text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS valid_from timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS valid_to timestamptz,
  ADD COLUMN IF NOT EXISTS owner text,
  ADD COLUMN IF NOT EXISTS responsibility_team text,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS capacity_volume double precision,
  ADD COLUMN IF NOT EXISTS width_m double precision,
  ADD COLUMN IF NOT EXISTS height_m double precision,
  ADD COLUMN IF NOT EXISTS burial_depth_cm integer,
  ADD COLUMN IF NOT EXISTS ground_clearance_m double precision,
  ADD COLUMN IF NOT EXISTS load_capacity_kg double precision,
  ADD COLUMN IF NOT EXISTS code_geo text,
  ADD COLUMN IF NOT EXISTS label_fr text,
  ADD COLUMN IF NOT EXISTS label_ar text,
  ADD COLUMN IF NOT EXISTS label_default text;

ALTER TABLE infra.structures
  ADD CONSTRAINT structures_validity CHECK (valid_to IS NULL OR valid_to >= valid_from),
  ADD CONSTRAINT structures_geom_not_empty CHECK (NOT ST_IsEmpty(geometry)),
  ADD CONSTRAINT structures_geom_srid CHECK (ST_SRID(geometry) = 4326);

CREATE INDEX IF NOT EXISTS structures_code_geo_idx ON infra.structures(code_geo);
CREATE INDEX IF NOT EXISTS structures_type_idx ON infra.structures(structure_type);

-- 2. ENRICHISSEMENT infra.network_features
ALTER TABLE infra.network_features
  ADD COLUMN IF NOT EXISTS domain_code text REFERENCES infra.domains(code),
  ADD COLUMN IF NOT EXISTS operational_status text NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS lifecycle text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS valid_from timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS valid_to timestamptz,
  ADD COLUMN IF NOT EXISTS tier smallint,
  ADD COLUMN IF NOT EXISTS owner text,
  ADD COLUMN IF NOT EXISTS responsibility_team text,
  ADD COLUMN IF NOT EXISTS installation_method text,
  ADD COLUMN IF NOT EXISTS rated_voltage_kv double precision,
  ADD COLUMN IF NOT EXISTS rated_current_a double precision,
  ADD COLUMN IF NOT EXISTS capacity_kva double precision,
  ADD COLUMN IF NOT EXISTS capacity_volume double precision,
  ADD COLUMN IF NOT EXISTS diameter_mm double precision,
  ADD COLUMN IF NOT EXISTS length_m double precision,
  ADD COLUMN IF NOT EXISTS material text,
  ADD COLUMN IF NOT EXISTS code_geo text,
  ADD COLUMN IF NOT EXISTS localite_type text,
  ADD COLUMN IF NOT EXISTS code_adm text,
  ADD COLUMN IF NOT EXISTS label_fr text,
  ADD COLUMN IF NOT EXISTS label_ar text,
  ADD COLUMN IF NOT EXISTS label_default text;

ALTER TABLE infra.network_features
  ADD CONSTRAINT network_features_validity CHECK (valid_to IS NULL OR valid_to >= valid_from),
  ADD CONSTRAINT network_features_geom_not_empty CHECK (NOT ST_IsEmpty(geometry)),
  ADD CONSTRAINT network_features_geom_srid CHECK (ST_SRID(geometry) = 4326);

CREATE INDEX IF NOT EXISTS network_features_domain_idx ON infra.network_features(domain_code);
CREATE INDEX IF NOT EXISTS network_features_code_geo_idx ON infra.network_features(code_geo);

-- 3. code_geo_mapping
CREATE TABLE IF NOT EXISTS infra.code_geo_mapping (
  code_geo text PRIMARY KEY,
  longitude_deg double precision NOT NULL,
  latitude_deg double precision NOT NULL,
  hemisphere char(1) CHECK (hemisphere IN ('E','O')),
  x_coord_abs integer, y_coord_abs integer,
  localite_fr text, localite_ar text, localite_default text,
  code_adm text, localite_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  source text
);

-- 4. generate_code_geo + trigger auto
CREATE OR REPLACE FUNCTION infra.generate_code_geo(lon double precision, lat double precision)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE hemi char(1); x_abs integer; y_abs integer;
BEGIN
  hemi := CASE WHEN lon >= 0 THEN '0' ELSE '9' END;
  x_abs := ABS(FLOOR(lon * 1000));
  y_abs := ABS(FLOOR(lat * 1000));
  RETURN hemi || LPAD(x_abs::text, 4, '0') || LPAD(y_abs::text, 4, '0');
END $$;

CREATE OR REPLACE FUNCTION infra.auto_generate_code_geo()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE lon double precision; lat double precision;
BEGIN
  IF NEW.geometry IS NOT NULL AND (NEW.code_geo IS NULL OR NEW.code_geo = '') THEN
    IF GeometryType(NEW.geometry) = 'LINESTRING' THEN
      lon := ST_X(ST_StartPoint(NEW.geometry));
      lat := ST_Y(ST_StartPoint(NEW.geometry));
    ELSIF GeometryType(NEW.geometry) = 'POLYGON' THEN
      lon := ST_X(ST_Centroid(NEW.geometry));
      lat := ST_Y(ST_Centroid(NEW.geometry));
    ELSE
      lon := ST_X(NEW.geometry);
      lat := ST_Y(NEW.geometry);
    END IF;
    NEW.code_geo := infra.generate_code_geo(lon, lat);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS structures_code_geo_trg ON infra.structures;
CREATE TRIGGER structures_code_geo_trg BEFORE INSERT OR UPDATE ON infra.structures
  FOR EACH ROW EXECUTE FUNCTION infra.auto_generate_code_geo();

DROP TRIGGER IF EXISTS network_features_code_geo_trg ON infra.network_features;
CREATE TRIGGER network_features_code_geo_trg BEFORE INSERT OR UPDATE ON infra.network_features
  FOR EACH ROW EXECUTE FUNCTION infra.auto_generate_code_geo();

-- 5. asset_attributes
CREATE TABLE IF NOT EXISTS infra.asset_attributes (
  attribute_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_class text NOT NULL,
  asset_globalid uuid NOT NULL,
  attribute_name text NOT NULL,
  attribute_value text,
  unit text,
  label_fr text, label_ar text, label_default text,
  recorded_date timestamptz NOT NULL DEFAULT now(),
  source text,
  created_by uuid NOT NULL DEFAULT auth.uid()
);
CREATE INDEX IF NOT EXISTS asset_attributes_asset_idx ON infra.asset_attributes(asset_class, asset_globalid);

-- 6. assembly_contents
CREATE TABLE IF NOT EXISTS infra.assembly_contents (
  assembly_globalid uuid NOT NULL REFERENCES infra.network_features(id) ON DELETE CASCADE,
  component_globalid uuid NOT NULL REFERENCES infra.network_features(id) ON DELETE CASCADE,
  component_role text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  label_fr text, label_ar text, label_default text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (assembly_globalid, component_globalid)
);

-- 7. structure_contents
CREATE TABLE IF NOT EXISTS infra.structure_contents (
  content_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_globalid uuid NOT NULL REFERENCES infra.structures(id) ON DELETE CASCADE,
  asset_globalid uuid NOT NULL,
  occupancy_ratio double precision CHECK (occupancy_ratio BETWEEN 0 AND 100),
  start_measure double precision, end_measure double precision,
  label_fr text, label_ar text, label_default text,
  source text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. structural_attachments
CREATE TABLE IF NOT EXISTS infra.structural_attachments (
  attachment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  structure_globalid uuid NOT NULL REFERENCES infra.structures(id) ON DELETE CASCADE,
  equipment_globalid uuid NOT NULL REFERENCES infra.network_features(id) ON DELETE CASCADE,
  attachment_point text,
  offset_distance_m double precision,
  orientation_degrees double precision,
  label_fr text, label_ar text, label_default text,
  source text,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. outage_logs
CREATE TABLE IF NOT EXISTS infra.outage_logs (
  outage_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  outage_starttime timestamptz NOT NULL,
  outage_endtime timestamptz,
  affected_feature_class text NOT NULL,
  affected_feature_globalid uuid NOT NULL,
  root_cause_category text, root_cause_detail text,
  impacted_customer_count integer,
  impacted_demand_mw double precision,
  duration_minutes integer GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (outage_endtime - outage_starttime))/60
  ) STORED,
  resolution_team text, incident_report_link text,
  label_fr text, label_ar text, label_default text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  source text,
  CHECK (outage_endtime IS NULL OR outage_endtime >= outage_starttime)
);

-- 10. intervention_logs
CREATE TABLE IF NOT EXISTS infra.intervention_logs (
  intervention_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  work_order_id text UNIQUE NOT NULL,
  intervention_type text,
  affected_feature_class text NOT NULL,
  affected_feature_globalid uuid NOT NULL,
  scheduled_date date,
  actual_start_date timestamptz, actual_end_date timestamptz,
  duration_hours double precision GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (actual_end_date - actual_start_date))/3600
  ) STORED,
  status text,
  technician_id uuid, technician_name text, technician_team text,
  description_work text,
  downtime_minutes integer, impacted_customers_count integer,
  parts_cost_usd double precision, labor_cost_usd double precision,
  total_cost_usd double precision GENERATED ALWAYS AS (
    COALESCE(parts_cost_usd,0) + COALESCE(labor_cost_usd,0)
  ) STORED,
  weather_condition text, photo_attachments jsonb,
  label_fr text, label_ar text, label_default text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  source text,
  CHECK (actual_end_date IS NULL OR actual_end_date >= actual_start_date)
);

-- 11. customer_accounts
CREATE TABLE IF NOT EXISTS infra.customer_accounts (
  customer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  customer_name text NOT NULL,
  service_point_globalid uuid,
  meter_installation_date date,
  voltage_class text, billing_status text,
  actual_consumption_kwh double precision,
  estimated_annual_kwh double precision,
  outage_history_count integer DEFAULT 0,
  last_outage_date date,
  contact_email text, contact_phone text,
  code_geo text,
  label_fr text, label_ar text, label_default text,
  localite_type text, code_adm text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid()
);

-- 12. connection_requests
CREATE TABLE IF NOT EXISTS infra.connection_requests (
  request_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  request_date date NOT NULL,
  request_type text,
  customer_id uuid REFERENCES infra.customer_accounts(customer_id),
  requested_location geometry(Point,4326),
  nearest_service_point_globalid uuid,
  nearest_transformer_distance_m double precision,
  status text,
  requested_capacity_kw double precision,
  available_capacity_kw double precision,
  capacity_shortfall_kw double precision,
  upgrade_cost_estimated double precision,
  infrastructure_required text,
  lost_revenue_impact_usd double precision,
  priority_level text,
  code_geo text,
  label_fr text, label_ar text, label_default text,
  localite_type text, code_adm text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid()
);
CREATE INDEX IF NOT EXISTS connection_requests_location_idx ON infra.connection_requests USING gist(requested_location);

-- 13. telemetry_readings
CREATE TABLE IF NOT EXISTS infra.telemetry_readings (
  reading_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_globalid uuid NOT NULL,
  timestamp timestamptz NOT NULL,
  parameter text NOT NULL,
  value double precision, unit text,
  quality text DEFAULT 'Good',
  label_fr text, label_ar text, label_default text,
  created_at timestamptz NOT NULL DEFAULT now(),
  source text
);
CREATE INDEX IF NOT EXISTS telemetry_readings_asset_idx ON infra.telemetry_readings(asset_globalid, timestamp);

-- 14. alerts
CREATE TABLE IF NOT EXISTS infra.alerts (
  alert_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_globalid uuid NOT NULL,
  alert_type text,
  severity text CHECK (severity IN ('Critical','High','Medium','Low')),
  message text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  is_acknowledged boolean DEFAULT false,
  acknowledged_by text,
  cleared_timestamp timestamptz,
  label_fr text, label_ar text, label_default text,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (cleared_timestamp IS NULL OR cleared_timestamp >= timestamp)
);

-- 15. topology_error_logs
CREATE TABLE IF NOT EXISTS infra.topology_error_logs (
  error_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid,
  error_type text, feature_class text, feature_globalid uuid,
  error_description text,
  detected_timestamp timestamptz NOT NULL DEFAULT now(),
  resolved_timestamp timestamptz, resolved_by text,
  label_fr text, label_ar text, label_default text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  source text,
  CHECK (resolved_timestamp IS NULL OR resolved_timestamp >= detected_timestamp)
);

-- 16. TRIGGERS touch_updated_at
CREATE OR REPLACE FUNCTION infra.touch_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS structures_touch ON infra.structures;
CREATE TRIGGER structures_touch BEFORE UPDATE ON infra.structures
  FOR EACH ROW EXECUTE FUNCTION infra.touch_updated_at();
DROP TRIGGER IF EXISTS network_features_touch ON infra.network_features;
CREATE TRIGGER network_features_touch BEFORE UPDATE ON infra.network_features
  FOR EACH ROW EXECUTE FUNCTION infra.touch_updated_at();
DROP TRIGGER IF EXISTS customer_accounts_touch ON infra.customer_accounts;
CREATE TRIGGER customer_accounts_touch BEFORE UPDATE ON infra.customer_accounts
  FOR EACH ROW EXECUTE FUNCTION infra.touch_updated_at();
DROP TRIGGER IF EXISTS connection_requests_touch ON infra.connection_requests;
CREATE TRIGGER connection_requests_touch BEFORE UPDATE ON infra.connection_requests
  FOR EACH ROW EXECUTE FUNCTION infra.touch_updated_at();

-- 17. VALIDATION GEOMETRY KIND
CREATE OR REPLACE FUNCTION infra.validate_feature_geometry() RETURNS trigger
LANGUAGE plpgsql SET search_path = infra AS $$
DECLARE v_kind text;
BEGIN
  SELECT geometry_kind INTO v_kind FROM infra.asset_types WHERE code = NEW.asset_type_code;
  IF v_kind IS NULL THEN
    RAISE EXCEPTION 'Unknown asset_type_code: %', NEW.asset_type_code;
  END IF;
  IF v_kind <> 'Geometry' AND GeometryType(NEW.geometry) <> v_kind THEN
    RAISE EXCEPTION 'Geometry type % does not match asset_type kind %',
      GeometryType(NEW.geometry), v_kind;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS network_features_geom_kind ON infra.network_features;
CREATE TRIGGER network_features_geom_kind BEFORE INSERT OR UPDATE ON infra.network_features
  FOR EACH ROW EXECUTE FUNCTION infra.validate_feature_geometry();

-- 18. RLS (activer sur toutes les nouvelles tables)
ALTER TABLE infra.asset_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.assembly_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.structure_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.structural_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.outage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.intervention_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.customer_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.telemetry_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.topology_error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.code_geo_mapping ENABLE ROW LEVEL SECURITY;

-- 19. GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON
  infra.structures, infra.network_features, infra.project_asset_links,
  infra.asset_attributes, infra.assembly_contents, infra.structure_contents,
  infra.structural_attachments, infra.outage_logs, infra.intervention_logs,
  infra.customer_accounts, infra.connection_requests, infra.telemetry_readings,
  infra.alerts, infra.topology_error_logs, infra.code_geo_mapping
TO authenticated;

GRANT ALL ON
  infra.structures, infra.network_features, infra.project_asset_links,
  infra.asset_attributes, infra.assembly_contents, infra.structure_contents,
  infra.structural_attachments, infra.outage_logs, infra.intervention_logs,
  infra.customer_accounts, infra.connection_requests, infra.telemetry_readings,
  infra.alerts, infra.topology_error_logs, infra.code_geo_mapping
TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
