-- Migration: 20260823211120_safe_rls_policies.sql
-- Description: Safely create RLS policies only for tables that exist

-- ============================================
-- HELPER: Safe policy creation without dropping
-- ============================================

CREATE OR REPLACE FUNCTION btp.safe_create_policy_if_not_exists(
  p_policy_name text,
  p_schema_name text,
  p_table_name text,
  p_policy_definition text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'btp', 'public'
AS $$
BEGIN
  -- Check if policy already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = p_schema_name 
    AND tablename = p_table_name 
    AND policyname = p_policy_name
  ) THEN
    -- Check if table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_schema_name AND table_name = p_table_name
    ) THEN
      -- Create the policy
      EXECUTE p_policy_definition;
      RAISE NOTICE '✅ Policy "%" created for %.%', p_policy_name, p_schema_name, p_table_name;
    ELSE
      RAISE NOTICE '⚠️ Table %.% does not exist, skipping policy "%"', p_schema_name, p_table_name, p_policy_name;
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Policy "%" already exists on %.%, skipping', p_policy_name, p_schema_name, p_table_name;
  END IF;
END;
$$;

-- ============================================
-- 1. btp.material_suppliers (only if table exists)
-- ============================================

DO $$
BEGIN
  -- Only grant permissions if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'btp' AND table_name = 'material_suppliers'
  ) THEN
    REVOKE ALL ON btp.material_suppliers FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON btp.material_suppliers TO authenticated;
    GRANT ALL ON btp.material_suppliers TO service_role;
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'material_suppliers_read_authenticated',
      'btp',
      'material_suppliers',
      'CREATE POLICY "material_suppliers_read_authenticated" ON btp.material_suppliers FOR SELECT TO authenticated USING (true)'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'material_suppliers_write_managers',
      'btp',
      'material_suppliers',
      'CREATE POLICY "material_suppliers_write_managers" ON btp.material_suppliers FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY[''admin'',''director'',''manager''])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY[''admin'',''director'',''manager'']))'
    );
  END IF;
END $$;

-- ============================================
-- 2. btp.profit_distributions (only if table exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'btp' AND table_name = 'profit_distributions'
  ) THEN
    REVOKE ALL ON btp.profit_distributions FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON btp.profit_distributions TO authenticated;
    GRANT ALL ON btp.profit_distributions TO service_role;
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'profit_distributions_read_own_or_admin',
      'btp',
      'profit_distributions',
      'CREATE POLICY "profit_distributions_read_own_or_admin" ON btp.profit_distributions FOR SELECT TO authenticated USING (recipient_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY[''admin'',''director'']))'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'profit_distributions_write_admin',
      'btp',
      'profit_distributions',
      'CREATE POLICY "profit_distributions_write_admin" ON btp.profit_distributions FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY[''admin'',''director''])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY[''admin'',''director'']))'
    );
  END IF;
END $$;

-- ============================================
-- 3. btp.supply_requests (only if table exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'btp' AND table_name = 'supply_requests'
  ) THEN
    REVOKE ALL ON btp.supply_requests FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON btp.supply_requests TO authenticated;
    GRANT ALL ON btp.supply_requests TO service_role;
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'supply_requests_read_authenticated',
      'btp',
      'supply_requests',
      'CREATE POLICY "supply_requests_read_authenticated" ON btp.supply_requests FOR SELECT TO authenticated USING (true)'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'supply_requests_insert_own',
      'btp',
      'supply_requests',
      'CREATE POLICY "supply_requests_insert_own" ON btp.supply_requests FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid())'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'supply_requests_update_own_or_manager',
      'btp',
      'supply_requests',
      'CREATE POLICY "supply_requests_update_own_or_manager" ON btp.supply_requests FOR UPDATE TO authenticated USING (requested_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY[''admin'',''director'',''manager'']))'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'supply_requests_delete_manager',
      'btp',
      'supply_requests',
      'CREATE POLICY "supply_requests_delete_manager" ON btp.supply_requests FOR DELETE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY[''admin'',''director'',''manager'']))'
    );
  END IF;
END $$;

-- ============================================
-- 4. public.payment_blocks (only if table exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'payment_blocks'
  ) THEN
    REVOKE ALL ON public.payment_blocks FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_blocks TO authenticated;
    GRANT ALL ON public.payment_blocks TO service_role;
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'payment_blocks_read_authenticated',
      'public',
      'payment_blocks',
      'CREATE POLICY "payment_blocks_read_authenticated" ON public.payment_blocks FOR SELECT TO authenticated USING (true)'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'payment_blocks_write_controllers',
      'public',
      'payment_blocks',
      'CREATE POLICY "payment_blocks_write_controllers" ON public.payment_blocks FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY[''admin'',''director'',''manager''])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY[''admin'',''director'',''manager'']))'
    );
  END IF;
END $$;

-- ============================================
-- 5. public.profit_distributions (only if table exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'profit_distributions'
  ) THEN
    REVOKE ALL ON public.profit_distributions FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.profit_distributions TO authenticated;
    GRANT ALL ON public.profit_distributions TO service_role;
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'pub_profit_distributions_read_own_or_admin',
      'public',
      'profit_distributions',
      'CREATE POLICY "pub_profit_distributions_read_own_or_admin" ON public.profit_distributions FOR SELECT TO authenticated USING (recipient_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY[''admin'',''director'']))'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'pub_profit_distributions_write_admin',
      'public',
      'profit_distributions',
      'CREATE POLICY "pub_profit_distributions_write_admin" ON public.profit_distributions FOR ALL TO authenticated USING (public.has_any_role(auth.uid(), ARRAY[''admin'',''director''])) WITH CHECK (public.has_any_role(auth.uid(), ARRAY[''admin'',''director'']))'
    );
  END IF;
