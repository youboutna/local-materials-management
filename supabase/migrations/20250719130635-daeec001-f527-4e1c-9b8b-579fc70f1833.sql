-- Core Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en attente' CHECK (status IN ('en cours', 'terminé', 'en attente', 'suspendu', 'annulé')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    budget NUMERIC NOT NULL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    thumbnail TEXT DEFAULT '/img/project-placeholder.jpg',
    team_size INTEGER NOT NULL DEFAULT 1,
    coordinates_latitude NUMERIC,
    coordinates_longitude NUMERIC,
    project_order INTEGER,
    financing_source TEXT,
    market_type TEXT,
    selection_mode TEXT,
    launch_date TIMESTAMP WITH TIME ZONE,
    attribution_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    project_reference TEXT,
    project_responsable_id UUID,
    main_contractor TEXT,
    allows_initial_payment BOOLEAN DEFAULT FALSE,
    initial_payment_percentage NUMERIC DEFAULT 0,
    current_phase TEXT,
    current_stage TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Phases Table
CREATE TABLE IF NOT EXISTS public.project_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    phase_type TEXT NOT NULL CHECK (phase_type IN ('standard', 'custom')),
    phase_name TEXT,
    stage_name TEXT,
    custom_phase_number INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    estimated_duration INTEGER,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
    budget NUMERIC DEFAULT 0,
    actual_cost NUMERIC DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    location TEXT,
    notes TEXT,
    custom_stages JSONB DEFAULT '[]',
    materials JSONB DEFAULT '[]',
    human_resources JSONB DEFAULT '[]',
    suppliers JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced Materials Table
DO $$
BEGIN
    -- Add missing columns to materials table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'supplier_id') THEN
        ALTER TABLE public.materials ADD COLUMN supplier_id UUID REFERENCES public.suppliers(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'material_code') THEN
        ALTER TABLE public.materials ADD COLUMN material_code TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'minimum_stock') THEN
        ALTER TABLE public.materials ADD COLUMN minimum_stock NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'maximum_stock') THEN
        ALTER TABLE public.materials ADD COLUMN maximum_stock NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'lead_time_days') THEN
        ALTER TABLE public.materials ADD COLUMN lead_time_days INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'quality_grade') THEN
        ALTER TABLE public.materials ADD COLUMN quality_grade TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'technical_specifications') THEN
        ALTER TABLE public.materials ADD COLUMN technical_specifications JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'material_status') THEN
        ALTER TABLE public.materials ADD COLUMN material_status TEXT DEFAULT 'active' CHECK (material_status IN ('active', 'discontinued', 'pending'));
    END IF;
END $$;

-- Enhanced Suppliers Table
DO $$
BEGIN
    -- Add missing columns to suppliers table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'business_registration') THEN
        ALTER TABLE public.suppliers ADD COLUMN business_registration TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'tax_number') THEN
        ALTER TABLE public.suppliers ADD COLUMN tax_number TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'bank_details') THEN
        ALTER TABLE public.suppliers ADD COLUMN bank_details JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'certifications') THEN
        ALTER TABLE public.suppliers ADD COLUMN certifications JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'delivery_zones') THEN
        ALTER TABLE public.suppliers ADD COLUMN delivery_zones JSONB DEFAULT '[]';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'payment_terms') THEN
        ALTER TABLE public.suppliers ADD COLUMN payment_terms TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'performance_score') THEN
        ALTER TABLE public.suppliers ADD COLUMN performance_score NUMERIC CHECK (performance_score >= 0 AND performance_score <= 10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'last_contract_date') THEN
        ALTER TABLE public.suppliers ADD COLUMN last_contract_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'preferred_supplier') THEN
        ALTER TABLE public.suppliers ADD COLUMN preferred_supplier BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Enhanced Tenders Table
DO $$
BEGIN
    -- Add missing columns to tenders table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'tender_number') THEN
        ALTER TABLE public.tenders ADD COLUMN tender_number TEXT UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_name = 'publication_date') THEN
        ALTER TABLE public.tenders ADD COLUMN publication_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tenders' AND column_number = 'deadline_date') THEN
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

-- Enhanced Documents Table
DO $$
BEGIN
    -- Add missing columns to documents table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'document_version') THEN
        ALTER TABLE public.documents ADD COLUMN document_version TEXT DEFAULT '1.0';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'parent_document_id') THEN
        ALTER TABLE public.documents ADD COLUMN parent_document_id UUID REFERENCES public.documents(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'expiry_date') THEN
        ALTER TABLE public.documents ADD COLUMN expiry_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'approval_status') THEN
        ALTER TABLE public.documents ADD COLUMN approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'under_review'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'approved_by') THEN
        ALTER TABLE public.documents ADD COLUMN approved_by UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'approval_date') THEN
        ALTER TABLE public.documents ADD COLUMN approval_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'document_hash') THEN
        ALTER TABLE public.documents ADD COLUMN document_hash TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'access_level') THEN
        ALTER TABLE public.documents ADD COLUMN access_level TEXT DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'confidential', 'restricted'));
    END IF;
END $$;