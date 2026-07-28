-- =============================================================================
-- MIGRATION: create_supplier_notifications
-- Description: Crée la table btp.supplier_notifications et ajoute les colonnes nécessaires
-- =============================================================================

-- 1. Créer la table supplier_notifications
CREATE TABLE IF NOT EXISTS btp.supplier_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_id UUID REFERENCES btp.suppliers(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('password_reset', 'task_assignment', 'payment_reminder', 'inspection_scheduled', 'general')),
    email TEXT NOT NULL,
    reset_token TEXT,
    task_id UUID,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Créer les index pour supplier_notifications
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_supplier_id ON btp.supplier_notifications(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_email ON btp.supplier_notifications(email);
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_reset_token ON btp.supplier_notifications(reset_token);
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_notification_type ON btp.supplier_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_sent_at ON btp.supplier_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_supplier_notifications_expires_at ON btp.supplier_notifications(expires_at);

-- 3. Activer RLS
ALTER TABLE btp.supplier_notifications ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour supplier_notifications
DROP POLICY IF EXISTS "Admins can manage supplier notifications" ON btp.supplier_notifications;
CREATE POLICY "Admins can manage supplier notifications" 
ON btp.supplier_notifications
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role_name IN ('admin', 'super_admin', 'director', 'manager')
    )
);

DROP POLICY IF EXISTS "Suppliers can view their own notifications" ON btp.supplier_notifications;
CREATE POLICY "Suppliers can view their own notifications" 
ON btp.supplier_notifications
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM btp.suppliers s
        WHERE s.id = supplier_notifications.supplier_id 
        AND s.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Suppliers can view by email" ON btp.supplier_notifications;
CREATE POLICY "Suppliers can view by email" 
ON btp.supplier_notifications
FOR SELECT 
USING (
    email = auth.email()
);

-- 5. Ajouter les colonnes à btp.suppliers si elles n'existent pas
ALTER TABLE btp.suppliers 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
    ADD COLUMN IF NOT EXISTS default_password_reset_required BOOLEAN DEFAULT true;

-- 6. Ajouter les colonnes à btp.task_assignments UNIQUEMENT si la table existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'btp' 
        AND tablename = 'task_assignments'
    ) THEN
        ALTER TABLE btp.task_assignments 
            ADD COLUMN IF NOT EXISTS completion_token TEXT,
            ADD COLUMN IF NOT EXISTS completion_url TEXT;
        RAISE NOTICE '✅ Colonnes ajoutées à btp.task_assignments';
    ELSE
        RAISE NOTICE '⏭️ Table btp.task_assignments n''existe pas encore - colonnes non ajoutées';
    END IF;
END $$;

-- 7. Créer des index pour les nouvelles colonnes (uniquement si les tables existent)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'btp' 
        AND tablename = 'suppliers'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON btp.suppliers(user_id);
        RAISE NOTICE '✅ Index idx_suppliers_user_id créé';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'btp' 
        AND tablename = 'task_assignments'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_task_assignments_completion_token ON btp.task_assignments(completion_token);
        CREATE INDEX IF NOT EXISTS idx_task_assignments_completion_url ON btp.task_assignments(completion_url);
        RAISE NOTICE '✅ Index pour task_assignments créés';
    END IF;
END $$;

