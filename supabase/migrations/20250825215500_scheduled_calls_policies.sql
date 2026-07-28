-- =============================================================================
-- MIGRATION: scheduled_calls_policies
-- Description: Ajoute des politiques RLS supplémentaires pour btp.scheduled_calls
-- =============================================================================

-- Politique pour les managers peuvent voir tous les appels de leur équipe
DROP POLICY IF EXISTS "Managers can view team calls" ON btp.scheduled_calls;
CREATE POLICY "Managers can view team calls"
ON btp.scheduled_calls
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role_name IN ('manager', 'director')
    )
);

-- Politique pour les utilisateurs peuvent voir les appels qui leur sont assignés
DROP POLICY IF EXISTS "Users can view calls assigned to them" ON btp.scheduled_calls;
CREATE POLICY "Users can view calls assigned to them"
ON btp.scheduled_calls
FOR SELECT
USING (recipient_id = auth.uid());

DO $$
BEGIN
    RAISE NOTICE '✅ Politiques RLS supplémentaires créées pour btp.scheduled_calls';
END $$;