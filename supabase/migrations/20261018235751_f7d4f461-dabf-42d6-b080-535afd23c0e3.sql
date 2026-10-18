CREATE OR REPLACE FUNCTION btp.validate_operation_context() RETURNS trigger LANGUAGE plpgsql SET search_path=btp,pg_temp AS $$ DECLARE doc_type text; doc_status text; BEGIN
 IF NEW.status<>'validated' THEN RETURN NEW; END IF;
 IF NEW.context_code IN ('purchase','invoice_link','customer_receipt') AND NEW.source_line_id IS NULL THEN RAISE EXCEPTION 'Select an existing document line'; END IF;
 IF NEW.context_code='stock_usage' AND NEW.resource_id IS NULL THEN RAISE EXCEPTION 'Select an existing resource'; END IF;
 IF NEW.context_code='customer_receipt' THEN
 IF NEW.kind<>'revenue' OR NEW.perspective<>'contractor' THEN RAISE EXCEPTION 'Customer receipt requires contractor revenue perspective'; END IF;
 SELECT coalesce(document_type,dqe_type),business_status INTO doc_type,doc_status FROM btp.boq_lines WHERE id=NEW.source_line_id;
 IF doc_type IS DISTINCT FROM 'facture' AND doc_type IS DISTINCT FROM 'invoice' THEN RAISE EXCEPTION 'Receipt must reference a customer invoice'; END IF;
 END IF;
 RETURN NEW; END $$;
CREATE TRIGGER validate_operation_context BEFORE INSERT OR UPDATE ON btp.project_operation_entries FOR EACH ROW EXECUTE FUNCTION btp.validate_operation_context();