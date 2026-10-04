-- ============================================================
-- MIGRATION : Politique RLS pour tender_access_logs
-- Date : 22 août 2026
-- ============================================================

-- Activer RLS (si ce n'est pas déjà fait)
ALTER TABLE btp.tender_access_logs ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques (si elles existent)
DROP POLICY IF EXISTS "authenticated_users_can_insert_access_logs" ON btp.tender_access_logs;

-- Créer une politique qui autorise les INSERTIONS par tout utilisateur authentifié
CREATE POLICY "authenticated_users_can_insert_access_logs"
ON btp.tender_access_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Vérifier que la politique est créée
SELECT * FROM pg_policies WHERE tablename = 'tender_access_logs';