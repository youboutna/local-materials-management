-- Migration: Create locations table
-- Created: 2026-02-16 10:00:00
-- Hash: a1b2c3d4-e5f6-7890-abcd-ef1234567890
-- Description: Create locations table for storing geographic locations (regions and cities)

-- ============================================
-- LOCATIONS TABLE
-- ============================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  type VARCHAR(10) NOT NULL CHECK (type IN ('region', 'city','localite','wilaya','moughataa','commune','jiha')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  parent_code VARCHAR(50),
  economic_importance VARCHAR(50),
  population INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_locations_type ON locations(type);
CREATE INDEX idx_locations_code ON locations(code);
CREATE INDEX idx_locations_parent_code ON locations(parent_code);
CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude);

-- ============================================
-- CONSTRAINTS
-- ============================================
-- Ensure parent_code references a region when type is 'city'
ALTER TABLE locations ADD CONSTRAINT fk_locations_parent_code
  FOREIGN KEY (parent_code) REFERENCES locations(code)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Ensure coordinates are valid (latitude between -90 and 90, longitude between -180 and 180)
ALTER TABLE locations ADD CONSTRAINT chk_latitude_range
  CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));
ALTER TABLE locations ADD CONSTRAINT chk_longitude_range
  CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

-- ============================================
-- TRIGGER FOR AUTO-UPDATING updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_location_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_location_updated_at();
