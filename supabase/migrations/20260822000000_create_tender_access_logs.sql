-- ============================================================
-- MIGRATION : Table tender_access_logs (v2)
-- Date : 22 août 2026
-- Description : Journalisation complète des accès aux codes secrets
-- ============================================================

-- 1. Supprimer l'ancienne table si elle existe (pour recréer proprement)
DROP TABLE IF EXISTS btp.tender_access_logs CASCADE;

-- 2. Création de la table avec toutes les colonnes nécessaires
CREATE TABLE btp.tender_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sharing_secret_id UUID NOT NULL,
  
  -- Informations sur l'accès
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  action_type TEXT DEFAULT 'share',
  
  -- Destinataire
  accessed_by TEXT,                    -- Email du destinataire (peut être modifié)
  recipient_id UUID,                   -- UUID du fournisseur (si connu)
  recipient_name TEXT,                 -- Nom du fournisseur
  is_email_modified BOOLEAN DEFAULT FALSE, -- TRUE si l'email diffère de l'email officiel
  
  -- Émetteur
  shared_by TEXT,                      -- Email de l'émetteur
  sender_name TEXT,                    -- Nom de l'émetteur
  sender_id UUID,                      -- UUID de l'émetteur
  
  -- Contexte
  secret_code TEXT,                    -- Le code secret partagé
  tender_id UUID,                      -- ID de l'appel d'offres
  tender_title TEXT,                   -- Titre de l'appel d'offres
  expires_at TIMESTAMP WITH TIME ZONE, -- Date d'expiration du code
  message TEXT,                        -- Message optionnel
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Index pour les recherches fréquentes
CREATE INDEX idx_tender_access_logs_secret_id ON btp.tender_access_logs(sharing_secret_id);
CREATE INDEX idx_tender_access_logs_accessed_at ON btp.tender_access_logs(accessed_at);
CREATE INDEX idx_tender_access_logs_recipient_id ON btp.tender_access_logs(recipient_id);
CREATE INDEX idx_tender_access_logs_sender_id ON btp.tender_access_logs(sender_id);
CREATE INDEX idx_tender_access_logs_tender_id ON btp.tender_access_logs(tender_id);
CREATE INDEX idx_tender_access_logs_secret_code ON btp.tender_access_logs(secret_code);

-- 4. Clé étrangère vers tender_sharing_secrets
ALTER TABLE btp.tender_access_logs
ADD CONSTRAINT fk_tender_access_logs_secret
FOREIGN KEY (sharing_secret_id)
REFERENCES btp.tender_sharing_secrets(id)
ON DELETE CASCADE;

-- 5. Commentaires
COMMENT ON TABLE btp.tender_access_logs IS 'Journal des partages de codes secrets d''appels d''offres';
COMMENT ON COLUMN btp.tender_access_logs.accessed_by IS 'Email du destinataire (peut être modifié manuellement)';
COMMENT ON COLUMN btp.tender_access_logs.recipient_id IS 'UUID du fournisseur destinataire (si connu)';
COMMENT ON COLUMN btp.tender_access_logs.is_email_modified IS 'TRUE si l''email saisi diffère de l''email officiel du fournisseur';
COMMENT ON COLUMN btp.tender_access_logs.shared_by IS 'Email de l''émetteur';
COMMENT ON COLUMN btp.tender_access_logs.sender_id IS 'UUID de l''émetteur';
COMMENT ON COLUMN btp.tender_access_logs.secret_code IS 'Le code secret partagé (pour référence)';