-- ============================================================================
-- Migration : Ajout de la policy INSERT manquante sur le bucket 'documents'
-- ============================================================================
-- Contexte :
--   Le bucket 'documents' disposait de policies SELECT, UPDATE, DELETE
--   mais AUCUNE policy INSERT. Résultat : toute tentative d'upload
--   (POST /storage/v1/object/documents/...) était rejetée avec :
--     403 Unauthorized - "new row violates row-level security policy"
--
-- Solution :
--   Ajout de la policy INSERT alignée sur le modèle existant
--   (owner = auth.uid(), bucket_id = 'documents').
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Policy 1 : Le propriétaire (uploader) peut insérer ses propres fichiers
-- ---------------------------------------------------------------------------
CREATE POLICY "Owners can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND auth.uid() = owner
);

-- ---------------------------------------------------------------------------
-- Policy 2 (fallback) : Les rôles applicatifs autorisés peuvent uploader
-- ---------------------------------------------------------------------------
-- Nécessaire si l'upload est déclenché par un service / edge function
-- où owner ne correspond pas à auth.uid().
-- ---------------------------------------------------------------------------
CREATE POLICY "Authorized roles can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND status = 'active'
      AND role_name IN ('admin', 'director', 'manager', 'agent', 'super_admin')
  )
);

-- ============================================================================
-- Vérifications post-migration (à exécuter manuellement) :
--
--   SELECT policyname, cmd, with_check
--   FROM pg_policies
--   WHERE schemaname = 'storage'
--     AND tablename = 'objects'
--     AND cmd = 'INSERT'
--   ORDER BY policyname;
--
-- Attendu : 3 lignes
--   - Authenticated uploads to prospect_documents
--   - Owners can upload documents                (nouvelle)
--   - Authorized roles can upload documents      (nouvelle)
-- ============================================================================