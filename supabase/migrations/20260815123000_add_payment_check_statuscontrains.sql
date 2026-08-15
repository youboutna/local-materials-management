-- ============================================================
-- Migration : Ajout de la colonne status et contrainte élargie
-- ============================================================

-- 1. Ajouter la colonne status si elle n'existe pas
ALTER TABLE btp.payments ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- 2. Supprimer l'ancienne contrainte si elle existe
ALTER TABLE btp.payments DROP CONSTRAINT IF EXISTS payments_status_check;

-- 3. Ajouter la nouvelle contrainte avec tous les statuts possibles
ALTER TABLE btp.payments ADD CONSTRAINT payments_status_check
CHECK (status IN (
  'pending',
  'approved',
  'rejected',
  'blocked',
  'paid',
  'cancelled',
  'requested',
  'pending_validation',
  'validated',
  'processing',
  'completed',
  'failed',
  'refunded',
  'manual'
));

-- 4. Définir une valeur par défaut (au cas où elle serait NULL)
ALTER TABLE btp.payments ALTER COLUMN status SET DEFAULT 'pending';