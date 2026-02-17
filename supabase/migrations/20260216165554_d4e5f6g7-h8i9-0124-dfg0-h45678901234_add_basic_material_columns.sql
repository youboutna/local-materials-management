-- Migration: Add missing basic columns to materials table
-- Created: 2026-02-16 16:55:54
-- Hash: d4e5f6g7-h8i9-0124-dfg0-h45678901234
-- Description: Add all missing basic columns to materials table for proper material management

-- ============================================
-- ADD MISSING BASIC COLUMNS TO MATERIALS TABLE
-- ============================================

DO $$
BEGIN
    -- Basic material information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'name') THEN
        ALTER TABLE public.materials ADD COLUMN name TEXT NOT NULL DEFAULT '';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'description') THEN
        ALTER TABLE public.materials ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'category') THEN
        ALTER TABLE public.materials ADD COLUMN category TEXT NOT NULL DEFAULT 'construction';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'subcategory') THEN
        ALTER TABLE public.materials ADD COLUMN subcategory TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'unit') THEN
        ALTER TABLE public.materials ADD COLUMN unit TEXT DEFAULT 'pieces';
    END IF;

    -- Inventory columns (the main issue - quantity column missing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'quantity') THEN
        ALTER TABLE public.materials ADD COLUMN quantity NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'price_per_unit') THEN
        ALTER TABLE public.materials ADD COLUMN price_per_unit NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'available_quantity') THEN
        ALTER TABLE public.materials ADD COLUMN available_quantity NUMERIC DEFAULT 0;
    END IF;

    -- Location and workspace
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'workspace_id') THEN
        ALTER TABLE public.materials ADD COLUMN workspace_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'origin_location') THEN
        ALTER TABLE public.materials ADD COLUMN origin_location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'adresse') THEN
        ALTER TABLE public.materials ADD COLUMN adresse TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'forme') THEN
        ALTER TABLE public.materials ADD COLUMN forme TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'localisation') THEN
        ALTER TABLE public.materials ADD COLUMN localisation JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'coordinates_latitude') THEN
        ALTER TABLE public.materials ADD COLUMN coordinates_latitude NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'coordinates_longitude') THEN
        ALTER TABLE public.materials ADD COLUMN coordinates_longitude NUMERIC;
    END IF;

    -- Product identifiers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'gtin') THEN
        ALTER TABLE public.materials ADD COLUMN gtin TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'sku') THEN
        ALTER TABLE public.materials ADD COLUMN sku TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'ean') THEN
        ALTER TABLE public.materials ADD COLUMN ean TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'asin') THEN
        ALTER TABLE public.materials ADD COLUMN asin TEXT;
    END IF;

    -- Media and content
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'image') THEN
        ALTER TABLE public.materials ADD COLUMN image TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'multilang_labels') THEN
        ALTER TABLE public.materials ADD COLUMN multilang_labels JSONB DEFAULT '{}';
    END IF;

    -- Supplier and timeline
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'supplier') THEN
        ALTER TABLE public.materials ADD COLUMN supplier JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'timeline') THEN
        ALTER TABLE public.materials ADD COLUMN timeline JSONB;
    END IF;

    -- Tags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'tags') THEN
        ALTER TABLE public.materials ADD COLUMN tags JSONB DEFAULT '[]';
    END IF;
END $$;

-- ============================================
-- CONSTRAINTS
-- ============================================

-- Ensure positive quantities
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_materials_quantity_positive') THEN
        ALTER TABLE public.materials ADD CONSTRAINT chk_materials_quantity_positive
          CHECK (quantity IS NULL OR quantity >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_materials_available_quantity_positive') THEN
        ALTER TABLE public.materials ADD CONSTRAINT chk_materials_available_quantity_positive
          CHECK (available_quantity IS NULL OR available_quantity >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'chk_materials_price_positive') THEN
        ALTER TABLE public.materials ADD CONSTRAINT chk_materials_price_positive
          CHECK (price_per_unit IS NULL OR price_per_unit >= 0);
    END IF;
END $$;

-- ============================================
-- INDEXES (if needed for performance)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'materials' AND indexname = 'idx_materials_category') THEN
        CREATE INDEX idx_materials_category ON public.materials(category);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'materials' AND indexname = 'idx_materials_workspace_id') THEN
        CREATE INDEX idx_materials_workspace_id ON public.materials(workspace_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'materials' AND indexname = 'idx_materials_sku') THEN
        CREATE INDEX idx_materials_sku ON public.materials(sku);
    END IF;
END $$;
