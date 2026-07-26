
-- Fix: grant Data API access to all btp schema tables and sequences.
-- The previous migration (public -> btp) created tables via LIKE INCLUDING ALL
-- but PostgREST requires explicit GRANTs. Without these, the app cannot
-- reach any btp table (permission denied), breaking CRUD across the app
-- (notably tender_lot_documents / Document Management).

GRANT USAGE ON SCHEMA btp TO anon, authenticated, service_role;

-- Full CRUD for authenticated users (RLS policies still apply)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA btp TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA btp TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA btp TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA btp TO authenticated, service_role;

-- Default privileges so future tables/sequences inherit the grants
ALTER DEFAULT PRIVILEGES IN SCHEMA btp
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA btp
  GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA btp
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA btp
  GRANT EXECUTE ON FUNCTIONS TO authenticated, service_role;
