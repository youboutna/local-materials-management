-- Migration: timestemps012451_add
-- Objectif : Ajouter la colonne "description" à la table btp.project_alerts
-- Résout l'erreur : ERROR: column "description" does not exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'btp'
          AND table_name = 'project_alerts'
          AND column_name = 'description'
    ) THEN
        ALTER TABLE btp.project_alerts
        ADD COLUMN description TEXT;
    END IF;
END $$;

-- Optionnel : si vous voulez aussi corriger la requête UPDATE en base,
-- vous pouvez la réécrire pour utiliser la nouvelle colonne, mais le code applicatif
-- doit également être mis à jour. Le correctif permanent est d'utiliser
-- COALESCE(message, description, title) avec la colonne existante.