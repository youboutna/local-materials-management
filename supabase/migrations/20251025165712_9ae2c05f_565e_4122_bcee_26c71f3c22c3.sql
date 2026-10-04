-- =============================================================================
-- MIGRATION : 20251025165712_fix_tender_sharing_secrets.sql
-- Date       : 2025-10-25
-- Objet      : Créer/compléter les tables de partage sécurisé de tender
--
-- SÉCURITÉ :
--   - Idempotente : boucle DROP POLICY IF EXISTS
--   - RLS activé + FORCE
--   - Policies TO authenticated
--   - Fonctions SECURITY DEFINER + SET search_path + REVOKE PUBLIC
--   - Fonctions avec paramètres préfixés p_ (anti-collision)
--   - Pas de WITH CHECK (true)
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
-- ÉTAPE 1 : TABLE btp.tender_sharing_secrets (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_sharing_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES btp.tenders(id) ON DELETE CASCADE,
  secret_code TEXT NOT NULL UNIQUE,
  shared_by UUID REFERENCES auth.users(id),
  supplier_email TEXT,
  supplier_id UUID REFERENCES btp.suppliers(id),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  access_count INTEGER DEFAULT 0,
  max_access_count INTEGER DEFAULT 10,
  workflow_phase TEXT,
  workflow_stage TEXT,
  allowed_document_ids TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compléter les colonnes manquantes
ALTER TABLE btp.tender_sharing_secrets
  ADD COLUMN IF NOT EXISTS tender_id UUID,
  ADD COLUMN IF NOT EXISTS secret_code TEXT,
  ADD COLUMN IF NOT EXISTS shared_by UUID,
  ADD COLUMN IF NOT EXISTS supplier_email TEXT,
  ADD COLUMN IF NOT EXISTS supplier_id UUID,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_access_count INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS workflow_phase TEXT,
  ADD COLUMN IF NOT EXISTS workflow_stage TEXT,
  ADD COLUMN IF NOT EXISTS allowed_document_ids TEXT[],
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_sharing_secrets créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : TABLE btp.tender_sharing_access_logs (IDEMPOTENTE)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.tender_sharing_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sharing_secret_id UUID NOT NULL REFERENCES btp.tender_sharing_secrets(id) ON DELETE CASCADE,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  accessed_documents TEXT[],
  action_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE btp.tender_sharing_access_logs
  ADD COLUMN IF NOT EXISTS sharing_secret_id UUID,
  ADD COLUMN IF NOT EXISTS accessed_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS accessed_documents TEXT[],
  ADD COLUMN IF NOT EXISTS action_type TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

DO $$ BEGIN RAISE NOTICE '✅ Table btp.tender_sharing_access_logs créée/vérifiée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.tender_sharing_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_sharing_secrets FORCE ROW LEVEL SECURITY;

ALTER TABLE btp.tender_sharing_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_sharing_access_logs FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 4 : NETTOYAGE DYNAMIQUE DES POLICIES EXISTANTES (fix 42710)
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NETTOYAGE DES POLICIES';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('tender_sharing_secrets', 'tender_sharing_access_logs')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.%I',
      v_rec.policyname, v_rec.tablename);
    RAISE NOTICE '  ✅ Supprimée : %.%', v_rec.tablename, v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 5 : POLICIES SÉCURISÉES — tender_sharing_secrets
-- =============================================================================

-- 5.1 : Admins : gestion complète
CREATE POLICY "Admins can manage sharing secrets"
ON btp.tender_sharing_secrets
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- 5.2 : Manager du secret : gestion
CREATE POLICY "Managers can manage their sharing secrets"
ON btp.tender_sharing_secrets
FOR ALL
TO authenticated
USING (
  btp.tender_sharing_secrets.shared_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'director', 'project_manager')
  )
)
WITH CHECK (
  btp.tender_sharing_secrets.shared_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role_name IN ('admin', 'director', 'project_manager')
  )
);

