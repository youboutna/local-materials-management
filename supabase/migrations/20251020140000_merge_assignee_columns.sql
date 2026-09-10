-- =============================================================================
-- MIGRATION: final_merge_assignees_notifications_and_policies
-- Description: Fusion complète de la gestion des assignations et des politiques RLS
-- Version: 3.0 (Sans dépendance à btp.tasks)
-- =============================================================================

BEGIN;

-- =============================================================================
-- PARTIE 1 : STRUCTURE DES COLONNES
-- =============================================================================

-- 1. Ajout des colonnes universelles pour les assignations
ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE btp.task_assignments
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS assignee_type TEXT;
ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS assignee_name TEXT;

ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS assignee_email TEXT;

-- 2. Ajout de la colonne assigned_by (CRUCIAL : elle manquait et est utilisée dans les politiques)
ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS assigned_by UUID;

-- 3. Ajout de la colonne project_id si elle n'existe pas (pour les politiques)
ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS project_id UUID;

-- 4. Ajout des contraintes de validation (avec vérification d'existence)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'check_assignee_type'
        AND conrelid = 'btp.task_assignments'::regclass
    ) THEN
        ALTER TABLE btp.task_assignments 
        ADD CONSTRAINT check_assignee_type 
        CHECK (assignee_type IN ('admin', 'supplier', 'director', 'manager', 'employee', 'user', 'team'));
    END IF;
END $$;

-- 5. Suppression des anciennes colonnes spécifiques aux rôles
ALTER TABLE btp.task_assignments 
DROP COLUMN IF EXISTS assigned_employee_id CASCADE,
DROP COLUMN IF EXISTS assigned_supplier_id CASCADE,
DROP COLUMN IF EXISTS assigned_profile_id CASCADE;

ALTER TABLE btp.task_assignments
ADD COLUMN IF NOT EXISTS created_by UUID;

-- 6. Création des index pour les performances
CREATE INDEX IF NOT EXISTS idx_task_assignments_assignee 
ON btp.task_assignments(assigned_to, assignee_type);

CREATE INDEX IF NOT EXISTS idx_task_assignments_assignee_type 
ON btp.task_assignments(assignee_type);

CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_by 
ON btp.task_assignments(assigned_by);

CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id 
ON btp.task_assignments(id);

CREATE INDEX IF NOT EXISTS idx_task_assignments_project_id 
ON btp.task_assignments(project_id);

CREATE INDEX IF NOT EXISTS idx_task_assignments_status 
ON btp.task_assignments(status);

-- 7. Ajout de la colonne recipient_id à notifications si elle n'existe pas
ALTER TABLE btp.notifications 
ADD COLUMN IF NOT EXISTS recipient_id UUID;

-- 8. Ajout des colonnes supplémentaires pour notifications si nécessaire
ALTER TABLE btp.notifications 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notification_type TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS content TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- 9. Ajout des index pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON btp.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON btp.notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON btp.notifications(created_at);

-- =============================================================================
-- PARTIE 2 : POLITIQUES RLS (NOTIFICATIONS ET TÂCHES)
-- =============================================================================

-- 10. Suppression de toutes les politiques RLS existantes
DROP POLICY IF EXISTS "Users can update their own notifications" ON btp.notifications;
DROP POLICY IF EXISTS "Users can view their notifications" ON btp.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON btp.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON btp.notifications;

DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can update tasks assigned to them" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can view tasks they created" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can create task assignments" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can delete task assignments" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can view all assignments" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can manage task assignments" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can view assignments by project" ON btp.task_assignments;

-- 11. Activation de RLS
ALTER TABLE btp.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.notifications ENABLE ROW LEVEL SECURITY;

-- 12. Politiques pour les notifications
CREATE POLICY "Users can view their own notifications"
ON btp.notifications
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON btp.notifications
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

CREATE POLICY "Users can create notifications"
ON btp.notifications
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own notifications"
ON btp.notifications
FOR DELETE
TO authenticated
USING (recipient_id = auth.uid());

-- 13. Politiques pour les assignations de tâches (SANS dépendance à btp.tasks)
DO $$
DECLARE
    col_type TEXT;
