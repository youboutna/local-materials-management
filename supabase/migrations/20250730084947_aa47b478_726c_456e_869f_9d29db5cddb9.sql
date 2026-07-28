-- =============================================================================
-- MIGRATION: create_email_logs_policies
-- Description: Crée les politiques RLS pour la table btp.email_logs
-- =============================================================================

-- 1. Créer les fonctions d'autorisation
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role_name IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_current_user_director()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role_name IN ('admin', 'super_admin', 'director', 'manager')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Activer RLS sur email_logs
ALTER TABLE btp.email_logs ENABLE ROW LEVEL SECURITY;

-- 3. Politique pour les administrateurs
DROP POLICY IF EXISTS "Admins can view email logs" ON btp.email_logs;
CREATE POLICY "Admins can view email logs"
ON btp.email_logs
FOR SELECT
USING (public.is_current_user_admin());

-- 4. Politique pour les directeurs et managers
DROP POLICY IF EXISTS "Directors can view email logs" ON btp.email_logs;
CREATE POLICY "Directors can view email logs"
ON btp.email_logs
FOR SELECT
USING (public.is_current_user_director());

-- 5. Politique pour les utilisateurs normaux (voir leurs propres emails)
DROP POLICY IF EXISTS "Users can view their own email logs" ON btp.email_logs;
CREATE POLICY "Users can view their own email logs"
ON btp.email_logs
FOR SELECT
USING (user_id = auth.uid());

-- 6. Politique pour l'insertion (tous les utilisateurs authentifiés peuvent insérer)
DROP POLICY IF EXISTS "Users can insert email logs" ON btp.email_logs;
CREATE POLICY "Users can insert email logs"
ON btp.email_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Permissions
GRANT SELECT, INSERT ON btp.email_logs TO authenticated;
GRANT SELECT ON btp.email_logs TO anon;

-- 8. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20250730084947 terminée avec succès';
    RAISE NOTICE '   - Fonctions is_current_user_admin créée';
    RAISE NOTICE '   - Fonctions is_current_user_director créée';
    RAISE NOTICE '   - Politiques RLS configurées pour btp.email_logs';
END $$;