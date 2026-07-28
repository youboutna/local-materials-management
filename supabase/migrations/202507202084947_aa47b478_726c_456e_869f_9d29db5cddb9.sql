-- =============================================================================
-- MIGRATION: create_email_logs
-- Description: Crée la table btp.email_logs pour le suivi des envois d'emails
-- =============================================================================

-- 1. Créer la table email_logs
CREATE TABLE IF NOT EXISTS btp.email_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    email_to TEXT NOT NULL,
    email_from TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT,
    template_name TEXT,
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending', 'delivered', 'opened', 'clicked', 'bounced')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Créer les index
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON btp.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON btp.email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON btp.email_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_to ON btp.email_logs(email_to);
CREATE INDEX IF NOT EXISTS idx_email_logs_template_name ON btp.email_logs(template_name);

-- 3. Activer Row Level Security
ALTER TABLE btp.email_logs ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS

-- 4.1 Administrateurs peuvent tout voir et tout gérer
DROP POLICY IF EXISTS "Admins can manage all email logs" ON btp.email_logs;
CREATE POLICY "Admins can manage all email logs"
ON btp.email_logs
FOR ALL
USING (
    auth.role() IN ('admin', 'super_admin', 'director', 'manager')
    OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role_name IN ('admin', 'super_admin', 'director', 'manager')
    )
);

-- 4.2 Utilisateurs peuvent voir leurs propres emails
DROP POLICY IF EXISTS "Users can view their own email logs" ON btp.email_logs;
CREATE POLICY "Users can view their own email logs"
ON btp.email_logs
FOR SELECT
USING (user_id = auth.uid());

-- 4.3 Utilisateurs peuvent insérer des logs
DROP POLICY IF EXISTS "Users can insert email logs" ON btp.email_logs;
CREATE POLICY "Users can insert email logs"
ON btp.email_logs
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 4.4 Utilisateurs peuvent mettre à jour leurs propres logs
DROP POLICY IF EXISTS "Users can update their own email logs" ON btp.email_logs;
CREATE POLICY "Users can update their own email logs"
ON btp.email_logs
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Permissions
GRANT SELECT, INSERT, UPDATE ON btp.email_logs TO authenticated;
GRANT SELECT ON btp.email_logs TO anon;

-- 6. Trigger pour updated_at
DROP TRIGGER IF EXISTS update_email_logs_updated_at ON btp.email_logs;
CREATE TRIGGER update_email_logs_updated_at
    BEFORE UPDATE ON btp.email_logs
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_timestamp();

-- 7. Commentaires
COMMENT ON TABLE btp.email_logs IS 'Table de logs pour le suivi des envois d''emails';
COMMENT ON COLUMN btp.email_logs.id IS 'Identifiant unique du log';
COMMENT ON COLUMN btp.email_logs.user_id IS 'ID de l''utilisateur qui a envoyé l''email';
COMMENT ON COLUMN btp.email_logs.email_to IS 'Adresse email du destinataire';
COMMENT ON COLUMN btp.email_logs.email_from IS 'Adresse email de l''expéditeur';
COMMENT ON COLUMN btp.email_logs.subject IS 'Sujet de l''email';
COMMENT ON COLUMN btp.email_logs.body IS 'Corps de l''email (peut être HTML)';
COMMENT ON COLUMN btp.email_logs.template_name IS 'Nom du template utilisé';
COMMENT ON COLUMN btp.email_logs.status IS 'Statut de l''envoi';
COMMENT ON COLUMN btp.email_logs.error_message IS 'Message d''erreur en cas d''échec';
COMMENT ON COLUMN btp.email_logs.metadata IS 'Métadonnées supplémentaires (JSON)';
COMMENT ON COLUMN btp.email_logs.created_at IS 'Date de création du log';
COMMENT ON COLUMN btp.email_logs.updated_at IS 'Date de dernière mise à jour';

-- 8. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 202507202084947 terminée avec succès';
    RAISE NOTICE '   - Table btp.email_logs créée/vérifiée';
    RAISE NOTICE '   - Index créés';
    RAISE NOTICE '   - RLS activée avec politiques';
    RAISE NOTICE '   - Trigger updated_at créé';
END $$;