-- =============================================================================
-- MIGRATION: cleanup_project_phases
-- Description: Nettoie et corrige la table btp.project_phases
-- =============================================================================

DO $$
BEGIN
    -- Vérifier si la table project_phases existe dans btp schema
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'btp' 
        AND tablename = 'project_phases'
    ) THEN
        
        -- 1. Nettoyer les données invalides
        -- Supprimer les lignes avec project_id NULL
        DELETE FROM btp.project_phases WHERE project_id IS NULL;
        RAISE NOTICE '✅ Lignes avec project_id NULL supprimées';
        
        -- Supprimer les lignes avec project_id vide
        DELETE FROM btp.project_phases WHERE project_id::text = '';
        RAISE NOTICE '✅ Lignes avec project_id vide supprimées';
        
        -- Supprimer les lignes avec project_id invalide
        DELETE FROM btp.project_phases WHERE project_id::text = '00000000-0000-0000-0000-000000000000';
        RAISE NOTICE '✅ Lignes avec project_id invalide supprimées';
        
        -- 2. Mettre à jour created_by si la colonne existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'btp' 
            AND table_name = 'project_phases' 
            AND column_name = 'created_by'
        ) THEN
            UPDATE btp.project_phases 
            SET created_by = NULL 
            WHERE created_by IS NOT NULL 
            AND created_by::text = '';
            RAISE NOTICE '✅ created_by vides mis à NULL';
        END IF;
        
        -- 3. Ajouter les contraintes NOT NULL si elles n'existent pas
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'btp' 
            AND table_name = 'project_phases' 
            AND column_name = 'project_id' 
            AND is_nullable = 'YES'
        ) THEN
            ALTER TABLE btp.project_phases ALTER COLUMN project_id SET NOT NULL;
            RAISE NOTICE '✅ project_id SET NOT NULL';
        END IF;
        
        -- 4. Gérer la clé étrangère pour project_id
        ALTER TABLE btp.project_phases 
        DROP CONSTRAINT IF EXISTS project_phases_project_id_fkey;
        
        ALTER TABLE btp.project_phases 
        ADD CONSTRAINT project_phases_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES btp.projects(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Foreign key project_id recréée';
        
        -- 5. Créer les index pour les performances
        CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON btp.project_phases(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_phases_status ON btp.project_phases(status);
        RAISE NOTICE '✅ Index créés';
        
        -- 6. Ajouter les contraintes NOT NULL pour phase_name et phase_type si elles existent
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'btp' 
            AND table_name = 'project_phases' 
            AND column_name = 'phase_name'
        ) THEN
            ALTER TABLE btp.project_phases ALTER COLUMN phase_name SET NOT NULL;
            RAISE NOTICE '✅ phase_name SET NOT NULL';
        END IF;
        
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'btp' 
            AND table_name = 'project_phases' 
            AND column_name = 'phase_type'
        ) THEN
            ALTER TABLE btp.project_phases ALTER COLUMN phase_type SET NOT NULL;
            RAISE NOTICE '✅ phase_type SET NOT NULL';
        END IF;
        
        RAISE NOTICE '✅ Nettoyage de btp.project_phases terminé avec succès';
    ELSE
        RAISE NOTICE '⏭️ Table btp.project_phases n''existe pas - migration ignorée';
    END IF;
END $$;