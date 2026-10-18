INSERT INTO btp.referential_items(domain,code,label_fr,label_ar,label_en,is_custom,is_active,metadata)
SELECT 'operation_context',v.code,v.fr,v.ar,v.en,false,true,v.rules||jsonb_build_object('version','1.0.0','mandatory',true)
FROM (VALUES
('unreconciled','À rapprocher','غير مطابق','Unreconciled','{"allowValidation":false}'::jsonb),
('purchase','Achat / expression de besoin','شراء / طلب احتياج','Purchase / requirement','{"requiresLine":true,"kinds":["consumption"]}'::jsonb),
('stock_usage','Utilisation de stock','استخدام المخزون','Stock usage','{"requiresResource":true,"kinds":["consumption"]}'::jsonb),
('labor','Travail effectué','العمل المنجز','Work performed','{"kinds":["consumption"],"family":"human"}'::jsonb),
('equipment_usage','Utilisation d’équipement','استخدام المعدات','Equipment usage','{"kinds":["consumption"],"family":"equipment"}'::jsonb),
('invoice_link','Facture / décompte existant','فاتورة / كشف موجود','Existing invoice / progress invoice','{"requiresLine":true,"kinds":["expense"]}'::jsonb),
('customer_receipt','Encaissement client','تحصيل العميل','Customer receipt','{"requiresLine":true,"kinds":["revenue"],"perspective":"contractor","documentTypes":["facture","invoice"]}'::jsonb)
) v(code,fr,ar,en,rules)
WHERE NOT EXISTS (SELECT 1 FROM btp.referential_items r WHERE r.domain='operation_context' AND r.code=v.code AND r.project_id IS NULL);
CREATE OR REPLACE FUNCTION btp.validate_operation_context() RETURNS trigger LANGUAGE plpgsql SET search_path=btp,pg_temp AS $$ DECLARE policy record; doc_type text; matched boolean:=false; BEGIN
 IF NEW.status<>'validated' THEN RETURN NEW; END IF;
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