-- =============================================================================
-- MIGRATION: create_notifications
-- Description: Crée la table btp.notifications
-- Alignée avec le type notifications du DTO
-- =============================================================================

-- 1. Créer la table notifications dans le schéma btp
CREATE TABLE IF NOT EXISTS btp.notifications (
    id UUID DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    related_id TEXT,
    metadata JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

----fix recepient_id, read, type, created_at

ALTER TABLE btp.notifications ADD COLUMN IF NOT EXISTS recipient_id UUID;
ALTER TABLE btp.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
ALTER TABLE btp.notifications ADD COLUMN IF NOT EXISTS type TEXT NOT NULL;
ALTER TABLE btp.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE btp.notifications ADD COLUMN IF NOT EXISTS related_id TEXT;

-- fix migration Add the updated constraint with all notification types used in the application
ALTER TABLE btp.notifications ADD CONSTRAINT IF NOT EXISTS notifications_type_check 
CHECK (type IN (
  'task_assigned', 'task_updated', 'task_completed', 'delay_warning', 
  'bank_guarantee_trigger', 'inspection_overdue', 'contractor_penalty', 
  'compliance_alert', 'escalation_required', 'inspection_required', 
  'project_update', 'insurance_expiry', 'insurance_update', 
  'task_assignment', 'task_overdue', 'project_created', 'project_completed', 
  'project_milestone', 'payment_due', 'payment_completed', 'payment_failed', 
  'payment_pending', 'document_review', 'document_shared', 'document_approved', 
  'document_rejected', 'document_uploaded', 'system', 'payment_blocked', 
  'payment_warning'
));
-- 2. Activer RLS
ALTER TABLE btp.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Trigger updated_at
CREATE TRIGGER set_timestamp_notifications
    BEFORE UPDATE ON btp.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 5. Permissions
GRANT SELECT ON btp.notifications TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON btp.notifications TO authenticated;

-- 6. Politiques RLS
DROP POLICY IF EXISTS select_notifications ON btp.notifications;
CREATE POLICY select_notifications ON btp.notifications
    FOR SELECT TO public
    USING (recipient_id = auth.uid() OR auth.role() IN ('admin', 'director'));

DROP POLICY IF EXISTS insert_notifications ON btp.notifications;
CREATE POLICY insert_notifications ON btp.notifications
    FOR INSERT TO public
    WITH CHECK (recipient_id = auth.uid() OR auth.role() IN ('admin', 'director'));

DROP POLICY IF EXISTS update_notifications ON btp.notifications;
CREATE POLICY update_notifications ON btp.notifications
    FOR UPDATE TO public
    USING (recipient_id = auth.uid() OR auth.role() IN ('admin', 'director'))
    WITH CHECK (recipient_id = auth.uid() OR auth.role() IN ('admin', 'director'));

DROP POLICY IF EXISTS delete_notifications ON btp.notifications;
CREATE POLICY delete_notifications ON btp.notifications
    FOR DELETE TO public
    USING (recipient_id = auth.uid() OR auth.role() IN ('admin', 'director'));

-- 7. Commentaires
COMMENT ON TABLE btp.notifications IS 'Notifications utilisateur';
COMMENT ON COLUMN btp.notifications.recipient_id IS 'ID du destinataire (auth.users)';
COMMENT ON COLUMN btp.notifications.type IS 'Type de notification (task, project, inspection, payment, etc.)';
COMMENT ON COLUMN btp.notifications.read IS 'Notification lue ou non';
COMMENT ON COLUMN btp.notifications.related_id IS 'ID de l''entité liée (projet, tâche, etc.)';



-- 3. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON btp.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON btp.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON btp.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON btp.notifications(created_at);