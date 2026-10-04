-- =============================================================================
-- MIGRATION : 20260105170728_fix_notifications_insert_policy.sql
-- Date       : 2026-01-05
-- Objet      : Corriger la policy INSERT sur btp.notifications
--
-- SÉCURITÉ :
--   - Idempotente : boucle DROP POLICY IF EXISTS sur les 2 noms
--   - Pas de WITH CHECK (true) → contrôle du recipient_id
--   - RLS activé + FORCE
--   - TO authenticated explicite
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : S'ASSURER QUE btp.is_current_user_admin EXISTE
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
-- ÉTAPE 2 : NETTOYER TOUTES LES POLICIES EXISTANTES SUR btp.notifications
-- =============================================================================
-- ✅ Fix 42710 : on drop TOUTES les policies avant d'en créer une nouvelle.

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  NETTOYAGE DES POLICIES — btp.notifications';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'notifications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON btp.notifications', v_rec.policyname);
    RAISE NOTICE '  ✅ Supprimée : %', v_rec.policyname;
    v_count := v_count + 1;
  END LOOP;

  RAISE NOTICE '  → % policies supprimées', v_count;
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 3 : RLS + FORCE
-- =============================================================================

ALTER TABLE btp.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.notifications FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- ÉTAPE 4 : CRÉER LES NOUVELLES POLICIES SÉCURISÉES
-- =============================================================================

-- 4.1 : SELECT — Un utilisateur voit ses propres notifications
CREATE POLICY "Users can view their own notifications"
ON btp.notifications
FOR SELECT
TO authenticated
USING (btp.notifications.recipient_id = auth.uid());

-- 4.2 : UPDATE — Un utilisateur met à jour ses propres notifications
CREATE POLICY "Users can update their own notifications"
ON btp.notifications
FOR UPDATE
TO authenticated
USING (btp.notifications.recipient_id = auth.uid())
WITH CHECK (btp.notifications.recipient_id = auth.uid());

-- 4.3 : DELETE — Un utilisateur supprime ses propres notifications
CREATE POLICY "Users can delete their own notifications"
ON btp.notifications
FOR DELETE
TO authenticated
USING (btp.notifications.recipient_id = auth.uid());

-- 4.4 : INSERT — ✅ FIX : contrôle du recipient_id
--   Règle : un utilisateur peut créer une notification POUR LUI-MÊME
--           OU un admin peut créer une notification POUR N'IMPORTE QUI.
CREATE POLICY "Authenticated users can create notifications"
ON btp.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  btp.notifications.recipient_id = auth.uid()
  OR btp.is_current_user_admin()
);

COMMENT ON POLICY "Users can view their own notifications"
ON btp.notifications IS
  'Un utilisateur ne voit que ses propres notifications.';

COMMENT ON POLICY "Authenticated users can create notifications"
ON btp.notifications IS
  'Un utilisateur crée une notification pour lui-même ; un admin peut créer pour n''importe qui.';

-- 4.5 : Admins — gestion complète
CREATE POLICY "Admins can manage all notifications"
ON btp.notifications
FOR ALL
TO authenticated
USING (btp.is_current_user_admin())
WITH CHECK (btp.is_current_user_admin());

-- =============================================================================
-- ÉTAPE 5 : PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON btp.notifications TO authenticated;
GRANT SELECT ON btp.notifications TO anon;
GRANT ALL ON btp.notifications TO service_role;

-- =============================================================================
-- ÉTAPE 6 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_rls_enabled BOOLEAN;
  v_rls_forced BOOLEAN;
  v_policy_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT c.relrowsecurity, c.relforcerowsecurity
  INTO v_rls_enabled, v_rls_forced
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'btp' AND c.relname = 'notifications';

  RAISE NOTICE 'RLS activé : %', v_rls_enabled;
  RAISE NOTICE 'RLS forcé  : %', v_rls_forced;

  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'btp' AND tablename = 'notifications';
  RAISE NOTICE 'Policies : %', v_policy_count;

  RAISE NOTICE '';
  RAISE NOTICE 'Détail des policies :';
  FOR v_rec IN
    SELECT policyname, cmd, roles
    FROM pg_policies
    WHERE schemaname = 'btp' AND tablename = 'notifications'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '   • % [%] → %', v_rec.policyname, v_rec.cmd, v_rec.roles;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;