-- Migration: Add missing columns to materials table
-- Created: 2026-02-16 16:38:35
-- Hash: b2c3d4e5-f6g7-8901-bcde-f234567890ab
-- Description: Add last_restock, material_status, and min_quantity columns to materials table

-- ============================================
-- ADD COLUMNS TO MATERIALS TABLE
-- ============================================

-- Add last_restock column (TIMESTAMP WITH TIME ZONE)
ALTER TABLE btp.materials ADD COLUMN last_restock TIMESTAMP WITH TIME ZONE;

-- Add material_status column (VARCHAR with enum-like constraint)
ALTER TABLE btp.materials ADD COLUMN material_status VARCHAR(50) CHECK (material_status IN ('active', 'inactive', 'discontinued', 'pending'));

-- Add min_quantity column (INTEGER)
ALTER TABLE btp.materials ADD COLUMN min_quantity INTEGER DEFAULT 0;

-- ============================================
-- INDEXES (if needed for performance)
-- ============================================

-- Index for material_status if frequently queried
CREATE INDEX idx_materials_status ON materials(material_status);

-- Index for last_restock if frequently queried
CREATE INDEX idx_materials_last_restock ON materials(last_restock);

-- ============================================
-- CONSTRAINTS
-- ============================================

-- Ensure min_quantity is non-negative
ALTER TABLE btp.materials ADD CONSTRAINT chk_min_quantity_positive
  CHECK (min_quantity IS NULL OR min_quantity >= 0);
