
DO $mig$
DECLARE
  t text;
  r record;
  cnt bigint;
  col_list text;
  has_col boolean;
  tables text[] := ARRAY[
    -- Lot 3
    'inspection_pvs','inspection_documents','supplier_inspections',
    'supplier_payments','payment_blocks','profit_distributions',
    -- Lot 4
    'price_references','price_calculations','price_revaluation_logs',
    'stock_thresholds','stock_alerts','form_templates',
    'escalation_thresholds','import_forecasts','supply_requests',
    'distance_matrix','locations',
    -- Lot 5
    'notifications','email_logs','email_templates','contact_messages',
    'scheduled_calls','complaints','danger_reports',
    'prospect_subscription_requests','subscriptions',
    'supplier_viewed_items','processing_logs'
  ];
BEGIN
  -- 1. Créer les tables
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('CREATE TABLE IF NOT EXISTS btp.%I (LIKE public.%I INCLUDING ALL)', t, t);
  END LOOP;

  -- 2. Copier les données (colonnes non-générées uniquement)
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('SELECT count(*) FROM btp.%I', t) INTO cnt;
    IF cnt = 0 THEN
      SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
        INTO col_list
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name=t AND is_generated='NEVER';
      EXECUTE format('INSERT INTO btp.%I (%s) SELECT %s FROM public.%I', t, col_list, col_list, t);
    END IF;
  END LOOP;

  -- 3. GRANTs + RLS
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON btp.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON btp.%I TO service_role', t);
    EXECUTE format('ALTER TABLE btp.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;

  -- 4. Recopier les policies
  FOR r IN
    SELECT * FROM pg_policies
    WHERE schemaname='public' AND tablename = ANY(tables)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I', r.policyname, r.tablename);
    EXECUTE format(
      'CREATE POLICY %I ON btp.%I AS %s FOR %s TO %s %s %s',
      r.policyname, r.tablename, r.permissive, r.cmd,
      array_to_string(r.roles::text[], ','),
      CASE WHEN r.qual IS NOT NULL THEN 'USING ('||r.qual||')' ELSE '' END,
      CASE WHEN r.with_check IS NOT NULL THEN 'WITH CHECK ('||r.with_check||')' ELSE '' END
    );
  END LOOP;

  -- 5. Triggers updated_at
  FOREACH t IN ARRAY tables LOOP
    SELECT EXISTS(
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='btp' AND table_name=t AND column_name='updated_at'
    ) INTO has_col;
    IF has_col THEN
      EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON btp.%I', t);
      EXECUTE format(
        'CREATE TRIGGER set_updated_at BEFORE UPDATE ON btp.%I FOR EACH ROW EXECUTE FUNCTION btp.update_updated_at_column()',
        t
      );
    END IF;
  END LOOP;
END $mig$;

-- Refactor fonctions SECURITY DEFINER Lot 3 & 4
CREATE OR REPLACE FUNCTION btp.get_escalation_thresholds(threshold_type_param text)
 RETURNS TABLE(threshold_name text, threshold_value numeric, threshold_unit text, severity_level text, escalation_level integer, description text)
 LANGUAGE sql SECURITY DEFINER SET search_path TO 'btp', 'public'
AS $function$
    SELECT threshold_name, threshold_value, threshold_unit,
           severity_level, escalation_level, description
    FROM btp.escalation_thresholds
    WHERE threshold_type = threshold_type_param AND is_active = true
    ORDER BY threshold_value ASC;
$function$;

CREATE OR REPLACE FUNCTION btp.increment_template_usage(template_id uuid)
 RETURNS void
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'btp', 'public'
AS $function$
BEGIN
  UPDATE btp.form_templates SET usage_count = usage_count + 1 WHERE id = template_id;
END;
$function$;
