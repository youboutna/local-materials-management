-- Add missing location-related fields to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS geographic_zone TEXT,
ADD COLUMN IF NOT EXISTS terrain_type TEXT,
ADD COLUMN IF NOT EXISTS environmental_constraints TEXT,
ADD COLUMN IF NOT EXISTS has_utilities BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requires_permits BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN projects.geographic_zone IS 'Zone géographique du projet';
COMMENT ON COLUMN projects.terrain_type IS 'Type de terrain du projet';
COMMENT ON COLUMN projects.environmental_constraints IS 'Contraintes environnementales du projet';
COMMENT ON COLUMN projects.has_utilities IS 'Raccordements aux réseaux disponibles';
COMMENT ON COLUMN projects.requires_permits IS 'Permis spéciaux requis';