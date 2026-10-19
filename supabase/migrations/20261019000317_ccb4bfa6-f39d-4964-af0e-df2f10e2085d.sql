CREATE OR REPLACE FUNCTION btp.validate_operation_context() RETURNS trigger LANGUAGE plpgsql SET search_path=btp,pg_temp AS $$ DECLARE policy record; doc_type text; matched boolean:=false; BEGIN
 IF NEW.status<>'validated' OR (TG_OP='UPDATE' AND OLD.status='validated') THEN RETURN NEW; END IF;
 FOR policy IN SELECT metadata FROM btp.referential_items WHERE domain='operation_context' AND code=NEW.context_code AND is_active AND (project_id IS NULL OR project_id=NEW.project_id) LOOP
 matched:=true;
 IF coalesce((policy.metadata->>'allowValidation')::boolean,true)=false THEN RAISE EXCEPTION 'Context cannot be validated'; END IF;
 IF policy.metadata ? 'kinds' AND NOT (policy.metadata->'kinds' ? NEW.kind) THEN RAISE EXCEPTION 'Context does not support operation kind'; END IF;
 IF coalesce((policy.metadata->>'requiresLine')::boolean,false) AND NEW.source_line_id IS NULL THEN RAISE EXCEPTION 'Select an existing document line'; END IF;
 IF coalesce((policy.metadata->>'requiresResource')::boolean,false) AND NEW.resource_id IS NULL THEN RAISE EXCEPTION 'Select an existing resource'; END IF;
 IF policy.metadata ? 'family' AND NEW.resource_family IS DISTINCT FROM policy.metadata->>'family' THEN RAISE EXCEPTION 'Context requires matching resource family'; END IF;
 IF policy.metadata ? 'perspective' AND NEW.perspective IS DISTINCT FROM policy.metadata->>'perspective' THEN RAISE EXCEPTION 'Context requires matching perspective'; END IF;
 IF policy.metadata ? 'documentTypes' THEN SELECT coalesce(document_type,dqe_type) INTO doc_type FROM btp.boq_lines WHERE id=NEW.source_line_id; IF NOT coalesce(policy.metadata->'documentTypes' ? doc_type,false) THEN RAISE EXCEPTION 'Incompatible source document type'; END IF; END IF;
 END LOOP;
 IF NOT matched THEN RAISE EXCEPTION 'Unknown or inactive operation context'; END IF;
 RETURN NEW; END $$;