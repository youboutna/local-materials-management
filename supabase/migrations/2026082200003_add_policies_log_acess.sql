-- ============================================================
-- MIGRATION : Politiques RLS pour tender_access_logs
-- Date : 22 août 2026
-- ============================================================

-- 1. Activer RLS (si ce n'est pas déjà fait)
ALTER TABLE btp.tender_access_logs ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques (si elles existent)
DROP POLICY IF EXISTS "authenticated_users_can_insert_access_logs" ON btp.tender_access_logs;
DROP POLICY IF EXISTS "internal_roles_can_view_all_access_logs" ON btp.tender_access_logs;
DROP POLICY IF EXISTS "suppliers_can_view_own_access_logs" ON btp.tender_access_logs;
DROP POLICY IF EXISTS "suppliers_can_view_their_secret_logs" ON btp.tender_access_logs;

-- ============================================================
-- NOUVELLES POLITIQUES
-- ============================================================

-- 2.1. INSERT – Tous les utilisateurs authentifiés peuvent journaliser leurs actions
-- (inclut les fournisseurs qui génèrent des secrets)
CREATE POLICY "authenticated_users_can_insert_access_logs"
ON btp.tender_access_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2.2. SELECT – Les rôles internes (admin, manager, director, consultant) peuvent voir TOUS les logs
CREATE POLICY "internal_roles_can_view_all_access_logs"
ON btp.tender_access_logs
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'manager', 'director', 'engineering_consultant', 'consultant')
);

-- 2.3. SELECT – Les fournisseurs peuvent voir leurs PROPRES logs
-- (les logs où ils sont l'émetteur 'shared_by' ou le destinataire 'accessed_by')
CREATE POLICY "suppliers_can_view_own_logs"
ON btp.tender_access_logs
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'supplier'
  AND (
    shared_by = auth.email()
    OR accessed_by = auth.email()
  )
);

-- 2.4. SELECT – Les fournisseurs peuvent voir les logs des secrets qu'ils ont créés
-- (via la relation avec tender_sharing_secrets)
CREATE POLICY "suppliers_can_view_their_secret_logs"
ON btp.tender_access_logs
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'supplier'
  AND EXISTS (
    SELECT 1 FROM btp.tender_sharing_secrets tss
    WHERE tss.id = btp.tender_access_logs.sharing_secret_id
    AND tss.supplier_email = auth.email()
  )
);