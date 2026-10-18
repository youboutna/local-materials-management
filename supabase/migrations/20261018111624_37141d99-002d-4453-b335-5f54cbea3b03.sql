CREATE OR REPLACE FUNCTION public.validate_project_workbench_record() RETURNS trigger LANGUAGE plpgsql SET search_path=public,btp,infra AS $$ BEGIN
 IF NEW.phase_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM btp.project_phases p WHERE p.id=NEW.phase_id AND p.project_id=NEW.project_id) THEN RAISE EXCEPTION 'Phase does not belong to project'; END IF;
 IF TG_TABLE_SCHEMA='infra' AND TG_TABLE_NAME='project_asset_links' THEN
 IF NEW.realization='completed' AND (NEW.completed_on IS NULL OR NEW.inspection_id IS NULL OR NOT EXISTS(SELECT 1 FROM btp.inspections i WHERE i.id=NEW.inspection_id AND i.project_id=NEW.project_id AND lower(i.status::text) IN ('approved','completed') AND (NEW.phase_id IS NULL OR i.phase_id=NEW.phase_id))) THEN RAISE EXCEPTION 'Completed infrastructure requires approved project inspection and completion date'; END IF;
 ELSE
 IF NEW.task_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM btp.task_assignments t WHERE t.id=NEW.task_id AND t.project_id=NEW.project_id) THEN RAISE EXCEPTION 'Task does not belong to project'; END IF;
 IF NEW.currency<>(SELECT currency FROM btp.projects WHERE id=NEW.project_id) THEN RAISE EXCEPTION 'Operation currency must match project currency'; END IF;
 END IF;
 NEW.updated_at=now(); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.validate_project_workbench_record() FROM PUBLIC,anon;
CREATE OR REPLACE FUNCTION public.infra_zone_analysis(p_project_id uuid,p_zone jsonb,p_buffer_meters double precision DEFAULT 0) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public,infra,extensions,btp AS $$ DECLARE v_zone extensions.geometry; v_area extensions.geometry; v_piece extensions.geometry; v_feature jsonb; v_radius double precision; v_result jsonb; BEGIN
 IF NOT public.project_workbench_access(p_project_id,false) THEN RAISE EXCEPTION 'Project access denied'; END IF;
 IF p_buffer_meters IS NULL OR p_buffer_meters<0 OR p_buffer_meters>100000 OR p_buffer_meters::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid metric buffer'; END IF;
 IF p_zone->>'type'='FeatureCollection' THEN
 FOR v_feature IN SELECT value FROM jsonb_array_elements(p_zone->'features') LOOP
 v_piece=extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON((v_feature->'geometry')::text),4326);
 IF v_feature->'properties'->>'shape'='circle' THEN
 v_radius=(v_feature->'properties'->>'radiusMeters')::double precision;
 IF v_radius IS NULL OR v_radius<=0 OR v_radius>100000 OR v_radius::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid circle radius'; END IF;
 v_piece=extensions.ST_Buffer(v_piece::extensions.geography,v_radius)::extensions.geometry;
 END IF;
 IF NOT extensions.ST_IsValid(v_piece) OR extensions.ST_IsEmpty(v_piece) THEN RAISE EXCEPTION 'Invalid project zone'; END IF;
 v_zone=CASE WHEN v_zone IS NULL THEN v_piece ELSE extensions.ST_Union(v_zone,v_piece) END;
 END LOOP;
 ELSE v_zone=extensions.ST_UnaryUnion(extensions.ST_SetSRID(extensions.ST_GeomFromGeoJSON(p_zone::text),4326)); END IF;
 IF v_zone IS NULL OR NOT extensions.ST_IsValid(v_zone) OR extensions.ST_IsEmpty(v_zone) THEN RAISE EXCEPTION 'Invalid project zone'; END IF;
 v_area=CASE WHEN p_buffer_meters=0 THEN v_zone ELSE extensions.ST_Buffer(v_zone::extensions.geography,p_buffer_meters)::extensions.geometry END;
 SELECT jsonb_build_object('presentCount',count(*),'completedCount',count(*) FILTER(WHERE EXISTS(SELECT 1 FROM infra.project_asset_links l JOIN btp.inspections i ON i.id=l.inspection_id WHERE l.asset_id=a.id AND l.project_id=p_project_id AND l.realization='completed' AND l.completed_on IS NOT NULL AND i.project_id=p_project_id AND lower(i.status::text) IN ('approved','completed') AND (l.phase_id IS NULL OR i.phase_id=l.phase_id))), 'assetIds',coalesce(jsonb_agg(a.id),'[]'::jsonb),'intersectedLengthMeters',coalesce(sum(CASE WHEN extensions.ST_Dimension(a.geometry)=1 THEN extensions.ST_Length(extensions.ST_CollectionExtract(extensions.ST_Intersection(a.geometry,v_area),2)::extensions.geography) ELSE 0 END),0),'bufferGeojson',extensions.ST_AsGeoJSON(v_area)::jsonb) INTO v_result FROM infra.assets a WHERE extensions.ST_Intersects(a.geometry,v_area);
 RETURN v_result; END $$;
CREATE FUNCTION public.infra_realization_save(p_project_id uuid,p_asset_id uuid,p_realization text,p_inspection_id uuid DEFAULT NULL,p_completed_on date DEFAULT NULL,p_phase_id uuid DEFAULT NULL) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,infra AS $$ DECLARE v_id uuid; BEGIN
 IF NOT public.project_workbench_access(p_project_id,true) THEN RAISE EXCEPTION 'Project access denied'; END IF;
 INSERT INTO infra.project_asset_links(asset_id,project_id,phase_id,realization,inspection_id,completed_on) VALUES(p_asset_id,p_project_id,p_phase_id,p_realization,p_inspection_id,p_completed_on) ON CONFLICT(asset_id,project_id) DO UPDATE SET phase_id=excluded.phase_id,realization=excluded.realization,inspection_id=excluded.inspection_id,completed_on=excluded.completed_on RETURNING id INTO v_id;
 RETURN v_id; END $$;
REVOKE ALL ON FUNCTION public.infra_realization_save(uuid,uuid,text,uuid,date,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.infra_realization_save(uuid,uuid,text,uuid,date,uuid) TO authenticated,service_role;
NOTIFY pgrst,'reload schema';