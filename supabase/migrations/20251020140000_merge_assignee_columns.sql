-- =============================================================================
-- MIGRATION: final_merge_assignees_notifications_and_policies
-- Description: Fusion complète de la gestion des assignations et des politiques RLS
-- =============================================================================

-- PARTIE 1 : STRUCTURE DES COLONNES
-- =============================================================================

-- 1. Ajout des colonnes universelles pour les assignations
ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS assignee_id UUID;

ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS assignee_type TEXT CHECK (assignee_type IN ('supplier', 'employee', 'user'));

ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS assignee_name TEXT;

ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS assignee_email TEXT;

-- 2. Ajout de la colonne assigned_by (CRUCIAL : elle manquait et est utilisée dans les politiques)
ALTER TABLE btp.task_assignments 
ADD COLUMN IF NOT EXISTS assigned_by UUID;

-- 3. Suppression des anciennes colonnes spécifiques aux rôles
ALTER TABLE btp.task_assignments 
DROP COLUMN IF EXISTS assigned_employee_id,
DROP COLUMN IF EXISTS assigned_supplier_id,
DROP COLUMN IF EXISTS assigned_profile_id;

-- 4. Création des index pour les performances
CREATE INDEX IF NOT EXISTS idx_task_assignments_assignee ON btp.task_assignments(assignee_id, assignee_type);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assignee_type ON btp.task_assignments(assignee_type);


-- PARTIE 2 : POLITIQUES RLS (NOTIFICATIONS ET TÂCHES)
-- =============================================================================

-- 5. Suppression de toutes les politiques RLS existantes
DROP POLICY IF EXISTS "Users can update their own notifications" ON btp.notifications;

DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can update tasks assigned to them" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can view tasks they created" ON btp.task_assignments;

-- 6. Recréation des politiques pour les notifications
CREATE POLICY "Users can update their own notifications"
ON btp.notifications
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- 7. Recréation des politiques pour les tâches
CREATE POLICY "Users can view tasks assigned to them"
ON btp.task_assignments
FOR SELECT
TO authenticated
USING (assignee_id = auth.uid());

CREATE POLICY "Users can update tasks assigned to them"
ON btp.task_assignments
FOR UPDATE
TO authenticated
USING (assignee_id = auth.uid())
WITH CHECK (assignee_id = auth.uid());

CREATE POLICY "Users can view tasks they created"
ON btp.task_assignments
FOR SELECT
TO authenticated
USING (assigned_by = auth.uid());


-- PARTIE 3 : DOCUMENTATION
-- =============================================================================

COMMENT ON COLUMN btp.task_assignments.assignee_id IS 'ID universel de l''assigné - peut référencer employees.id, suppliers.id ou profiles.id. Utiliser assignee_type pour déterminer la table.';
COMMENT ON COLUMN btp.task_assignments.assignee_type IS 'Type de l''assigné: supplier (fournisseur), employee (employé), ou user (utilisateur)';
COMMENT ON COLUMN btp.task_assignments.assignee_name IS 'Nom stocké en direct pour éviter les JOINs complexes';
COMMENT ON COLUMN btp.task_assignments.assignee_email IS 'Email stocké en direct pour les notifications';
COMMENT ON COLUMN btp.task_assignments.assigned_by IS 'ID de l''utilisateur qui a créé l''assignation (référence profiles.id ou auth.users.id)';