END $$;

-- ============================================
-- 6. public.project_risks (only if table exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'project_risks'
  ) THEN
    REVOKE ALL ON public.project_risks FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_risks TO authenticated;
    GRANT ALL ON public.project_risks TO service_role;
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'project_risks_read_authenticated',
      'public',
      'project_risks',
      'CREATE POLICY "project_risks_read_authenticated" ON public.project_risks FOR SELECT TO authenticated USING (true)'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'project_risks_insert_authenticated',
      'public',
      'project_risks',
      'CREATE POLICY "project_risks_insert_authenticated" ON public.project_risks FOR INSERT TO authenticated WITH CHECK (true)'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'project_risks_update_owner_or_manager',
      'public',
      'project_risks',
      'CREATE POLICY "project_risks_update_owner_or_manager" ON public.project_risks FOR UPDATE TO authenticated USING (identified_by = auth.uid() OR owner_id = auth.uid() OR public.has_any_role(auth.uid(), ARRAY[''admin'',''director'',''manager'']))'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'project_risks_delete_manager',
      'public',
      'project_risks',
      'CREATE POLICY "project_risks_delete_manager" ON public.project_risks FOR DELETE TO authenticated USING (identified_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY[''admin'',''director'',''manager'']))'
    );
  END IF;
END $$;

-- ============================================
-- 7. public.supply_requests (only if table exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'supply_requests'
  ) THEN
    REVOKE ALL ON public.supply_requests FROM anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.supply_requests TO authenticated;
    GRANT ALL ON public.supply_requests TO service_role;
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'pub_supply_requests_read_authenticated',
      'public',
      'supply_requests',
      'CREATE POLICY "pub_supply_requests_read_authenticated" ON public.supply_requests FOR SELECT TO authenticated USING (true)'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'pub_supply_requests_insert_own',
      'public',
      'supply_requests',
      'CREATE POLICY "pub_supply_requests_insert_own" ON public.supply_requests FOR INSERT TO authenticated WITH CHECK (requested_by = auth.uid())'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'pub_supply_requests_update_own_or_manager',
      'public',
      'supply_requests',
      'CREATE POLICY "pub_supply_requests_update_own_or_manager" ON public.supply_requests FOR UPDATE TO authenticated USING (requested_by = auth.uid() OR public.has_any_role(auth.uid(), ARRAY[''admin'',''director'',''manager'']))'
    );
    
    PERFORM btp.safe_create_policy_if_not_exists(
      'pub_supply_requests_delete_manager',
      'public',
      'supply_requests',
      'CREATE POLICY "pub_supply_requests_delete_manager" ON public.supply_requests FOR DELETE TO authenticated USING (public.has_any_role(auth.uid(), ARRAY[''admin'',''director'',''manager'']))'
    );
  END IF;
END $$;

-- ============================================
-- 8. Harmonisation des unités du métré (only if table exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'btp' AND table_name = 'quantity_takeoffs'
  ) THEN
    -- Drop constraint if it exists
    ALTER TABLE btp.quantity_takeoffs DROP CONSTRAINT IF EXISTS quantity_takeoffs_unit_check;
    
    -- Add constraint with updated unit list
    ALTER TABLE btp.quantity_takeoffs ADD CONSTRAINT quantity_takeoffs_unit_check CHECK (
      unit IN (
        'm','ml','m2','m²','m3','m³','kg','t','tonne','tonnes','tons',
        'u','unite','unité','piece','pièce','ens','ensemble','forfait','ft',
        'l','litre','litres','sac','sacs','jour','jours','h','heure','heures',
        'mois','an','ans','%','lot','pt','points'
      )
    );
    
    RAISE NOTICE '✅ Unit check constraint updated for btp.quantity_takeoffs';
  ELSE
    RAISE NOTICE '⚠️ Table btp.quantity_takeoffs does not exist, skipping unit constraint update';
  END IF;
END $$;

-- ============================================
-- VERIFICATION (Fixed syntax)
-- ============================================

DO $$
DECLARE
  v_policy_count integer;
  v_total_processed integer := 0;
  v_total_policies integer := 0;
  v_schema_name text;
  v_table_name text;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  
  -- Check all tables from initial SQL using a loop with array
  FOR v_schema_name, v_table_name IN 
    SELECT * FROM (VALUES 
      ('btp'::text, 'material_suppliers'::text),
      ('btp'::text, 'profit_distributions'::text),
      ('btp'::text, 'supply_requests'::text),
      ('public'::text, 'payment_blocks'::text),
      ('public'::text, 'profit_distributions'::text),
      ('public'::text, 'project_risks'::text),
      ('public'::text, 'supply_requests'::text)
    ) AS t(schema_name, table_name)
  LOOP
    SELECT COUNT(*) INTO v_policy_count 
    FROM pg_policies 
    WHERE schemaname = v_schema_name 
    AND tablename = v_table_name;
    
    IF v_policy_count > 0 THEN
      v_total_processed := v_total_processed + 1;
      v_total_policies := v_total_policies + v_policy_count;
      RAISE NOTICE '✅ %.% has % policies', v_schema_name, v_table_name, v_policy_count;
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = v_schema_name AND table_name = v_table_name
    ) THEN
      RAISE NOTICE '⚠️ %.% exists but has 0 policies', v_schema_name, v_table_name;
    ELSE
      RAISE NOTICE 'ℹ️ %.% does not exist in database', v_schema_name, v_table_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 Tables processed: %', v_total_processed;
  RAISE NOTICE '📝 Total policies: %', v_total_policies;
  RAISE NOTICE '========================================';
END $$;