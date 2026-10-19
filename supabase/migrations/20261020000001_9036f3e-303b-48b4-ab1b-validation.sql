--# This migration adds validation for operation quantities based on referential items.--
UPDATE btp.referential_items SET metadata=metadata||'{"matchSourceUnit":true,"limitSourceQuantity":true}'::jsonb WHERE domain='operation_context' AND code='purchase' AND project_id IS NULL;
CREATE OR REPLACE FUNCTION btp.validate_operation_quantities() RETURNS trigger LANGUAGE plpgsql SET search_path=btp,pg_temp AS $$ DECLARE policy record; source_unit text; source_quantity numeric; consumed numeric; BEGIN
 IF NEW.status<>'validated' OR (TG_OP='UPDATE' AND OLD.status='validated') OR NEW.source_line_id IS NULL THEN RETURN NEW; END IF;
 SELECT unit,quantity INTO source_unit,source_quantity FROM btp.boq_lines WHERE id=NEW.source_line_id FOR UPDATE;
 FOR policy IN SELECT metadata FROM btp.referential_items WHERE domain='operation_context' AND code=NEW.context_code AND is_active AND (project_id IS NULL OR project_id=NEW.project_id) LOOP
 IF coalesce((policy.metadata->>'matchSourceUnit')::boolean,false) AND NEW.unit IS DISTINCT FROM source_unit THEN RAISE EXCEPTION 'Consumption unit differs from source'; END IF;
 IF coalesce((policy.metadata->>'limitSourceQuantity')::boolean,false) THEN
 SELECT coalesce(sum(quantity),0) INTO consumed FROM btp.project_operation_entries WHERE project_id=NEW.project_id AND source_line_id=NEW.source_line_id AND status='validated' AND kind='consumption' AND id<>NEW.id;
 IF consumed+NEW.quantity>source_quantity THEN RAISE EXCEPTION 'Consumption exceeds remaining source quantity'; END IF;
 END IF;
 END LOOP;
 RETURN NEW; END $$;
CREATE TRIGGER validate_operation_quantities BEFORE INSERT OR UPDATE ON btp.project_operation_entries FOR EACH ROW EXECUTE FUNCTION btp.validate_operation_quantities();