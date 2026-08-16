
-- 3. Activer RLS et créer les politiques (si absentes)
ALTER TABLE btp.payments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'payments' AND policyname = 'Users can insert payments') THEN
    CREATE POLICY "Users can insert payments" ON btp.payments FOR INSERT WITH CHECK (created_by = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'payments' AND policyname = 'Users can view payments') THEN
    CREATE POLICY "Users can view payments" ON btp.payments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'btp' AND tablename = 'payments' AND policyname = 'Users can update payments') THEN
    CREATE POLICY "Users can update payments" ON btp.payments FOR UPDATE USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
  END IF;
END $$;
payments_status_check