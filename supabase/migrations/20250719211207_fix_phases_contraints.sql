
/**
-- Create function to auto-update timestamp
CREATE OR REPLACE FUNCTION btp.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();  -- Set updated_at to current time
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to phases table
DROP TRIGGER IF EXISTS update_phases_timestamp ON btp.phases;
CREATE TRIGGER update_phases_timestamp
BEFORE UPDATE ON btp.phases
FOR EACH ROW
EXECUTE FUNCTION btp.update_timestamp();

**/