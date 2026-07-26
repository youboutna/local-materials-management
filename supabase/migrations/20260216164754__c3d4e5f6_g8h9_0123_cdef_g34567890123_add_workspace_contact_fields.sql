-- Migration: Add contact fields to workspaces table
-- Created: 2026-02-16 16:47:54
-- Hash: c3d4e5f6-g8h9-0123-cdef-g34567890123
-- Description: Add contact_manager and contact_phone fields to workspaces table

-- ============================================
-- ADD CONTACT FIELDS TO WORKSPACES TABLE
-- ============================================

-- Add contact_manager field (TEXT)
ALTER TABLE workspaces ADD COLUMN contact_manager TEXT;

-- Add contact_phone field (TEXT)
ALTER TABLE workspaces ADD COLUMN contact_phone TEXT;

-- Add location field (TEXT) - was missing from original table
ALTER TABLE workspaces ADD COLUMN location TEXT;

-- Add status field (TEXT) - was missing from original table, will map to is_active
ALTER TABLE workspaces ADD COLUMN status TEXT DEFAULT 'active';

-- Add capacity field (INTEGER)
ALTER TABLE workspaces ADD COLUMN capacity INTEGER;

-- Add facilities field (TEXT[])
ALTER TABLE workspaces ADD COLUMN facilities TEXT[];

-- ============================================
-- UPDATE EXISTING DATA
-- ============================================

-- Set default status based on is_active
UPDATE workspaces SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END WHERE status IS NULL;

-- ============================================
-- CONSTRAINTS
-- ============================================

-- Ensure status is valid
ALTER TABLE workspaces ADD CONSTRAINT chk_workspaces_status
  CHECK (status IN ('active', 'inactive', 'closed'));

-- Ensure capacity is non-negative
ALTER TABLE workspaces ADD CONSTRAINT chk_workspaces_capacity_positive
  CHECK (capacity IS NULL OR capacity >= 0);
