-- =============================================================================
-- MIGRATION: create_stock_movements_table
-- Description: Création de la table btp.stock_movements pour la gestion des stocks
-- =============================================================================

-- 1. Création du type ENUM pour le statut de validation
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'movement_validation_status') THEN
    CREATE TYPE movement_validation_status AS ENUM ('pending', 'validated', 'rejected');
  END IF;
END $$;

-- 2. Création de la table stock_movements
CREATE TABLE IF NOT EXISTS btp.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stock_id UUID,
    source_stock_id UUID,
    destination_stock_id UUID,
    
    -- Informations produit & lieu
    label_prod_fr TEXT,
    label_prod_ar TEXT,
    label_vill_fr TEXT,
    label_vill_ar TEXT,
    origin_code TEXT,
    destination TEXT,
    destination_code TEXT,
    
    -- Données financières et quantités
    quantity NUMERIC(15,2),
    unit_price NUMERIC(15,2),
    total_value NUMERIC(15,2),
    prix_base NUMERIC(15,2),
    tarif_unit NUMERIC(15,2),
    index_km NUMERIC(10,2),
    
    -- Mouvement
    movement_type TEXT CHECK (movement_type IN ('in', 'out', 'transfer', 'adjustment', 'return')),
    movement_date TIMESTAMPTZ DEFAULT NOW(),
    reference TEXT,
    rec_id TEXT,
    supplier TEXT,
    notes TEXT,
    
    -- Validation (utilise l'ENUM créé ci-dessus)
    validation_status movement_validation_status DEFAULT 'pending',
    validated_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMPTZ,
    rejection_reason TEXT,
    
    -- Métadonnées système
    recorded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Activation de la sécurité RLS
ALTER TABLE btp.stock_movements ENABLE ROW LEVEL SECURITY;

-- 4. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_stock_movements_stock_id ON btp.stock_movements(stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_source_stock_id ON btp.stock_movements(source_stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_destination_stock_id ON btp.stock_movements(destination_stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_movement_date ON btp.stock_movements(movement_date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_validation_status ON btp.stock_movements(validation_status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_recorded_by ON btp.stock_movements(recorded_by);

-- 5. Trigger de mise à jour automatique du timestamp
CREATE OR REPLACE FUNCTION btp.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stock_movements_updated_at ON btp.stock_movements;
CREATE TRIGGER update_stock_movements_updated_at
  BEFORE UPDATE ON btp.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION btp.update_updated_at_column();

-- 6. Politiques RLS (sécurisées pour les rôles)
-- Lecture : tout le monde peut lire, mais pas les données sensibles (validé par RLS + Grant)
DROP POLICY IF EXISTS "Enable read for authenticated users" ON btp.stock_movements;
CREATE POLICY "Enable read for authenticated users" ON btp.stock_movements
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON btp.stock_movements;
CREATE POLICY "Enable insert for authenticated users" ON btp.stock_movements
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON btp.stock_movements;
CREATE POLICY "Enable update for authenticated users" ON btp.stock_movements
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON btp.stock_movements;
CREATE POLICY "Enable delete for authenticated users" ON btp.stock_movements
  FOR DELETE TO authenticated
  USING (true);

-- 7. Commentaires de documentation
COMMENT ON TABLE btp.stock_movements IS 'Mouvements de stock (entrées, sorties, transferts)';
COMMENT ON COLUMN btp.stock_movements.stock_id IS 'ID du stock concerné (si mouvement unitaire)';
COMMENT ON COLUMN btp.stock_movements.source_stock_id IS 'ID du stock source (pour transfert)';
COMMENT ON COLUMN btp.stock_movements.destination_stock_id IS 'ID du stock destination (pour transfert)';
COMMENT ON COLUMN btp.stock_movements.quantity IS 'Quantité déplacée';
COMMENT ON COLUMN btp.stock_movements.unit_price IS 'Prix unitaire du produit';
COMMENT ON COLUMN btp.stock_movements.movement_type IS 'Type de mouvement: in, out, transfer, adjustment, return';
COMMENT ON COLUMN btp.stock_movements.movement_date IS 'Date du mouvement';
COMMENT ON COLUMN btp.stock_movements.validation_status IS 'Statut de validation (pending, validated, rejected)';
COMMENT ON COLUMN btp.stock_movements.validation_status IS 'Statut de validation (pending, validated, rejected)';