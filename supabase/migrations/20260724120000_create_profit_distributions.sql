-- Migration: 20260824120000_create_profit_distributions.sql
-- Description: Create profit_distributions table in btp schema with policies

-- ============================================
-- PART 1: Create profit_distributions table if it doesn't exist
-- ============================================

DO $$
BEGIN
  -- Check if table exists in btp schema
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'btp' AND table_name = 'profit_distributions'
  ) THEN
    -- Check if table exists in public schema
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'profit_distributions'
    ) THEN
      -- Copy table structure from public
      CREATE TABLE btp.profit_distributions (LIKE public.profit_distributions INCLUDING ALL);
      
      -- Copy data
      INSERT INTO btp.profit_distributions 
      SELECT * FROM public.profit_distributions 
      ON CONFLICT DO NOTHING;
      
      RAISE NOTICE '✅ Table btp.profit_distributions created from public schema';
    ELSE
      -- Create table from scratch if it doesn't exist in public either
      CREATE TABLE btp.profit_distributions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_id UUID NOT NULL,
        mission_id UUID,
        amount DECIMAL(10,2) NOT NULL,
        distribution_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(50) DEFAULT 'pending',
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      RAISE NOTICE '✅ Table btp.profit_distributions created from scratch';
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️ Table btp.profit_distributions already exists, skipping creation';
  END IF;
END $$;

-- ============================================
-- PART 2: Enable RLS
-- ============================================

ALTER TABLE btp.profit_distributions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: Grant permissions
-- ============================================

REVOKE ALL ON btp.profit_distributions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.profit_distributions TO authenticated;
GRANT ALL ON btp.profit_distributions TO service_role;

-- ============================================
-- PART 4: Create policies
-- ============================================

DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "profit_distributions_read_own_or_admin" ON btp.profit_distributions;
  DROP POLICY IF EXISTS "profit_distributions_write_admin" ON btp.profit_distributions;
  
  -- Create read policy
  CREATE POLICY "profit_distributions_read_own_or_admin" ON btp.profit_distributions
  FOR SELECT TO authenticated
  USING (
    recipient_id = auth.uid() 
    OR public.has_any_role(auth.uid(), ARRAY['admin','director'])
  );
  
  -- Create write policy
  CREATE POLICY "profit_distributions_write_admin" ON btp.profit_distributions
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','director']))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','director']));
  
  RAISE NOTICE '✅ Policies created for btp.profit_distributions';
END $$;

-- ============================================
-- PART 5: Create updated_at trigger
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' 
    AND table_name = 'profit_distributions' 
    AND column_name = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS set_updated_at ON btp.profit_distributions;
    CREATE TRIGGER set_updated_at 
    BEFORE UPDATE ON btp.profit_distributions 
    FOR EACH ROW 
    EXECUTE FUNCTION btp.update_updated_at_column();
    
    RAISE NOTICE '✅ Trigger created for btp.profit_distributions';
  END IF;
END $$;

-- ============================================
-- PART 6: Verification
-- ============================================

DO $$
DECLARE
  table_exists boolean;
  policy_count integer;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'btp' AND table_name = 'profit_distributions'
  ) INTO table_exists;
  
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE schemaname = 'btp' AND tablename = 'profit_distributions';
  
  IF table_exists THEN
    RAISE NOTICE '✅ profit_distributions table exists in btp schema';
    RAISE NOTICE '✅ % policies created', policy_count;
  ELSE
    RAISE NOTICE '❌ Table creation failed!';
  END IF;
END $$;