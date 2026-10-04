ALTER TABLE btp.projects ADD COLUMN IF NOT EXISTS forme TEXT;
ALTER TABLE btp.projects ADD COLUMN IF NOT EXISTS localisation JSONB;
ALTER TABLE btp.projects ADD COLUMN IF NOT EXISTS area_sqm NUMERIC;
NOTIFY pgrst, 'reload schema';