BEGIN
    -- Vérifier le type de la colonne assigned_to
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_schema = 'btp'
    AND table_name = 'task_assignments'
    AND column_name = 'assigned_to';
    
    RAISE NOTICE 'Type de assigned_to: %', col_type;
    
    -- Politique SELECT
    IF col_type = 'ARRAY' OR col_type = 'uuid[]' OR col_type LIKE '%uuid%[]%' THEN
        -- Version tableau UUID[]
        CREATE POLICY "Users can view tasks assigned to them"
        ON btp.task_assignments
        FOR SELECT
        TO authenticated
        USING (
            auth.uid() = ANY(assigned_to) 
            OR assigned_by = auth.uid()
            OR project_id IN (
                SELECT id FROM btp.projects 
                WHERE created_by = auth.uid()
            )
        );
        
        CREATE POLICY "Users can update tasks assigned to them"
        ON btp.task_assignments
        FOR UPDATE
        TO authenticated
        USING (
            auth.uid() = ANY(assigned_to) 
            OR assigned_by = auth.uid()
            OR project_id IN (
                SELECT id FROM btp.projects 
                WHERE created_by = auth.uid()
            )
        )
        WITH CHECK (
            auth.uid() = ANY(assigned_to) 
            OR assigned_by = auth.uid()
            OR project_id IN (
                SELECT id FROM btp.projects 
                WHERE created_by = auth.uid()
            )
        );
        
        RAISE NOTICE '✅ Politiques créées avec ANY() pour tableau UUID[]';
    ELSE
        -- Version UUID simple
        CREATE POLICY "Users can view tasks assigned to them"
        ON btp.task_assignments
        FOR SELECT
        TO authenticated
        USING (
            assigned_to = auth.uid() 
            OR assigned_by = auth.uid()
            OR project_id IN (
                SELECT id FROM btp.projects 
                WHERE created_by = auth.uid()
            )
        );
        
        CREATE POLICY "Users can update tasks assigned to them"
        ON btp.task_assignments
        FOR UPDATE
        TO authenticated
        USING (
            assigned_to = auth.uid() 
            OR assigned_by = auth.uid()
            OR project_id IN (
                SELECT id FROM btp.projects 
                WHERE created_by = auth.uid()
            )
        )
        WITH CHECK (
            assigned_to = auth.uid() 
            OR assigned_by = auth.uid()
            OR project_id IN (
                SELECT id FROM btp.projects 
                WHERE created_by = auth.uid()
            )
        );
        
        RAISE NOTICE '✅ Politiques créées avec égalité directe pour UUID';
    END IF;
END $$;

-- 14. Politique pour voir les tâches créées
CREATE POLICY "Users can view tasks they created"
ON btp.task_assignments
FOR SELECT
TO authenticated
USING (assigned_by = auth.uid());

-- 15. Politique pour créer des assignations
CREATE POLICY "Users can create task assignments"
ON btp.task_assignments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 16. Politique pour supprimer des assignations (version simplifiée sans btp.tasks)
CREATE POLICY "Users can delete task assignments"
ON btp.task_assignments
FOR DELETE
TO authenticated
USING (
    assigned_by = auth.uid() 
    OR auth.uid() = ANY(assigned_to)
    OR project_id IN (
        SELECT id FROM btp.projects 
        WHERE created_by = auth.uid()
    )
);

-- 17. Politique pour voir les assignations d'un projet
CREATE POLICY "Users can view assignments by project"
ON btp.task_assignments
FOR SELECT
TO authenticated
USING (
    project_id IN (
        SELECT id FROM btp.projects 
        WHERE created_by = auth.uid()
    )
);

-- 18. Politique pour les admins (si table profiles existe)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) THEN
        -- Supprimer les politiques existantes pour éviter les conflits
        DROP POLICY IF EXISTS "Admins can manage all assignments" ON btp.task_assignments;
        DROP POLICY IF EXISTS "Admins can manage all notifications" ON btp.notifications;
        
        -- Créer la politique admin pour task_assignments
        CREATE POLICY "Admins can manage all assignments"
        ON btp.task_assignments
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'super_admin')
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'super_admin')
            )
        );
        
        -- Créer la politique admin pour notifications
        CREATE POLICY "Admins can manage all notifications"
        ON btp.notifications
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'super_admin')
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'super_admin')
            )
        );
        
        RAISE NOTICE '✅ Politiques admin ajoutées';
    END IF;
