-- =============================================================================
-- MIGRATION: add_supplier_id_to_documents
-- Description: Lier les documents aux fournisseurs et nettoyer l'ancienne colonne
-- =============================================================================

-- 1. Ajout de la colonne supplier_id à la table documents
ALTER TABLE btp.documents 
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES btp.suppliers(id) ON DELETE CASCADE;

-- 2. Création de l'index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_documents_supplier_id ON btp.documents(supplier_id);

-- 3. Ajout de la valeur 'supplier_catalog' à l'ENUM document_type (CORRECTION ULTIME)
-- Cette requête trouve le type, quel que soit son schéma (public, btp, etc.), et ajoute la valeur.
DO $$ 
DECLARE
  enum_schema text;
  enum_name text := 'document_type';
  new_value text := 'supplier_catalog';
BEGIN
  -- Trouver le schéma et le nom exact du type enum
  SELECT n.nspname, t.typname INTO enum_schema, enum_name
  FROM pg_type t
  JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE t.typname = 'document_type'
  LIMIT 1;

  -- Si le type existe, vérifier si la valeur existe déjà
  IF enum_schema IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'document_type'
        AND e.enumlabel = new_value
    ) THEN
      -- Ajouter la valeur en utilisant le schéma détecté dynamiquement
      EXECUTE format('ALTER TYPE %I.%I ADD VALUE %L', enum_schema, enum_name, new_value);
    END IF;
  END IF;
END $$;

-- 4. Suppression de la colonne obsolète model_documents
ALTER TABLE btp.suppliers 
DROP COLUMN IF EXISTS model_documents;