-- 8. Créer la fonction generate_supplier_reset_token
CREATE OR REPLACE FUNCTION btp.generate_supplier_reset_token(supplier_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_reset_token TEXT;
    v_supplier_id UUID;
BEGIN
    -- Récupérer l'ID du fournisseur
    SELECT id INTO v_supplier_id
    FROM btp.suppliers
    WHERE email = supplier_email;
    
    IF v_supplier_id IS NULL THEN
        RAISE EXCEPTION 'Fournisseur non trouvé avec l''email: %', supplier_email;
    END IF;
    
    -- Générer un token aléatoire
    v_reset_token := encode(gen_random_bytes(32), 'base64');
    
    -- Insérer la notification
    INSERT INTO btp.supplier_notifications (
        supplier_id,
        notification_type,
        email,
        reset_token,
        expires_at,
        created_by
    ) VALUES (
        v_supplier_id,
        'password_reset',
        supplier_email,
        v_reset_token,
        NOW() + INTERVAL '24 hours',
        auth.uid()
    );
    
    RETURN v_reset_token;
END;
$func$;

-- 9. Créer la fonction pour vérifier la validité du token
CREATE OR REPLACE FUNCTION btp.verify_supplier_reset_token(reset_token TEXT)
RETURNS TABLE(
    valid BOOLEAN,
    supplier_id UUID,
    email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    RETURN QUERY
    SELECT 
        TRUE as valid,
        s.id as supplier_id,
        s.email
    FROM btp.supplier_notifications sn
    JOIN btp.suppliers s ON s.id = sn.supplier_id
    WHERE sn.reset_token = reset_token
    AND sn.used_at IS NULL
    AND sn.expires_at > NOW()
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT;
    END IF;
END;
$func$;

-- 10. Créer la fonction pour marquer un token comme utilisé
CREATE OR REPLACE FUNCTION btp.use_supplier_reset_token(reset_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE btp.supplier_notifications
    SET used_at = NOW()
    WHERE reset_token = reset_token
    AND used_at IS NULL
    AND expires_at > NOW();
    
    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$func$;

-- 11. Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.supplier_notifications TO authenticated;
GRANT SELECT ON btp.supplier_notifications TO anon;

-- 12. Trigger pour updated_at
DROP TRIGGER IF EXISTS update_supplier_notifications_updated_at ON btp.supplier_notifications;
CREATE TRIGGER update_supplier_notifications_updated_at
    BEFORE UPDATE ON btp.supplier_notifications
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_timestamp();

-- 13. Commentaires
COMMENT ON TABLE btp.supplier_notifications IS 'Table des notifications pour les fournisseurs';
COMMENT ON COLUMN btp.supplier_notifications.id IS 'Identifiant unique de la notification';
COMMENT ON COLUMN btp.supplier_notifications.supplier_id IS 'Référence au fournisseur';
COMMENT ON COLUMN btp.supplier_notifications.notification_type IS 'Type de notification (password_reset, task_assignment, payment_reminder, inspection_scheduled, general)';
COMMENT ON COLUMN btp.supplier_notifications.email IS 'Email du destinataire';
COMMENT ON COLUMN btp.supplier_notifications.reset_token IS 'Token de réinitialisation du mot de passe';
COMMENT ON COLUMN btp.supplier_notifications.task_id IS 'Référence à la tâche associée';
COMMENT ON COLUMN btp.supplier_notifications.sent_at IS 'Date d''envoi de la notification';
COMMENT ON COLUMN btp.supplier_notifications.expires_at IS 'Date d''expiration du token';
COMMENT ON COLUMN btp.supplier_notifications.used_at IS 'Date d''utilisation du token';
COMMENT ON COLUMN btp.supplier_notifications.created_by IS 'ID de l''utilisateur qui a créé la notification';
COMMENT ON COLUMN btp.supplier_notifications.metadata IS 'Métadonnées supplémentaires au format JSON';
COMMENT ON COLUMN btp.supplier_notifications.created_at IS 'Date de création';
COMMENT ON COLUMN btp.supplier_notifications.updated_at IS 'Date de dernière mise à jour';

COMMENT ON COLUMN btp.suppliers.user_id IS 'ID de l''utilisateur associé au fournisseur';
COMMENT ON COLUMN btp.suppliers.default_password_reset_required IS 'Indique si une réinitialisation du mot de passe est requise';
COMMENT ON COLUMN btp.task_assignments.completion_token IS 'Token de validation pour la complétion de la tâche';
COMMENT ON COLUMN btp.task_assignments.completion_url IS 'URL de validation pour la complétion de la tâche';

COMMENT ON FUNCTION btp.generate_supplier_reset_token(TEXT) IS 'Génère un token de réinitialisation pour un fournisseur';
COMMENT ON FUNCTION btp.verify_supplier_reset_token(TEXT) IS 'Vérifie la validité d''un token de réinitialisation';
COMMENT ON FUNCTION btp.use_supplier_reset_token(TEXT) IS 'Marque un token de réinitialisation comme utilisé';

-- 14. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20250727064238 terminée avec succès';
    RAISE NOTICE '   - Table btp.supplier_notifications créée';
    RAISE NOTICE '   - Index créés';
    RAISE NOTICE '   - RLS activée avec politiques';
    RAISE NOTICE '   - Colonnes ajoutées à btp.suppliers';
    RAISE NOTICE '   - Fonctions créées: generate_supplier_reset_token, verify_supplier_reset_token, use_supplier_reset_token';
    RAISE NOTICE '   - Trigger updated_at créé';
END $$;