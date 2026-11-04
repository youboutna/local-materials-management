CREATE TABLE IF NOT EXISTS public.monitoring_dashboards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  refresh_interval integer NOT NULL DEFAULT 300 CHECK (refresh_interval > 0),
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS monitoring_dashboards_user_idx ON public.monitoring_dashboards(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monitoring_dashboards TO authenticated;
GRANT ALL ON public.monitoring_dashboards TO service_role;
ALTER TABLE public.monitoring_dashboards ENABLE ROW LEVEL SECURITY;
CREATE POLICY monitoring_dashboards_owner_all ON public.monitoring_dashboards
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());