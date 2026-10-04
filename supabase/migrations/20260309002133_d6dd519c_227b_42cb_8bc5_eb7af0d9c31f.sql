-- =============================================================================
-- MIGRATION : 20260309002133_create_contact_messages.sql
-- Date       : 2026-03-09
-- Objet      : Créer btp.contact_messages + btp.blocked_senders
--
-- SÉCURITÉ :
--   - Idempotente : CREATE IF NOT EXISTS + boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Formulaire public (anon) : INSERT autorisé, lecture réservée admin
--   - Utilise btp.is_current_user_admin() (pas de duplication)
--   - Trigger via public.update_timestamp()
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : S'ASSURER QUE btp.is_current_user_admin EXISTE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'btp' AND p.proname = 'is_current_user_admin'
  ) THEN
    EXECUTE $fn$
      CREATE FUNCTION btp.is_current_user_admin()
      RETURNS BOOLEAN
      LANGUAGE SQL
      SECURITY DEFINER
      STABLE
      SET search_path = ''
      AS $body$
        SELECT EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid()
            AND role_name IN ('admin', 'director')
        );
      $body$;
    $fn$;

    REVOKE ALL ON FUNCTION btp.is_current_user_admin() FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION btp.is_current_user_admin() TO authenticated;
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 1 : TABLE btp.contact_messages (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name TEXT NOT NULL DEFAULT '',
  sender_email TEXT NOT NULL DEFAULT '',
  sender_phone TEXT,
  subject TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_spam BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  default_reply_email TEXT NOT NULL DEFAULT 'non-reply@hadratech.com',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.contact_messages
  ADD COLUMN IF NOT EXISTS sender_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS sender_email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS sender_phone TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS message TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_reply_email TEXT DEFAULT 'non-reply@hadratech.com',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.contact_messages créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.blocked_senders (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.blocked_senders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL DEFAULT '',
  reason TEXT,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  blocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE btp.blocked_senders
  ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS blocked_by UUID,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Contrainte UNIQUE sur email (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'blocked_senders_email_key'
      AND conrelid = 'btp.blocked_senders'::regclass
  ) THEN
    ALTER TABLE btp.blocked_senders
      ADD CONSTRAINT blocked_senders_email_key UNIQUE (email);
    RAISE NOTICE '  ✅ UNIQUE (email) ajouté';
  END IF;
END $$;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.blocked_senders créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.contact_messages FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.blocked_senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.blocked_senders FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 4 : NETTOYAGE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('contact_messages', 'blocked_senders')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I',
      v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  Policy supprimée : %.%', v_rec.tablename, v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
END $$;

-- =============================================================================
-- ÉTAPE 5 : POLICIES — btp.contact_messages
-- =============================================================================

-- 5.1 : Insertion publique (formulaire de contact)
-- ⚠️ Volontairement permissif (anon + authenticated), mais :
--    - rate-limiting côté Edge Function / API
--    - captcha côté frontend
CREATE POLICY "Anyone can create contact messages"
ON btp.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Contraintes minimales de cohérence
  length(trim(sender_email)) > 0
  AND length(trim(sender_name)) > 0
  AND length(trim(subject)) > 0
  AND length(trim(message)) > 0
);

COMMENT ON POLICY "Anyone can create contact messages" ON btp.contact_messages IS
  'Formulaire public — rate-limiting recommandé côté Edge Function.';

-- 5.2 : Admins : gestion complète
CREATE POLICY "Admins can manage contact messages"
ON btp.contact_messages
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('admin', 'director', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('admin', 'director', 'manager')
  )
);

COMMENT ON POLICY "Admins can manage contact messages" ON btp.contact_messages IS
  'Admin/director/manager : gestion complète des messages de contact.';

-- =============================================================================
-- ÉTAPE 6 : POLICIES — btp.blocked_senders
-- =============================================================================

CREATE POLICY "Admins can manage blocked senders"
ON btp.blocked_senders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('admin', 'director', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('admin', 'director', 'manager')
  )
);

COMMENT ON POLICY "Admins can manage blocked senders" ON btp.blocked_senders IS
  'Admin/director/manager : gestion complète des expéditeurs bloqués.';

-- =============================================================================
-- ÉTAPE 7 : PERMISSIONS
-- =============================================================================

-- contact_messages : anon peut insérer (formulaire public)
GRANT INSERT ON btp.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.contact_messages TO authenticated;
GRANT ALL ON btp.contact_messages TO service_role;

-- blocked_senders : admin uniquement
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.blocked_senders TO authenticated;
GRANT ALL ON btp.blocked_senders TO service_role;

-- =============================================================================
-- ÉTAPE 8 : INDEX (idempotents)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_contact_messages_sender_email
  ON btp.contact_messages(sender_email);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON btp.contact_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_is_spam
  ON btp.contact_messages(is_spam) WHERE is_spam = true;

CREATE INDEX IF NOT EXISTS idx_contact_messages_is_read
  ON btp.contact_messages(is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_contact_messages_is_archived
  ON btp.contact_messages(is_archived) WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_blocked_senders_email
  ON btp.blocked_senders(email) WHERE is_active = true;

DO $$ BEGIN RAISE NOTICE '✅ Index créés'; END $$;

-- =============================================================================
-- ÉTAPE 9 : FONCTION TRIGGER public.update_timestamp() (sécurisée)
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_timestamp'
  ) THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.update_timestamp()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = ''
      AS $body$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $body$;
    $fn$;
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 10 : TRIGGER updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON btp.contact_messages;
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON btp.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 11 : FONCTION ANTI-SPAM (optionnelle)
-- =============================================================================
-- Vérifie si l'email de l'expéditeur est bloqué AVANT insertion.
-- Utilisation : côté Edge Function avant insert (ou via trigger BEFORE INSERT).

CREATE OR REPLACE FUNCTION btp.is_sender_blocked(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM btp.blocked_senders
    WHERE email = lower(trim(p_email))
      AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION btp.is_sender_blocked(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION btp.is_sender_blocked(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION btp.is_sender_blocked(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION btp.is_sender_blocked(TEXT) TO service_role;

COMMENT ON FUNCTION btp.is_sender_blocked(TEXT) IS
  'Vérifie si un email est dans blocked_senders. Utilisable côté Edge Function.';

-- =============================================================================
-- ÉTAPE 12 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_tables TEXT[] := ARRAY['contact_messages', 'blocked_senders'];
  v_tbl TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOREACH v_tbl IN ARRAY v_tables
  LOOP
    SELECT c.relrowsecurity, c.relforcerowsecurity
    INTO v_rls_enabled, v_rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'btp' AND c.relname = v_tbl;

    RAISE NOTICE 'btp.% : RLS=% FORCE=%', v_tbl, v_rls_enabled, v_rls_forced;

    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = v_tbl;
    RAISE NOTICE '   Policies : %', v_policy_count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('contact_messages', 'blocked_senders')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE '   • %.% [%] → %',
      v_rec.tablename, v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;