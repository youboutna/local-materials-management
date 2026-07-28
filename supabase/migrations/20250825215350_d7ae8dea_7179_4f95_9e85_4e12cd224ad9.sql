-- =============================================================================
-- MIGRATION: create_scheduled_calls_and_task_assignments
-- Description: Crée les tables btp.scheduled_calls et btp.task_assignments
-- =============================================================================

-- 1. Créer la table scheduled_calls
CREATE TABLE IF NOT EXISTS btp.scheduled_calls (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID NOT NULL,
    recipient_phone TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    action_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Créer la table task_assignments
CREATE TABLE IF NOT EXISTS btp.task_assignments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assignee_id UUID NOT NULL,
    assignee_name TEXT NOT NULL,
    assignee_email TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    project_id UUID,
    phase_id UUID,
    related_id UUID,
    action_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE SET NULL,
    FOREIGN KEY (phase_id) REFERENCES btp.phases(id) ON DELETE SET NULL
);

-- 3. Créer les index pour scheduled_calls
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_recipient_id ON btp.scheduled_calls(recipient_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_status ON btp.scheduled_calls(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_scheduled_for ON btp.scheduled_calls(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_priority ON btp.scheduled_calls(priority);

-- 4. Créer les index pour task_assignments
CREATE INDEX IF NOT EXISTS idx_task_assignments_assignee_id ON btp.task_assignments(assignee_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_project_id ON btp.task_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_phase_id ON btp.task_assignments(phase_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON btp.task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_task_assignments_priority ON btp.task_assignments(priority);
CREATE INDEX IF NOT EXISTS idx_task_assignments_due_date ON btp.task_assignments(due_date);

-- 5. Activer RLS
ALTER TABLE btp.scheduled_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.task_assignments ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS pour scheduled_calls
DROP POLICY IF EXISTS "Users can view their own scheduled calls" ON btp.scheduled_calls;
CREATE POLICY "Users can view their own scheduled calls" 
ON btp.scheduled_calls 
FOR SELECT 
USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert scheduled calls" ON btp.scheduled_calls;
CREATE POLICY "Authenticated users can insert scheduled calls" 
ON btp.scheduled_calls 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own scheduled calls" ON btp.scheduled_calls;
CREATE POLICY "Users can update their own scheduled calls" 
ON btp.scheduled_calls 
FOR UPDATE 
USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own scheduled calls" ON btp.scheduled_calls;
CREATE POLICY "Users can delete their own scheduled calls" 
ON btp.scheduled_calls 
FOR DELETE 
USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all scheduled calls" ON btp.scheduled_calls;
CREATE POLICY "Admins can manage all scheduled calls" 
ON btp.scheduled_calls 
FOR ALL 
USING (
    auth.role() IN ('admin', 'super_admin', 'director', 'manager')
    OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role_name IN ('admin', 'super_admin', 'director', 'manager')
    )
);

-- 7. Politiques RLS pour task_assignments
DROP POLICY IF EXISTS "Users can view their own task assignments" ON btp.task_assignments;
CREATE POLICY "Users can view their own task assignments" 
ON btp.task_assignments 
FOR SELECT 
USING (assignee_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert task assignments" ON btp.task_assignments;
CREATE POLICY "Authenticated users can insert task assignments" 
ON btp.task_assignments 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their own task assignments" ON btp.task_assignments;
CREATE POLICY "Users can update their own task assignments" 
ON btp.task_assignments 
FOR UPDATE 
USING (assignee_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own task assignments" ON btp.task_assignments;
CREATE POLICY "Users can delete their own task assignments" 
ON btp.task_assignments 
FOR DELETE 
USING (assignee_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all task assignments" ON btp.task_assignments;
CREATE POLICY "Admins can manage all task assignments" 
ON btp.task_assignments 
FOR ALL 
USING (
    auth.role() IN ('admin', 'super_admin', 'director', 'manager')
    OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role_name IN ('admin', 'super_admin', 'director', 'manager')
    )
);

-- 8. Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.scheduled_calls TO authenticated;
GRANT SELECT ON btp.scheduled_calls TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON btp.task_assignments TO authenticated;
GRANT SELECT ON btp.task_assignments TO anon;

-- 9. Triggers pour updated_at
DROP TRIGGER IF EXISTS update_scheduled_calls_updated_at ON btp.scheduled_calls;
CREATE TRIGGER update_scheduled_calls_updated_at
    BEFORE UPDATE ON btp.scheduled_calls
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_timestamp();

DROP TRIGGER IF EXISTS update_task_assignments_updated_at ON btp.task_assignments;
CREATE TRIGGER update_task_assignments_updated_at
    BEFORE UPDATE ON btp.task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_timestamp();

-- 10. Commentaires
COMMENT ON TABLE btp.scheduled_calls IS 'Table des appels programmés pour le suivi des communications';
COMMENT ON COLUMN btp.scheduled_calls.id IS 'Identifiant unique de l''appel';
COMMENT ON COLUMN btp.scheduled_calls.recipient_id IS 'ID de l''utilisateur destinataire';
COMMENT ON COLUMN btp.scheduled_calls.recipient_phone IS 'Numéro de téléphone du destinataire';
COMMENT ON COLUMN btp.scheduled_calls.subject IS 'Sujet de l''appel';
COMMENT ON COLUMN btp.scheduled_calls.message IS 'Message ou notes pour l''appel';
COMMENT ON COLUMN btp.scheduled_calls.priority IS 'Priorité de l''appel (low, medium, high, urgent)';
COMMENT ON COLUMN btp.scheduled_calls.scheduled_for IS 'Date et heure programmées pour l''appel';
COMMENT ON COLUMN btp.scheduled_calls.action_type IS 'Type d''action à effectuer lors de l''appel';
COMMENT ON COLUMN btp.scheduled_calls.status IS 'Statut de l''appel (scheduled, completed, cancelled, failed)';
COMMENT ON COLUMN btp.scheduled_calls.metadata IS 'Métadonnées supplémentaires au format JSON';
COMMENT ON COLUMN btp.scheduled_calls.created_at IS 'Date de création';
COMMENT ON COLUMN btp.scheduled_calls.updated_at IS 'Date de dernière mise à jour';

COMMENT ON TABLE btp.task_assignments IS 'Table des assignations de tâches';
COMMENT ON COLUMN btp.task_assignments.id IS 'Identifiant unique de la tâche';
COMMENT ON COLUMN btp.task_assignments.assignee_id IS 'ID de la personne assignée';
COMMENT ON COLUMN btp.task_assignments.assignee_name IS 'Nom de la personne assignée';
COMMENT ON COLUMN btp.task_assignments.assignee_email IS 'Email de la personne assignée';
COMMENT ON COLUMN btp.task_assignments.title IS 'Titre de la tâche';
COMMENT ON COLUMN btp.task_assignments.description IS 'Description détaillée de la tâche';
COMMENT ON COLUMN btp.task_assignments.priority IS 'Priorité de la tâche';
COMMENT ON COLUMN btp.task_assignments.due_date IS 'Date d''échéance';
COMMENT ON COLUMN btp.task_assignments.project_id IS 'Référence au projet';
COMMENT ON COLUMN btp.task_assignments.phase_id IS 'Référence à la phase du projet';
COMMENT ON COLUMN btp.task_assignments.related_id IS 'ID de l''entité liée (inspection, payment, etc.)';
COMMENT ON COLUMN btp.task_assignments.action_type IS 'Type d''action à effectuer';
COMMENT ON COLUMN btp.task_assignments.status IS 'Statut de la tâche (assigned, in_progress, completed, cancelled)';
COMMENT ON COLUMN btp.task_assignments.metadata IS 'Métadonnées supplémentaires au format JSON';
COMMENT ON COLUMN btp.task_assignments.created_at IS 'Date de création';
COMMENT ON COLUMN btp.task_assignments.updated_at IS 'Date de dernière mise à jour';

-- 11. Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 20250825215350 terminée avec succès';
    RAISE NOTICE '   - Table btp.scheduled_calls créée';
    RAISE NOTICE '   - Table btp.task_assignments créée';
    RAISE NOTICE '   - Index créés';
    RAISE NOTICE '   - RLS activée avec politiques';
    RAISE NOTICE '   - Triggers créés';
END $$;