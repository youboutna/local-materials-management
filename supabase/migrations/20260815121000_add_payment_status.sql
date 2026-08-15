-- 1. Ajout de la colonne status si elle n'existe pas
ALTER TABLE btp.payments ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE btp.payments ADD CONSTRAINT payments_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'blocked', 'paid', 'cancelled'));
CREATE INDEX IF NOT EXISTS idx_payments_status ON btp.payments (status);

-- 2. Ajout de la colonne created_by si elle n'existe pas (doit être uuid)
ALTER TABLE btp.payments ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

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