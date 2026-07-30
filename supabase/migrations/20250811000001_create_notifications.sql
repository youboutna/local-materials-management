-- =============================================================================
-- MIGRATION: create_notifications
-- Description: Création de la table public.notifications avec RLS, politiques et index
-- =============================================================================

-- 1. Créer la table notifications (Colonnes fusionnées des deux versions)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    related_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Ajouter la contrainte CHECK sur le type (basée sur la liste exhaustive du second script)
-- Les colonnes `type` et `related_id` seront gérées ici si la table est déjà créée.
ALTER TABLE public.notifications ADD CONSTRAINT IF NOT EXISTS notifications_type_check 
CHECK (type IN (
  'task_assigned', 'task_updated', 'task_completed', 'delay_warning', 
  'bank_guarantee_trigger', 'inspection_overdue', 'contractor_penalty', 
  'compliance_alert', 'escalation_required', 'inspection_required', 
  'project_update', 'insurance_expiry', 'insurance_update', 
  'task_assignment', 'task_overdue', 'project_created', 'project_completed', 
  'project_milestone', 'payment_due', 'payment_completed', 'payment_failed', 
  'payment_pending', 'document_review', 'document_shared', 'document_approved', 
  'document_rejected', 'document_uploaded', 'system', 'payment_blocked', 
  'payment_warning', 'info' -- 'info' ajouté depuis le premier script
));

-- 3. Index pour les performances (Fusion des index des deux scripts avec DESC)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created_at ON public.notifications (recipient_id, created_at DESC);

-- 4. Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Trigger updated_at (Utilisation plus robuste du second script + vérification de fonction)
-- On vérifie si la fonction 'update_timestamp' ou 'update_updated_at_column' existe.
-- Si ni l'une ni l'autre n'existe, on laisse tomber pour ne pas casser la migration.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_timestamp') THEN
    DROP TRIGGER IF EXISTS set_timestamp_notifications ON public.notifications;
    CREATE TRIGGER set_timestamp_notifications
        BEFORE UPDATE ON public.notifications
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp();
  ELSIF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
    CREATE TRIGGER update_notifications_updated_at
        BEFORE UPDATE ON public.notifications
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 6. Permissions (GRANT)
-- Utilisation des permissions classiques (avec mention des rôles du second script)
GRANT SELECT ON public.notifications TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- 7. Politiques RLS (Fusion des politiques)
-- Politique : SELECT
DROP POLICY IF EXISTS select_notifications ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY select_notifications ON public.notifications
    FOR SELECT TO public
    USING (recipient_id = auth.uid() OR auth.role() IN ('admin', 'director'));

-- Politique : INSERT
DROP POLICY IF EXISTS insert_notifications ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY insert_notifications ON public.notifications
    FOR INSERT TO public
    WITH CHECK (recipient_id = auth.uid() OR auth.role() IN ('admin', 'director'));

-- Politique : UPDATE
DROP POLICY IF EXISTS update_notifications ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY update_notifications ON public.notifications
    FOR UPDATE TO public
    USING (recipient_id = auth.uid() OR auth.role() IN ('admin', 'director'))
    WITH CHECK (recipient_id = auth.uid() OR auth.role() IN ('admin', 'director'));

-- Politique : DELETE
DROP POLICY IF EXISTS delete_notifications ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY delete_notifications ON public.notifications
    FOR DELETE TO public
    USING (recipient_id = auth.uid() OR auth.role() IN ('admin', 'director'));

-- 8. Commentaires
COMMENT ON TABLE public.notifications IS 'Notifications utilisateur';
COMMENT ON COLUMN public.notifications.recipient_id IS 'ID du destinataire (auth.users)';
COMMENT ON COLUMN public.notifications.type IS 'Type de notification';
COMMENT ON COLUMN public.notifications.read IS 'Notification lue ou non';
COMMENT ON COLUMN public.notifications.related_id IS 'ID de l''entité liée (projet, tâche, etc.)';

-- 9. Recharger le schéma pour PostgREST
NOTIFY pgrst, 'reload schema';