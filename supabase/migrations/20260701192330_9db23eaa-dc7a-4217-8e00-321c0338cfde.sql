-- Public read access for the supplier portal (unauthenticated visitors).
-- Only tenders that are actively open for bidding are exposed.

GRANT USAGE ON SCHEMA btp TO anon;
GRANT SELECT ON btp.tenders TO anon;
GRANT SELECT ON public.tenders TO anon;

DROP POLICY IF EXISTS "Anonymous can read active public tenders" ON btp.tenders;
CREATE POLICY "Anonymous can read active public tenders"
  ON btp.tenders
  FOR SELECT
  TO anon
  USING (
    status IN ('published', 'open')
    AND (deadline_date IS NULL OR deadline_date > now())
  );
