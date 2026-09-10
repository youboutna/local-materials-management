-- =============================================================================
-- MIGRATION: drop_assignee_id_fixed
-- Description: Supprime la colonne redondante assignee_id de btp.task_assignments
-- Date: 2025-08-05
-- =============================================================================

-- 1. Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view their own task assignments" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can update their own task assignments" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can delete their own task assignments" ON btp.task_assignments;
DROP POLICY IF EXISTS "Suppliers can view their assigned tasks" ON btp.task_assignments;
DROP POLICY IF EXISTS "Employees can view their assigned tasks" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON btp.task_assignments;
DROP POLICY IF EXISTS "Users can update tasks assigned to them" ON btp.task_assignments;

-- 2. Supprimer la colonne assignee_id
ALTER TABLE btp.task_assignments 
DROP COLUMN IF EXISTS assignee_id;

-- 3. Si assigned_to est de type UUID, le convertir en UUID[] avec ARRAY
DO $$
BEGIN
    -- Vérifier le type de la colonne
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'btp' 
          AND table_name = 'task_assignments' 
          AND column_name = 'assigned_to'
          AND data_type = 'uuid'
    ) THEN
        -- Ajouter une colonne temporaire
        ALTER TABLE btp.task_assignments 
        ADD COLUMN assigned_to_array UUID[] DEFAULT '{}';
        
        -- Migrer les données
        UPDATE btp.task_assignments 
        SET assigned_to_array = ARRAY[assigned_to] 
        WHERE assigned_to IS NOT NULL;
        
        -- Supprimer l'ancienne colonne
        ALTER TABLE btp.task_assignments 
        DROP COLUMN assigned_to;
        
        -- Renommer la nouvelle colonne
        ALTER TABLE btp.task_assignments 
        RENAME COLUMN assigned_to_array TO assigned_to;
    END IF;
END $$;

-- 4. Recréer les politiques RLS
DROP POLICY IF EXISTS "Users can view their own task assignments" ON btp.task_assignments;
CREATE POLICY "Users can view their own task assignments" ON btp.task_assignments
FOR SELECT USING (
  auth.uid() = ANY(COALESCE(assigned_to, ARRAY[]::UUID[]))
);

DROP POLICY IF EXISTS "Users can update their own task assignments" ON btp.task_assignments;
CREATE POLICY "Users can update their own task assignments" ON btp.task_assignments
FOR UPDATE USING (
  auth.uid() = ANY(COALESCE(assigned_to, ARRAY[]::UUID[]))
);

DROP POLICY IF EXISTS "Users can delete their own task assignments" ON btp.task_assignments;
CREATE POLICY "Users can delete their own task assignments" ON btp.task_assignments
FOR DELETE USING (
  auth.uid() = ANY(COALESCE(assigned_to, ARRAY[]::UUID[]))
);

-- 5. Politique INSERT
DROP POLICY IF EXISTS "Users can insert task assignments" ON btp.task_assignments;
CREATE POLICY "Users can insert task assignments" ON btp.task_assignments
FOR INSERT WITH CHECK (true);

-- 6. Politique SELECT pour tous (vue admin)
DROP POLICY IF EXISTS "Users can view all task assignments" ON btp.task_assignments;
CREATE POLICY "Users can view all task assignments" ON btp.task_assignments
FOR SELECT USING (true);

-- 7. Vérifier la structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'btp'
  AND table_name = 'task_assignments'
ORDER BY ordinal_position;