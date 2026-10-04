-- ============================================================
-- MIGRATION : Politiques RLS pour tender_sharing_secrets et tender_access_logs
-- Version corrigée avec les comportements métier
-- Date : 22 août 2026
-- ============================================================

-- 1. Activer RLS sur les tables
ALTER TABLE btp.tender_sharing_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE btp.tender_access_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLITIQUES POUR tender_sharing_secrets
-- ============================================================

-- 1.1. SELECT – Tous les utilisateurs authentifiés peuvent voir les secrets
CREATE POLICY "authenticated_users_can_view_secrets"
ON btp.tender_sharing_secrets
FOR SELECT
TO authenticated
USING (true);

-- 1.2. INSERT – Tous les utilisateurs authentifiés peuvent créer des secrets
-- (inclut les fournisseurs)
CREATE POLICY "authenticated_users_can_insert_secrets"
ON btp.tender_sharing_secrets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 1.3. UPDATE – Seuls les rôles internes (admin, manager, director, consultant) peuvent modifier
-- Le fournisseur ne peut pas modifier ses secrets après création
CREATE POLICY "internal_roles_can_update_secrets"
ON btp.tender_sharing_secrets
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'manager', 'director', 'engineering_consultant', 'consultant')
)
WITH CHECK (
  auth.jwt() ->> 'role' IN ('admin', 'manager', 'director', 'engineering_consultant', 'consultant')
);

-- 1.4. DELETE – Seuls les rôles internes peuvent supprimer les secrets
-- Le fournisseur ne peut pas supprimer ses secrets
CREATE POLICY "internal_roles_can_delete_secrets"
ON btp.tender_sharing_secrets
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'manager', 'director', 'engineering_consultant', 'consultant')
);

-- ============================================================
-- POLITIQUES POUR tender_access_logs
-- ============================================================

-- 2.1. INSERT – Tous les utilisateurs authentifiés peuvent journaliser leurs actions
CREATE POLICY "authenticated_users_can_insert_access_logs"
ON btp.tender_access_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 2.2. SELECT – Les rôles internes peuvent voir tous les logs
CREATE POLICY "internal_roles_can_view_all_access_logs"
ON btp.tender_access_logs
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' IN ('admin', 'manager', 'director', 'engineering_consultant', 'consultant')
);

-- 2.3. SELECT – Les fournisseurs peuvent voir leurs propres logs (via accessed_by = leur email)
CREATE POLICY "suppliers_can_view_own_access_logs"
ON btp.tender_access_logs
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'supplier'
  AND accessed_by = auth.email()
);

-- 2.4. SELECT – Les fournisseurs peuvent voir les logs des secrets qu'ils ont créés
CREATE POLICY "suppliers_can_view_their_secret_logs"
ON btp.tender_access_logs
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'supplier'
  AND EXISTS (
    SELECT 1 FROM btp.tender_sharing_secrets tss
    WHERE tss.id = sharing_secret_id
    AND tss.supplier_email = auth.email()
  )
);

-- ============================================================
-- POLITIQUE SUPPLÉMENTAIRE : Le fournisseur ne peut pas modifier ses secrets
-- (protection supplémentaire)
-- ============================================================

-- Bloquer explicitement les mises à jour par le fournisseur
CREATE POLICY "block_supplier_updates"
ON btp.tender_sharing_secrets
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' != 'supplier'
)
WITH CHECK (
  auth.jwt() ->> 'role' != 'supplier'
);

-- Bloquer explicitement les suppressions par le fournisseur
CREATE POLICY "block_supplier_deletes"
ON btp.tender_sharing_secrets
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'role' != 'supplier'
);