CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;
CREATE SCHEMA IF NOT EXISTS infra;
GRANT USAGE ON SCHEMA infra TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.project_workbench_access(p_project_id uuid, p_write boolean DEFAULT false) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, btp AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM btp.projects p WHERE p.id=p_project_id AND (
 EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id=auth.uid() AND r.role_name IN ('admin','super_admin','director') AND r.status='active' AND (r.expires_at IS NULL OR r.expires_at>now()) AND (r.expired_at IS NULL OR r.expired_at>now()))
 OR p.created_by=auth.uid() OR p.project_responsable_id=auth.uid() OR p.technical_manager_id=auth.uid()
 OR EXISTS(SELECT 1 FROM btp.project_members m WHERE m.project_id=p.id AND m.user_id=auth.uid() AND (NOT p_write OR m.role IN ('manager','project_manager','editor')))
 OR (NOT p_write AND (p.engineering_consultant_id=auth.uid() OR p.supervisor_id=auth.uid()))));
$$;
REVOKE ALL ON FUNCTION public.project_workbench_access(uuid,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.project_workbench_access(uuid,boolean) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.project_workbench_projects() RETURNS TABLE(id uuid,title text,reference text,can_manage boolean) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,btp AS $$ SELECT p.id,p.title,p.project_reference,public.project_workbench_access(p.id,true) FROM btp.projects p WHERE public.project_workbench_access(p.id,false) ORDER BY p.title $$;
REVOKE ALL ON FUNCTION public.project_workbench_projects() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.project_workbench_projects() TO authenticated,service_role;
CREATE TABLE btp.project_operation_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES btp.projects(id), phase_id uuid REFERENCES btp.project_phases(id), task_id uuid,
 kind text NOT NULL CHECK(kind IN ('consumption','expense','revenue')), occurred_on date NOT NULL, label text NOT NULL CHECK(length(trim(label))>0), resource_family text CHECK(resource_family IN ('human','material','equipment')), quantity numeric NOT NULL DEFAULT 1 CHECK(quantity>=0), unit text NOT NULL, amount numeric NOT NULL DEFAULT 0 CHECK(amount>=0), currency text NOT NULL, source_reference text, notes text,
 created_by uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON btp.project_operation_entries TO authenticated;
GRANT ALL ON btp.project_operation_entries TO service_role;
ALTER TABLE btp.project_operation_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY operations_read ON btp.project_operation_entries FOR SELECT TO authenticated USING(public.project_workbench_access(project_id,false));
CREATE POLICY operations_write ON btp.project_operation_entries FOR ALL TO authenticated USING(public.project_workbench_access(project_id,true)) WITH CHECK(public.project_workbench_access(project_id,true));
CREATE INDEX operations_project_day ON btp.project_operation_entries(project_id,occurred_on);
CREATE TABLE infra.assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES btp.projects(id), name text NOT NULL CHECK(length(trim(name))>0), asset_type text NOT NULL, status text NOT NULL DEFAULT 'planned', geometry extensions.geometry(Geometry,4326) NOT NULL, properties jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_by uuid NOT NULL DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(extensions.ST_IsValid(geometry)), CHECK(NOT extensions.ST_IsEmpty(geometry)));
GRANT SELECT,INSERT,UPDATE,DELETE ON infra.assets TO authenticated;
GRANT ALL ON infra.assets TO service_role;
ALTER TABLE infra.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY assets_read ON infra.assets FOR SELECT TO authenticated USING(public.project_workbench_access(project_id,false));
CREATE POLICY assets_write ON infra.assets FOR ALL TO authenticated USING(public.project_workbench_access(project_id,true)) WITH CHECK(public.project_workbench_access(project_id,true));
CREATE INDEX assets_geometry_idx ON infra.assets USING gist(geometry);
CREATE INDEX assets_project_idx ON infra.assets(project_id);
CREATE TABLE infra.project_asset_links (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), asset_id uuid NOT NULL REFERENCES infra.assets(id) ON DELETE CASCADE, project_id uuid NOT NULL REFERENCES btp.projects(id), phase_id uuid REFERENCES btp.project_phases(id), realization text NOT NULL DEFAULT 'planned' CHECK(realization IN ('planned','partial','completed')), inspection_id uuid REFERENCES btp.inspections(id), completed_on date,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(asset_id,project_id));
GRANT SELECT,INSERT,UPDATE,DELETE ON infra.project_asset_links TO authenticated;
GRANT ALL ON infra.project_asset_links TO service_role;
ALTER TABLE infra.project_asset_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY links_read ON infra.project_asset_links FOR SELECT TO authenticated USING(public.project_workbench_access(project_id,false) AND EXISTS(SELECT 1 FROM infra.assets a WHERE a.id=asset_id));
CREATE POLICY links_write ON infra.project_asset_links FOR ALL TO authenticated USING(public.project_workbench_access(project_id,true)) WITH CHECK(public.project_workbench_access(project_id,true) AND EXISTS(SELECT 1 FROM infra.assets a WHERE a.id=asset_id));
CREATE OR REPLACE FUNCTION public.validate_project_workbench_record() RETURNS trigger LANGUAGE plpgsql SET search_path=public,btp,infra AS $$ BEGIN
 IF NEW.phase_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM btp.project_phases p WHERE p.id=NEW.phase_id AND p.project_id=NEW.project_id) THEN RAISE EXCEPTION 'Phase does not belong to project'; END IF;
 IF TG_TABLE_SCHEMA='infra' AND TG_TABLE_NAME='project_asset_links' THEN
 IF NEW.realization='completed' AND (NEW.completed_on IS NULL OR NEW.inspection_id IS NULL OR NOT EXISTS(SELECT 1 FROM btp.inspections i WHERE i.id=NEW.inspection_id AND i.project_id=NEW.project_id AND lower(i.status::text) IN ('approved','completed') AND (NEW.phase_id IS NULL OR i.phase_id=NEW.phase_id))) THEN RAISE EXCEPTION 'Completed infrastructure requires approved project inspection and completion date'; END IF;
 END IF;
 NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER validate_operations BEFORE INSERT OR UPDATE ON btp.project_operation_entries FOR EACH ROW EXECUTE FUNCTION public.validate_project_workbench_record();