-- 5.3 : Fournisseurs : consultation de leurs secrets
-- ✅ Fix : gestion propre du cas où auth.jwt() retourne NULL
CREATE POLICY "Suppliers can view their sharing secrets"
ON btp.tender_sharing_secrets
FOR SELECT
TO authenticated
USING (
  -- Cas 1 : email dans le JWT
  (
    auth.jwt() IS NOT NULL
    AND btp.tender_sharing_secrets.supplier_email = (auth.jwt()->>'email')
  )
  -- Cas 2 : supplier_id correspond à un supplier dont l'email = JWT email
  OR (
    auth.jwt() IS NOT NULL
    AND btp.tender_sharing_secrets.supplier_id IN (
      SELECT s.id FROM btp.suppliers s
      WHERE s.email = (auth.jwt()->>'email')
    )
  )
);

COMMENT ON POLICY "Admins can manage sharing secrets" ON btp.tender_sharing_secrets IS
  'Admin/director : gestion complète.';
COMMENT ON POLICY "Managers can manage their sharing secrets" ON btp.tender_sharing_secrets IS
  'Créateur du secret ou project_manager/director/admin.';
COMMENT ON POLICY "Suppliers can view their sharing secrets" ON btp.tender_sharing_secrets IS
  'Un fournisseur voit les secrets partagés avec lui (par email ou supplier_id).';

-- =============================================================================
-- ÉTAPE 6 : POLICIES SÉCURISÉES — tender_sharing_access_logs
-- =============================================================================

-- 6.1 : Admins : gestion complète
CREATE POLICY "Admins can manage access logs"
ON btp.tender_sharing_access_logs
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- 6.2 : Insertion : utilisateurs authentifiés (jamais anon)
CREATE POLICY "Authenticated can insert access logs"
ON btp.tender_sharing_access_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 6.3 : Consultation : propriétaire du secret ou supplier du secret
CREATE POLICY "Users can view their access logs"
ON btp.tender_sharing_access_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM btp.tender_sharing_secrets tss
    WHERE tss.id = btp.tender_sharing_access_logs.sharing_secret_id
      AND (
        tss.shared_by = auth.uid()
        OR (
          auth.jwt() IS NOT NULL
          AND tss.supplier_email = (auth.jwt()->>'email')
        )
        OR btp.is_current_user_admin()
      )
  )
);

COMMENT ON POLICY "Admins can manage access logs" ON btp.tender_sharing_access_logs IS
  'Admin/director : gestion complète.';
COMMENT ON POLICY "Authenticated can insert access logs" ON btp.tender_sharing_access_logs IS
  'Insertion réservée aux utilisateurs authentifiés.';
COMMENT ON POLICY "Users can view their access logs" ON btp.tender_sharing_access_logs IS
  'Consultation des logs des secrets dont on est propriétaire ou destinataire.';

-- =============================================================================
-- ÉTAPE 7 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_sharing_secrets TO authenticated;
GRANT SELECT ON btp.tender_sharing_secrets TO anon;
GRANT ALL ON btp.tender_sharing_secrets TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.tender_sharing_access_logs TO authenticated;
GRANT SELECT ON btp.tender_sharing_access_logs TO anon;
GRANT ALL ON btp.tender_sharing_access_logs TO service_role;

