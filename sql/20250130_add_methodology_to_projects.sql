-- Add methodology field to projects table
-- Migration: 20250130_add_methodology_to_projects.sql

ALTER TABLE projects 
ADD COLUMN methodology TEXT NULL;

-- Add comment
COMMENT ON COLUMN projects.methodology IS 'Project methodology: waterfall, agile, hybrid, etc.';