CREATE TRIGGER validate_links BEFORE INSERT OR UPDATE ON infra.project_asset_links FOR EACH ROW EXECUTE FUNCTION public.validate_project_workbench_record();
CREATE TRIGGER update_assets BEFORE UPDATE ON infra.assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.infra_asset_list(p_project_id uuid) RETURNS TABLE(id uuid,project_id uuid,name text,asset_type text,status text,geojson jsonb,properties jsonb) LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public,infra,extensions AS $$ SELECT a.id,a.project_id,a.name,a.asset_type,a.status,extensions.ST_AsGeoJSON(a.geometry)::jsonb,a.properties FROM infra.assets a WHERE a.project_id=p_project_id AND public.project_workbench_access(p_project_id,false) ORDER BY a.name $$;
CREATE OR REPLACE FUNCTION public.infra_asset_save(p_project_id uuid,p_name text,p_asset_type text,p_geojson jsonb,p_status text DEFAULT 'planned',p_asset_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,infra,extensions AS $$ DECLARE v_id uuid; BEGIN
 IF NOT public.project_workbench_access(p_project_id,true) THEN RAISE EXCEPTION 'Project access denied'; END IF;
 IF p_asset_id IS NULL THEN INSERT INTO infra.assets(project_id,name,asset_type,status,geometry) VALUES(p_project_id,p_name,p_asset_type,p_status,extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(p_geojson::text),4326)) RETURNING id INTO v_id;
 ELSE UPDATE infra.assets SET name=p_name,asset_type=p_asset_type,status=p_status,geometry=extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(p_geojson::text),4326),updated_at=now() WHERE id=p_asset_id AND project_id=p_project_id RETURNING id INTO v_id; END IF;
 IF v_id IS NULL THEN RAISE EXCEPTION 'Infrastructure not found'; END IF; RETURN v_id; END $$;
CREATE OR REPLACE FUNCTION public.infra_asset_delete(p_project_id uuid,p_asset_id uuid) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,infra AS $$ BEGIN IF NOT public.project_workbench_access(p_project_id,true) THEN RAISE EXCEPTION 'Project access denied'; END IF; DELETE FROM infra.assets WHERE id=p_asset_id AND project_id=p_project_id; IF NOT FOUND THEN RAISE EXCEPTION 'Infrastructure not found'; END IF; END $$;
CREATE OR REPLACE FUNCTION public.infra_zone_analysis(p_project_id uuid,p_zone jsonb,p_buffer_meters double precision DEFAULT 0) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,infra,extensions,btp AS $$ DECLARE v_zone extensions.geometry; v_area extensions.geometry; v_result jsonb; BEGIN
 IF NOT public.project_workbench_access(p_project_id,false) THEN RAISE EXCEPTION 'Project access denied'; END IF;
 IF p_buffer_meters<0 OR p_buffer_meters>100000 OR p_buffer_meters::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid metric buffer'; END IF;
 v_zone=extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(p_zone::text),4326);
 IF NOT extensions.ST_IsValid(v_zone) OR extensions.ST_IsEmpty(v_zone) THEN RAISE EXCEPTION 'Invalid project zone'; END IF;
 v_area=CASE WHEN p_buffer_meters=0 THEN v_zone ELSE extensions.ST_Buffer(v_zone::extensions.geography,p_buffer_meters)::extensions.geometry END;
 SELECT jsonb_build_object('presentCount',count(*),'completedCount',count(*) FILTER(WHERE EXISTS(SELECT 1 FROM infra.project_asset_links l JOIN btp.inspections i ON i.id=l.inspection_id WHERE l.asset_id=a.id AND l.project_id=p_project_id AND l.realization='completed' AND l.completed_on IS NOT NULL AND i.project_id=p_project_id AND lower(i.status::text) IN ('approved','completed') AND (l.phase_id IS NULL OR i.phase_id=l.phase_id))), 'assetIds',coalesce(jsonb_agg(a.id),'[]'::jsonb),'intersectedLengthMeters',coalesce(sum(CASE WHEN extensions.ST_Dimension(a.geometry)=1 THEN extensions.ST_Length(extensions.ST_Intersection(a.geometry,v_area)::extensions.geography) ELSE 0 END),0),'bufferGeojson',extensions.ST_AsGeoJSON(v_area)::jsonb) INTO v_result FROM infra.assets a WHERE extensions.ST_Intersects(a.geometry,v_area);
 RETURN v_result; END $$;
REVOKE ALL ON FUNCTION public.infra_asset_list(uuid),public.infra_asset_save(uuid,text,text,jsonb,text,uuid),public.infra_asset_delete(uuid,uuid),public.infra_zone_analysis(uuid,jsonb,double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.infra_asset_list(uuid),public.infra_asset_save(uuid,text,text,jsonb,text,uuid),public.infra_asset_delete(uuid,uuid),public.infra_zone_analysis(uuid,jsonb,double precision) TO authenticated,service_role;
NOTIFY pgrst,'reload schema';