END $$;

-- =============================================================================
-- PARTIE 3 : TRIGGERS
-- =============================================================================

-- 19. Trigger pour updated_at sur task_assignments
CREATE OR REPLACE FUNCTION btp.update_task_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_task_assignments_updated_at ON btp.task_assignments;
CREATE TRIGGER trigger_task_assignments_updated_at
    BEFORE UPDATE ON btp.task_assignments
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_task_assignment_timestamp();

-- 20. Trigger pour updated_at sur notifications
CREATE OR REPLACE FUNCTION btp.update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON btp.notifications;
CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON btp.notifications
    FOR EACH ROW
    EXECUTE FUNCTION btp.update_notification_timestamp();

-- =============================================================================
-- PARTIE 4 : DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE btp.task_assignments IS 'Table des assignations de tâches pour les projets BTP';
COMMENT ON TABLE btp.notifications IS 'Table des notifications pour les utilisateurs';

COMMENT ON COLUMN btp.task_assignments.id IS 'Identifiant unique de l''assignation';
COMMENT ON COLUMN btp.task_assignments.id IS 'ID de la tâche assignée';
COMMENT ON COLUMN btp.task_assignments.project_id IS 'ID du projet associé (pour les politiques RLS)';
COMMENT ON COLUMN btp.task_assignments.assigned_to IS 'ID universel de l''assigné - peut référencer employees.id, suppliers.id ou profiles.id. Utiliser assignee_type pour déterminer la table.';
COMMENT ON COLUMN btp.task_assignments.assignee_type IS 'Type de l''assigné: supplier (fournisseur), employee (employé), user (utilisateur) ou team (équipe)';
COMMENT ON COLUMN btp.task_assignments.assignee_name IS 'Nom stocké en direct pour éviter les JOINs complexes';
COMMENT ON COLUMN btp.task_assignments.assignee_email IS 'Email stocké en direct pour les notifications';
COMMENT ON COLUMN btp.task_assignments.assigned_by IS 'ID de l''utilisateur qui a créé l''assignation (référence profiles.id ou auth.users.id)';
COMMENT ON COLUMN btp.task_assignments.status IS 'Statut de l''assignation: pending (en attente), accepted (acceptée), rejected (rejetée), completed (terminée)';
COMMENT ON COLUMN btp.task_assignments.assigned_at IS 'Date et heure de l''assignation';
COMMENT ON COLUMN btp.task_assignments.responded_at IS 'Date et heure de la réponse à l''assignation';
COMMENT ON COLUMN btp.task_assignments.created_at IS 'Date et heure de création';
COMMENT ON COLUMN btp.task_assignments.updated_at IS 'Date et heure de dernière mise à jour';

COMMENT ON COLUMN btp.notifications.id IS 'Identifiant unique de la notification';
COMMENT ON COLUMN btp.notifications.recipient_id IS 'ID du destinataire de la notification';
COMMENT ON COLUMN btp.notifications.notification_type IS 'Type de notification (task_assigned, task_updated, project_created, etc.)';
COMMENT ON COLUMN btp.notifications.title IS 'Titre de la notification';
COMMENT ON COLUMN btp.notifications.content IS 'Contenu de la notification';
COMMENT ON COLUMN btp.notifications.read_at IS 'Date et heure de lecture de la notification (NULL si non lue)';
COMMENT ON COLUMN btp.notifications.metadata IS 'Métadonnées JSON supplémentaires';
COMMENT ON COLUMN btp.notifications.created_at IS 'Date et heure de création';
COMMENT ON COLUMN btp.notifications.updated_at IS 'Date et heure de dernière mise à jour';

-- Vérification finale
SELECT 
    '✅ Migration final_merge_assignees_notifications_and_policies terminée avec succès' AS status,
    CURRENT_TIMESTAMP AS completed_at;

COMMIT;

-- =============================================================================
-- FIN DE LA MIGRATION
-- =============================================================================