-- =============================================================================
-- ÉTAPE 8 : INDEX
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_tender_sharing_secrets_tender_id
  ON btp.tender_sharing_secrets(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_sharing_secrets_secret_code
  ON btp.tender_sharing_secrets(secret_code);
CREATE INDEX IF NOT EXISTS idx_tender_sharing_secrets_expires_at
  ON btp.tender_sharing_secrets(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tender_sharing_secrets_supplier_email
  ON btp.tender_sharing_secrets(supplier_email) WHERE supplier_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tender_sharing_access_logs_secret_id
  ON btp.tender_sharing_access_logs(sharing_secret_id);
CREATE INDEX IF NOT EXISTS idx_tender_sharing_access_logs_accessed_at
  ON btp.tender_sharing_access_logs(accessed_at DESC);

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

DROP TRIGGER IF EXISTS update_tender_sharing_secrets_updated_at ON btp.tender_sharing_secrets;
CREATE TRIGGER update_tender_sharing_secrets_updated_at
  BEFORE UPDATE ON btp.tender_sharing_secrets
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Trigger updated_at créé'; END $$;

-- =============================================================================
-- ÉTAPE 11 : FONCTION generate_tender_secret_code() — SÉCURISÉE
-- =============================================================================

DROP FUNCTION IF EXISTS btp.generate_tender_secret_code() CASCADE;

CREATE FUNCTION btp.generate_tender_secret_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_characters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..12 LOOP
    v_result := v_result || substr(v_characters, floor(random() * length(v_characters) + 1)::int, 1);
  END LOOP;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION btp.generate_tender_secret_code() FROM PUBLIC;
REVOKE ALL ON FUNCTION btp.generate_tender_secret_code() FROM anon;
GRANT EXECUTE ON FUNCTION btp.generate_tender_secret_code() TO authenticated;
GRANT EXECUTE ON FUNCTION btp.generate_tender_secret_code() TO service_role;

COMMENT ON FUNCTION btp.generate_tender_secret_code() IS
  'Génère un code secret de 12 caractères. SECURITY DEFINER + search_path=''''.';

-- =============================================================================
-- ÉTAPE 12 : FONCTION validate_tender_secret() — SÉCURISÉE
-- =============================================================================
-- ✅ Paramètre préfixé p_secret_code (anti-collision avec la colonne secret_code)
-- ✅ SET search_path = ''
-- ✅ REVOKE PUBLIC + GRANT authenticated

DROP FUNCTION IF EXISTS btp.validate_tender_secret(TEXT) CASCADE;

CREATE FUNCTION btp.validate_tender_secret(p_secret_code TEXT)
RETURNS TABLE(
  is_valid BOOLEAN,
  tender_id UUID,
  allowed_documents TEXT[],
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_secret RECORD;
BEGIN
  -- Recherche du secret valide
  SELECT * INTO v_secret
  FROM btp.tender_sharing_secrets
  WHERE secret_code = p_secret_code
    AND is_active = true
    AND expires_at > NOW();

  IF v_secret IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT[], 'Code invalide ou expiré'::TEXT;
    RETURN;
  END IF;

  IF v_secret.max_access_count IS NOT NULL
     AND v_secret.access_count >= v_secret.max_access_count THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT[], 'Limite d''accès atteinte'::TEXT;
    RETURN;
  END IF;

  -- Incrément du compteur d'accès (atomique)
  UPDATE btp.tender_sharing_secrets
  SET access_count = access_count + 1
  WHERE id = v_secret.id;

  -- Retour succès
  RETURN QUERY SELECT
    true,
    v_secret.tender_id,
    v_secret.allowed_document_ids,
    'Accès autorisé'::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION btp.validate_tender_secret(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION btp.validate_tender_secret(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION btp.validate_tender_secret(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION btp.validate_tender_secret(TEXT) TO service_role;

COMMENT ON FUNCTION btp.validate_tender_secret(TEXT) IS
  'Valide un code secret et incrémente le compteur. SECURITY DEFINER + search_path=''''.';

DO $$ BEGIN RAISE NOTICE '✅ Fonctions RPC créées et sécurisées'; END $$;

-- =============================================================================
-- ÉTAPE 13 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
  v_func_security TEXT;
  v_tables TEXT[] := ARRAY['tender_sharing_secrets', 'tender_sharing_access_logs'];
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

  -- Fonctions RPC
  RAISE NOTICE '';
  RAISE NOTICE 'Fonctions RPC :';
  FOR v_rec IN
    SELECT p.proname, CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'btp'
      AND p.proname IN ('generate_tender_secret_code', 'validate_tender_secret')
    ORDER BY p.proname
  LOOP
    RAISE NOTICE '   • % [%]', v_rec.proname, v_rec.security;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT tablename, policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp'
      AND tablename IN ('tender_sharing_secrets', 'tender_sharing_access_logs')
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