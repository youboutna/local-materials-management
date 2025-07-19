-- Fix the tenders table enhancement (correcting the typo)
DO $$
BEGIN
    -- Add missing columns to tenders table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'tender_number') THEN
        ALTER TABLE public.tenders ADD COLUMN tender_number TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'publication_date') THEN
        ALTER TABLE public.tenders ADD COLUMN publication_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'deadline_date') THEN
        ALTER TABLE public.tenders ADD COLUMN deadline_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'budget_min') THEN
        ALTER TABLE public.tenders ADD COLUMN budget_min NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'budget_max') THEN
        ALTER TABLE public.tenders ADD COLUMN budget_max NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'evaluation_criteria') THEN
        ALTER TABLE public.tenders ADD COLUMN evaluation_criteria JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'eligibility_requirements') THEN
        ALTER TABLE public.tenders ADD COLUMN eligibility_requirements JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'contract_duration') THEN
        ALTER TABLE public.tenders ADD COLUMN contract_duration INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'award_criteria') THEN
        ALTER TABLE public.tenders ADD COLUMN award_criteria TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'tender_category') THEN
        ALTER TABLE public.tenders ADD COLUMN tender_category TEXT;
    END IF;
END $$;