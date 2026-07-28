/**
-- =============================================================================
-- MIGRATION: fix_phases_trigger
-- Description: Corrige le trigger de btp.phases
-- =============================================================================

-- 1. Vérifier que la table phases existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'btp' AND tablename = 'phases') THEN
        
        -- 2. Créer ou remplacer la fonction update_timestamp
        CREATE OR REPLACE FUNCTION btp.update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- 3. Ajouter le trigger si il n'existe pas
        IF NOT EXISTS (SELECT 1 FROM pg_trigger 
                       WHERE tgname = 'update_phases_timestamp' 
                       AND tgrelid = 'btp.phases'::regclass) THEN
            CREATE TRIGGER update_phases_timestamp
                BEFORE UPDATE ON btp.phases
                FOR EACH ROW
                EXECUTE FUNCTION btp.update_timestamp();
        END IF;

        RAISE NOTICE '✅ Trigger et fonction corrigés pour btp.phases';
    ELSE
        RAISE NOTICE '⏭️ Table btp.phases n''existe pas';
    END IF;
END $$;
**/