
CREATE OR REPLACE FUNCTION btp.generate_tender_secret_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public, btp
AS $$
DECLARE
  characters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION btp.generate_tender_secret_code() TO anon, authenticated, service_role;
