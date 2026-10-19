DO $$ DECLARE user_id uuid; project_id uuid; operation_id uuid; cur text; BEGIN
 SELECT p.id,p.currency INTO project_id,cur FROM btp.projects p LIMIT 1;
 SELECT ur.user_id INTO user_id FROM public.user_roles ur WHERE public.has_any_role(ur.user_id,ARRAY['admin','super_admin','administrator']) LIMIT 1;
 IF project_id IS NULL OR user_id IS NULL THEN RAISE NOTICE 'No authorized fixture available'; RETURN; END IF;
 PERFORM set_config('request.jwt.claims',json_build_object('sub',user_id,'role','authenticated')::text,true);
 BEGIN
 INSERT INTO btp.project_operation_entries(project_id,kind,occurred_on,label,quantity,unit,amount,currency,resource_family,context_code) VALUES(project_id,'consumption',current_date,'temporary rule test',2,'h',0,cur,'human','labor') RETURNING id INTO operation_id;
 UPDATE btp.project_operation_entries SET status='validated' WHERE id=operation_id;
 IF NOT EXISTS(SELECT 1 FROM btp.project_operation_entries WHERE id=operation_id AND policy_snapshot IS NOT NULL AND validated_at IS NOT NULL) THEN RAISE EXCEPTION 'Snapshot validation failed'; END IF;
 BEGIN UPDATE btp.project_operation_entries SET quantity=3 WHERE id=operation_id; RAISE EXCEPTION 'Expected immutable rejection missing'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='Expected immutable rejection missing' THEN RAISE; END IF; END;
 UPDATE btp.project_operation_entries SET status='cancelled' WHERE id=operation_id;
 RAISE EXCEPTION 'ROLLBACK_FIXTURE';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'ROLLBACK_FIXTURE' THEN RAISE; END IF; END;
END $$;