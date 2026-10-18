DROP FUNCTION IF EXISTS public.infra_asset_list(uuid);
DROP FUNCTION IF EXISTS public.infra_asset_save(uuid,text,text,jsonb,text,uuid);
DROP FUNCTION IF EXISTS public.infra_asset_delete(uuid,uuid);
DROP FUNCTION IF EXISTS public.infra_realization_save(uuid,uuid,text,uuid,date,uuid);
DROP FUNCTION IF EXISTS public.infra_zone_analysis(uuid,jsonb,double precision);
DROP TABLE IF EXISTS infra.project_asset_links;
DROP TABLE IF EXISTS infra.assets;

CREATE SCHEMA IF NOT EXISTS infra;
GRANT USAGE ON SCHEMA infra TO authenticated, service_role;

CREATE TABLE infra.domains (
  code text PRIMARY KEY CHECK (length(trim(code)) > 0),
  label_fr text NOT NULL, label_ar text, label_en text, description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON infra.domains TO authenticated;
GRANT ALL ON infra.domains TO service_role;
ALTER TABLE infra.domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY domains_read ON infra.domains FOR SELECT TO authenticated USING (true);
CREATE POLICY domains_admin ON infra.domains FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE infra.asset_types (
  code text PRIMARY KEY CHECK (length(trim(code)) > 0),
  domain_code text NOT NULL REFERENCES infra.domains(code),
  asset_group text, asset_type text,
  label_fr text NOT NULL, label_ar text, label_en text,
  geometry_kind text NOT NULL CHECK (geometry_kind IN ('Point','LineString','Polygon','MultiPoint','MultiLineString','MultiPolygon','Geometry')),
  icon text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX asset_types_domain_idx ON infra.asset_types(domain_code) WHERE active;
GRANT SELECT, INSERT, UPDATE, DELETE ON infra.asset_types TO authenticated;
GRANT ALL ON infra.asset_types TO service_role;
ALTER TABLE infra.asset_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY asset_types_read ON infra.asset_types FOR SELECT TO authenticated USING (true);
CREATE POLICY asset_types_admin ON infra.asset_types FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE infra.structures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  structure_type text NOT NULL CHECK (length(trim(structure_type)) > 0),
  name text,
  geometry extensions.geometry(Geometry,4326) NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT structures_geom_valid CHECK (extensions.ST_IsValid(geometry)),
  CONSTRAINT structures_geom_not_empty CHECK (NOT extensions.ST_IsEmpty(geometry)),
  CONSTRAINT structures_geom_srid CHECK (extensions.ST_SRID(geometry) = 4326)
);
CREATE INDEX structures_geom_idx ON infra.structures USING gist(geometry);
CREATE INDEX structures_project_idx ON infra.structures(project_id);

CREATE TABLE infra.network_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  asset_type_code text NOT NULL REFERENCES infra.asset_types(code),
  name text NOT NULL CHECK (length(trim(name)) > 0),
  status text NOT NULL DEFAULT 'planned',
  geometry extensions.geometry(Geometry,4326) NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  parent_feature_id uuid REFERENCES infra.network_features(id) ON DELETE SET NULL,
  from_feature_id uuid, to_feature_id uuid,
  structure_id uuid REFERENCES infra.structures(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT network_features_geom_valid CHECK (extensions.ST_IsValid(geometry)),
  CONSTRAINT network_features_geom_not_empty CHECK (NOT extensions.ST_IsEmpty(geometry)),
  CONSTRAINT network_features_geom_srid CHECK (extensions.ST_SRID(geometry) = 4326)
);
CREATE INDEX network_features_geom_idx ON infra.network_features USING gist(geometry);
CREATE INDEX network_features_project_idx ON infra.network_features(project_id);
CREATE INDEX network_features_type_idx ON infra.network_features(asset_type_code);
CREATE INDEX network_features_parent_idx ON infra.network_features(parent_feature_id) WHERE parent_feature_id IS NOT NULL;

CREATE TABLE infra.project_asset_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  feature_id uuid REFERENCES infra.network_features(id) ON DELETE CASCADE,
  structure_id uuid REFERENCES infra.structures(id) ON DELETE CASCADE,
  phase_id uuid,
  realization text NOT NULL DEFAULT 'planned' CHECK (realization IN ('planned','partial','completed')),
  inspection_id uuid,
  completed_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_asset_links_target CHECK ((feature_id IS NOT NULL)::int + (structure_id IS NOT NULL)::int = 1),
  CONSTRAINT project_asset_links_completed_requires_date CHECK (realization <> 'completed' OR completed_on IS NOT NULL)
);
CREATE UNIQUE INDEX project_asset_links_feature_uniq ON infra.project_asset_links(project_id, feature_id) WHERE feature_id IS NOT NULL;
CREATE UNIQUE INDEX project_asset_links_structure_uniq ON infra.project_asset_links(project_id, structure_id) WHERE structure_id IS NOT NULL;
CREATE INDEX project_asset_links_project_idx ON infra.project_asset_links(project_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON infra.structures, infra.network_features, infra.project_asset_links TO authenticated;
GRANT ALL ON infra.structures, infra.network_features, infra.project_asset_links TO service_role;
ALTER TABLE infra.structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.network_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra.project_asset_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY structures_read ON infra.structures FOR SELECT TO authenticated USING (public.project_workbench_access(project_id, false));
CREATE POLICY structures_write ON infra.structures FOR ALL TO authenticated USING (public.project_workbench_access(project_id, true)) WITH CHECK (public.project_workbench_access(project_id, true));
CREATE POLICY network_features_read ON infra.network_features FOR SELECT TO authenticated USING (public.project_workbench_access(project_id, false));
CREATE POLICY network_features_write ON infra.network_features FOR ALL TO authenticated USING (public.project_workbench_access(project_id, true)) WITH CHECK (public.project_workbench_access(project_id, true));
CREATE POLICY links_read ON infra.project_asset_links FOR SELECT TO authenticated USING (public.project_workbench_access(project_id, false));
CREATE POLICY links_write ON infra.project_asset_links FOR ALL TO authenticated USING (public.project_workbench_access(project_id, true)) WITH CHECK (public.project_workbench_access(project_id, true));

CREATE OR REPLACE FUNCTION infra.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = infra AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER structures_touch BEFORE UPDATE ON infra.structures FOR EACH ROW EXECUTE FUNCTION infra.touch_updated_at();
CREATE TRIGGER network_features_touch BEFORE UPDATE ON infra.network_features FOR EACH ROW EXECUTE FUNCTION infra.touch_updated_at();
CREATE TRIGGER project_asset_links_touch BEFORE UPDATE ON infra.project_asset_links FOR EACH ROW EXECUTE FUNCTION infra.touch_updated_at();

CREATE OR REPLACE FUNCTION infra.validate_feature_geometry() RETURNS trigger
LANGUAGE plpgsql SET search_path = infra, extensions AS $$
DECLARE v_kind text;
BEGIN
  SELECT geometry_kind INTO v_kind FROM infra.asset_types WHERE code = NEW.asset_type_code AND active;
  IF v_kind IS NULL THEN RAISE EXCEPTION 'Unknown asset_type_code: %', NEW.asset_type_code; END IF;
  IF v_kind <> 'Geometry' AND extensions.GeometryType(NEW.geometry) <> upper(v_kind) THEN
    RAISE EXCEPTION 'Geometry type % does not match asset_type kind %', extensions.GeometryType(NEW.geometry), v_kind;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER network_features_geom_kind BEFORE INSERT OR UPDATE ON infra.network_features FOR EACH ROW EXECUTE FUNCTION infra.validate_feature_geometry();

CREATE OR REPLACE FUNCTION public.infra_domains()
RETURNS TABLE(code text, label_fr text, label_ar text, label_en text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, infra AS $$
  SELECT d.code, d.label_fr, d.label_ar, d.label_en FROM infra.domains d WHERE d.active ORDER BY d.code;
$$;

CREATE OR REPLACE FUNCTION public.infra_asset_types(p_domain text DEFAULT NULL)
RETURNS TABLE(code text, domain_code text, asset_group text, asset_type text, label_fr text, label_ar text, label_en text, geometry_kind text, icon text)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, infra AS $$
  SELECT t.code, t.domain_code, t.asset_group, t.asset_type, t.label_fr, t.label_ar, t.label_en, t.geometry_kind, t.icon
  FROM infra.asset_types t WHERE t.active AND (p_domain IS NULL OR t.domain_code = p_domain)
  ORDER BY t.domain_code, t.asset_group, t.asset_type;
$$;

CREATE OR REPLACE FUNCTION public.infra_asset_type_save(p_code text, p_domain_code text, p_label_fr text, p_geometry_kind text, p_label_ar text DEFAULT NULL, p_label_en text DEFAULT NULL, p_asset_group text DEFAULT NULL, p_asset_type text DEFAULT NULL, p_domain_label_fr text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, infra AS $$
BEGIN
  IF p_domain_label_fr IS NOT NULL THEN
    INSERT INTO infra.domains(code, label_fr) VALUES (p_domain_code, p_domain_label_fr) ON CONFLICT (code) DO NOTHING;
  END IF;
  INSERT INTO infra.asset_types(code, domain_code, asset_group, asset_type, label_fr, label_ar, label_en, geometry_kind)
  VALUES (p_code, p_domain_code, p_asset_group, p_asset_type, p_label_fr, p_label_ar, p_label_en, p_geometry_kind)
  ON CONFLICT (code) DO UPDATE SET domain_code = excluded.domain_code, asset_group = excluded.asset_group, asset_type = excluded.asset_type,
    label_fr = excluded.label_fr, label_ar = excluded.label_ar, label_en = excluded.label_en, geometry_kind = excluded.geometry_kind, active = true;
  RETURN p_code;
END $$;

CREATE OR REPLACE FUNCTION public.infra_feature_list(p_project_id uuid)
RETURNS TABLE(id uuid, project_id uuid, name text, asset_type_code text, status text, geojson jsonb, properties jsonb, updated_at timestamptz,
              realization text, inspection_id uuid, completed_on date, phase_id uuid)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, infra, extensions AS $$
  SELECT f.id, f.project_id, f.name, f.asset_type_code, f.status, extensions.ST_AsGeoJSON(f.geometry)::jsonb, f.properties, f.updated_at,
         l.realization, l.inspection_id, l.completed_on, l.phase_id
  FROM infra.network_features f
  LEFT JOIN infra.project_asset_links l ON l.feature_id = f.id AND l.project_id = f.project_id
  WHERE f.project_id = p_project_id AND public.project_workbench_access(p_project_id, false)
  ORDER BY f.name;
$$;

CREATE OR REPLACE FUNCTION public.infra_feature_save(p_project_id uuid, p_asset_type_code text, p_name text, p_geojson jsonb, p_status text DEFAULT 'planned', p_properties jsonb DEFAULT '{}'::jsonb, p_feature_id uuid DEFAULT NULL, p_parent_feature_id uuid DEFAULT NULL, p_structure_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, infra, extensions AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.project_workbench_access(p_project_id, true) THEN RAISE EXCEPTION 'Project access denied'; END IF;
  IF p_feature_id IS NULL THEN
    INSERT INTO infra.network_features(project_id, asset_type_code, name, status, geometry, properties, parent_feature_id, structure_id)
    VALUES (p_project_id, p_asset_type_code, trim(p_name), coalesce(nullif(trim(p_status),''),'planned'),
            extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(p_geojson::text), 4326), coalesce(p_properties,'{}'::jsonb), p_parent_feature_id, p_structure_id)
    RETURNING id INTO v_id;
  ELSE
    UPDATE infra.network_features SET asset_type_code = p_asset_type_code, name = trim(p_name), status = coalesce(nullif(trim(p_status),''),'planned'),
      geometry = extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(p_geojson::text), 4326), properties = coalesce(p_properties,'{}'::jsonb),
      parent_feature_id = p_parent_feature_id, structure_id = p_structure_id
    WHERE id = p_feature_id AND project_id = p_project_id RETURNING id INTO v_id;
  END IF;
  IF v_id IS NULL THEN RAISE EXCEPTION 'Feature not found'; END IF;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.infra_feature_import(p_project_id uuid, p_features jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, infra, extensions AS $$
DECLARE v_item jsonb; v_ids uuid[] := '{}'; v_id uuid; v_count int := 0; v_errors jsonb := '[]'::jsonb;
BEGIN
  IF NOT public.project_workbench_access(p_project_id, true) THEN RAISE EXCEPTION 'Project access denied'; END IF;
  IF jsonb_typeof(p_features) <> 'array' THEN RAISE EXCEPTION 'p_features must be a JSON array'; END IF;
  IF jsonb_array_length(p_features) > 5000 THEN RAISE EXCEPTION 'Too many features (max 5000)'; END IF;
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_features) LOOP
    BEGIN
      INSERT INTO infra.network_features(project_id, asset_type_code, name, status, geometry, properties)
      VALUES (p_project_id, v_item->>'asset_type_code', coalesce(nullif(trim(v_item->>'name'),''), 'Sans nom'), coalesce(nullif(v_item->>'status',''), 'planned'),
              extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON((v_item->'geometry')::text), 4326), coalesce(v_item->'properties', '{}'::jsonb))
      RETURNING id INTO v_id;
      v_ids := array_append(v_ids, v_id); v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object('name', v_item->>'name', 'error', SQLERRM);
    END;
  END LOOP;
  RETURN jsonb_build_object('importedCount', v_count, 'ids', to_jsonb(v_ids), 'errors', v_errors);
END $$;

CREATE OR REPLACE FUNCTION public.infra_feature_delete(p_project_id uuid, p_feature_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, infra AS $$
BEGIN
  IF NOT public.project_workbench_access(p_project_id, true) THEN RAISE EXCEPTION 'Project access denied'; END IF;
  DELETE FROM infra.network_features WHERE id = p_feature_id AND project_id = p_project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Feature not found'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.infra_structure_list(p_project_id uuid)
RETURNS TABLE(id uuid, project_id uuid, structure_type text, name text, geojson jsonb, properties jsonb, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public, infra, extensions AS $$
  SELECT s.id, s.project_id, s.structure_type, s.name, extensions.ST_AsGeoJSON(s.geometry)::jsonb, s.properties, s.updated_at
  FROM infra.structures s WHERE s.project_id = p_project_id AND public.project_workbench_access(p_project_id, false) ORDER BY s.structure_type, s.name;
$$;

CREATE OR REPLACE FUNCTION public.infra_structure_save(p_project_id uuid, p_structure_type text, p_name text, p_geojson jsonb, p_properties jsonb DEFAULT '{}'::jsonb, p_structure_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, infra, extensions AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.project_workbench_access(p_project_id, true) THEN RAISE EXCEPTION 'Project access denied'; END IF;
  IF p_structure_id IS NULL THEN
    INSERT INTO infra.structures(project_id, structure_type, name, geometry, properties)
    VALUES (p_project_id, trim(p_structure_type), nullif(trim(p_name),''), extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(p_geojson::text), 4326), coalesce(p_properties,'{}'::jsonb))
    RETURNING id INTO v_id;
  ELSE
    UPDATE infra.structures SET structure_type = trim(p_structure_type), name = nullif(trim(p_name),''),
      geometry = extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(p_geojson::text), 4326), properties = coalesce(p_properties,'{}'::jsonb)
    WHERE id = p_structure_id AND project_id = p_project_id RETURNING id INTO v_id;
  END IF;
  IF v_id IS NULL THEN RAISE EXCEPTION 'Structure not found'; END IF;
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.infra_structure_delete(p_project_id uuid, p_structure_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, infra AS $$
BEGIN
  IF NOT public.project_workbench_access(p_project_id, true) THEN RAISE EXCEPTION 'Project access denied'; END IF;
  DELETE FROM infra.structures WHERE id = p_structure_id AND project_id = p_project_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Structure not found'; END IF;
END $$;

CREATE OR REPLACE FUNCTION public.infra_zone_analysis(p_project_id uuid, p_zone jsonb, p_buffer_meters double precision DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = public, infra, extensions, btp AS $$
DECLARE v_zone extensions.geometry; v_area extensions.geometry; v_piece extensions.geometry; v_feature jsonb; v_radius double precision; v_result jsonb;
BEGIN
  IF NOT public.project_workbench_access(p_project_id, false) THEN RAISE EXCEPTION 'Project access denied'; END IF;
  IF p_buffer_meters IS NULL OR p_buffer_meters < 0 OR p_buffer_meters > 100000 OR p_buffer_meters::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'Invalid metric buffer';
  END IF;
  IF p_zone->>'type' = 'FeatureCollection' THEN
    FOR v_feature IN SELECT value FROM jsonb_array_elements(p_zone->'features') LOOP
      v_piece := extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON((v_feature->'geometry')::text), 4326);
      IF v_feature->'properties'->>'shape' = 'circle' THEN
        v_radius := (v_feature->'properties'->>'radiusMeters')::double precision;
        IF v_radius IS NULL OR v_radius <= 0 OR v_radius > 100000 OR v_radius::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid circle radius'; END IF;
        v_piece := extensions.ST_Buffer(v_piece::extensions.geography, v_radius)::extensions.geometry;
      END IF;
      IF NOT extensions.ST_IsValid(v_piece) OR extensions.ST_IsEmpty(v_piece) THEN RAISE EXCEPTION 'Invalid project zone'; END IF;
      v_zone := CASE WHEN v_zone IS NULL THEN v_piece ELSE extensions.ST_Union(v_zone, v_piece) END;
    END LOOP;
  ELSE
    v_zone := extensions.ST_UnaryUnion(extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(p_zone::text), 4326));
  END IF;
  IF v_zone IS NULL OR NOT extensions.ST_IsValid(v_zone) OR extensions.ST_IsEmpty(v_zone) THEN RAISE EXCEPTION 'Invalid project zone'; END IF;
  v_area := CASE WHEN p_buffer_meters = 0 THEN v_zone ELSE extensions.ST_Buffer(v_zone::extensions.geography, p_buffer_meters)::extensions.geometry END;
  SELECT jsonb_build_object(
    'presentCount', count(DISTINCT f.id),
    'completedCount', count(DISTINCT f.id) FILTER (WHERE EXISTS (
        SELECT 1 FROM infra.project_asset_links l JOIN btp.inspections i ON i.id = l.inspection_id
        WHERE l.feature_id = f.id AND l.project_id = p_project_id AND l.realization = 'completed' AND l.completed_on IS NOT NULL
          AND i.project_id = p_project_id AND lower(i.status::text) IN ('approved','completed'))),
    'assetIds', coalesce(jsonb_agg(DISTINCT f.id), '[]'::jsonb),
    'intersectedLengthMeters', coalesce(sum(CASE WHEN extensions.ST_Dimension(f.geometry) = 1
        THEN extensions.ST_Length(extensions.ST_CollectionExtract(extensions.ST_Intersection(f.geometry, v_area), 2)::extensions.geography) ELSE 0 END), 0),
    'bufferGeojson', extensions.ST_AsGeoJSON(v_area)::jsonb
  ) INTO v_result
  FROM infra.network_features f WHERE f.project_id = p_project_id AND extensions.ST_Intersects(f.geometry, v_area);
  RETURN v_result;
END $$;

CREATE OR REPLACE FUNCTION public.infra_realization_save(p_project_id uuid, p_feature_id uuid, p_realization text, p_inspection_id uuid DEFAULT NULL, p_completed_on date DEFAULT NULL, p_phase_id uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, infra AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.project_workbench_access(p_project_id, true) THEN RAISE EXCEPTION 'Project access denied'; END IF;
  INSERT INTO infra.project_asset_links(project_id, feature_id, phase_id, realization, inspection_id, completed_on)
  VALUES (p_project_id, p_feature_id, p_phase_id, p_realization, p_inspection_id, p_completed_on)
  ON CONFLICT (project_id, feature_id) WHERE feature_id IS NOT NULL
  DO UPDATE SET phase_id = excluded.phase_id, realization = excluded.realization, inspection_id = excluded.inspection_id, completed_on = excluded.completed_on
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

REVOKE ALL ON FUNCTION public.infra_domains(), public.infra_asset_types(text),
  public.infra_asset_type_save(text,text,text,text,text,text,text,text,text),
  public.infra_feature_list(uuid), public.infra_feature_save(uuid,text,text,jsonb,text,jsonb,uuid,uuid,uuid),
  public.infra_feature_import(uuid,jsonb), public.infra_feature_delete(uuid,uuid),
  public.infra_structure_list(uuid), public.infra_structure_save(uuid,text,text,jsonb,jsonb,uuid), public.infra_structure_delete(uuid,uuid),
  public.infra_zone_analysis(uuid,jsonb,double precision), public.infra_realization_save(uuid,uuid,text,uuid,date,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.infra_domains(), public.infra_asset_types(text),
  public.infra_asset_type_save(text,text,text,text,text,text,text,text,text),
  public.infra_feature_list(uuid), public.infra_feature_save(uuid,text,text,jsonb,text,jsonb,uuid,uuid,uuid),
  public.infra_feature_import(uuid,jsonb), public.infra_feature_delete(uuid,uuid),
  public.infra_structure_list(uuid), public.infra_structure_save(uuid,text,text,jsonb,jsonb,uuid), public.infra_structure_delete(uuid,uuid),
  public.infra_zone_analysis(uuid,jsonb,double precision), public.infra_realization_save(uuid,uuid,text,uuid,date,uuid) TO authenticated, service_role;

INSERT INTO infra.domains(code, label_fr, label_ar, label_en) VALUES
  ('electricity','Électricité','كهرباء','Electricity'), ('water','Eau','ماء','Water'),
  ('telecom','Télécom','اتصالات','Telecom'), ('gas','Gaz','غاز','Gas'), ('road','Route','طريق','Road')
ON CONFLICT (code) DO NOTHING;
INSERT INTO infra.asset_types(code, domain_code, asset_group, asset_type, label_fr, label_ar, label_en, geometry_kind) VALUES
  ('line_ht','electricity','line','HT_Line','Ligne HT','خط عالي الجهد','HV line','LineString'),
  ('line_mt','electricity','line','MT_Line','Ligne MT','خط متوسط الجهد','MV line','LineString'),
  ('substation_ht','electricity','substation','HT_Substation','Poste HT','محطة عالية الجهد','HV substation','Point'),
  ('substation_mt','electricity','substation','MT_Substation','Poste MT','محطة متوسطة','MV substation','Point'),
  ('tower','electricity','structure','Tower','Pylône','برج','Tower','Point'),
  ('transformer','electricity','device','Transformer','Transformateur','محول','Transformer','Point'),
  ('pipe_main','water','line','Main_Pipe','Conduite principale','أنبوب رئيسي','Main pipe','LineString'),
  ('valve','water','device','Valve','Vanne','صمام','Valve','Point'),
  ('reservoir','water','assembly','Reservoir','Réservoir','خزان','Reservoir','Polygon')
ON CONFLICT (code) DO NOTHING;

NOTIFY pgrst, 'reload schema';