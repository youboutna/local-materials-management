-- =============================================================================
-- MIGRATION: 20260910120000_user_roles_status_alignment.sql
-- Description:
--   - Normalise la table public.user_roles
--   - Aligne le CHECK constraint sur les valeurs métier attendues
--   - Ajoute les index manquants
--   - Ajoute la fonction btp.update_updated_at_column si absente
--   - Met à jour les données existantes (status invalides)
--
-- Prérequis :
--   - Schéma public existe
--   - Table public.user_roles existe déjà (structure minimale)
--
-- Idempotente : peut être ré-exécutée sans erreur.
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. S'ASSURER QUE LA COLONNE status EXISTE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE public.user_roles
      ADD COLUMN status text DEFAULT 'active'::text;
  END IF;
END $$;

-- =============================================================================
-- 2. S'ASSURER QUE LA COLONNE expired_at EXISTE
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
      AND column_name = 'expired_at'
  ) THEN
    ALTER TABLE public.user_roles
      ADD COLUMN expired_at timestamptz;
  END IF;
END $$;

-- =============================================================================
-- 3. NORMALISER LES DONNÉES EXISTANTES (avant de poser le CHECK)
-- =============================================================================

-- 3.1 : Mapper les valeurs non conformes vers 'inactive'
UPDATE public.user_roles
SET status = 'inactive'
WHERE status IS NOT NULL
  AND status NOT IN ('active', 'pending', 'inactive');

-- 3.2 : Mettre une valeur par défaut sur les NULL
UPDATE public.user_roles
SET status = 'active'
WHERE status IS NULL;

-- =============================================================================
-- 4. ALIGNER LE CHECK CONSTRAINT
-- =============================================================================

DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_status_check'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    ALTER TABLE public.user_roles
      DROP CONSTRAINT user_roles_status_check;
  END IF;

  -- Recréer avec les bonnes valeurs
  ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_status_check
    CHECK (status = ANY (ARRAY['active'::text, 'pending'::text, 'inactive'::text]));
END $$;

-- =============================================================================
-- 5. INDEX DE PERFORMANCE
-- =============================================================================

-- Index sur user_id (recherche fréquente par utilisateur)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON public.user_roles (user_id);

-- Index sur role_name (recherche par rôle)
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name
  ON public.user_roles (role_name);

-- Index sur status (filtres par statut)
CREATE INDEX IF NOT EXISTS idx_user_roles_status
  ON public.user_roles (status);

-- Index sur expired_at (nettoyage des rôles expirés)
CREATE INDEX IF NOT EXISTS idx_user_roles_expired_at
  ON public.user_roles (expired_at)
  WHERE expired_at IS NOT NULL;

-- Index composite (user_id, status, expired_at) pour getActiveUserRoles
CREATE INDEX IF NOT EXISTS idx_user_roles_active_lookup
  ON public.user_roles (user_id, status)
  WHERE status = 'active';

-- =============================================================================
-- 6. S'ASSURER QUE RLS EST ACTIVÉ
-- =============================================================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 7. (RE)CRÉER LES POLITIQUES RLS
-- =============================================================================

-- Supprimer les politiques existantes pour éviter les doublons
DROP POLICY IF EXISTS "user_roles_select_own_or_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_insert_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_update_admin" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_delete_admin" ON public.user_roles;

-- Policy SELECT : un user voit ses propres rôles + les admins voient tout
CREATE POLICY "user_roles_select_own_or_admin"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = auth.uid()
      AND ur2.role_name IN ('admin', 'super_admin')
      AND ur2.status = 'active'
      AND (ur2.expired_at IS NULL OR ur2.expired_at > now())
  )
);

-- Policy INSERT : seuls les admins peuvent créer
CREATE POLICY "user_roles_insert_admin"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('admin', 'super_admin')
      AND ur.status = 'active'
      AND (ur.expired_at IS NULL OR ur.expired_at > now())
  )
);

-- Policy UPDATE : seuls les admins peuvent modifier
CREATE POLICY "user_roles_update_admin"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('admin', 'super_admin')
      AND ur.status = 'active'
      AND (ur.expired_at IS NULL OR ur.expired_at > now())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('admin', 'super_admin')
      AND ur.status = 'active'
      AND (ur.expired_at IS NULL OR ur.expired_at > now())
  )
);

-- Policy DELETE : seuls les admins peuvent supprimer
CREATE POLICY "user_roles_delete_admin"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role_name IN ('admin', 'super_admin')
      AND ur.status = 'active'
      AND (ur.expired_at IS NULL OR ur.expired_at > now())
  )
);

-- =============================================================================
-- 8. FONCTION & TRIGGER POUR updated_at (SI NÉCESSAIRE)
-- =============================================================================

-- Note : public.user_roles n'a pas de colonne updated_at actuellement.
-- Si vous voulez en ajouter une, décommenter :

-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_schema = 'public'
--       AND table_name = 'user_roles'
--       AND column_name = 'updated_at'
--   ) THEN
--     ALTER TABLE public.user_roles
--       ADD COLUMN updated_at timestamptz DEFAULT now();
--   END IF;
-- END $$;

-- =============================================================================
-- 9. FONCTION DE NETTOYAGE DES RÔLES EXPIRÉS (OPTIONNEL)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_user_roles()
RETURNS integer AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.user_roles
  SET status = 'inactive'
  WHERE status = 'active'
    AND expired_at IS NOT NULL
    AND expired_at < now();

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 10. VÉRIFICATION FINALE
-- =============================================================================

DO $$
DECLARE
  v_table_exists boolean;
  v_policy_count integer;
  v_index_count integer;
  v_constraint_exists boolean;
BEGIN
  -- Table existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_roles'
  ) INTO v_table_exists;

  -- Compter les politiques
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'user_roles';

  -- Compter les index
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'user_roles';

  -- Vérifier le CHECK constraint
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_status_check'
      AND conrelid = 'public.user_roles'::regclass
  ) INTO v_constraint_exists;

  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 RAPPORT DE MIGRATION user_roles';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Table public.user_roles      : %', v_table_exists;
  RAISE NOTICE '🔒 Politiques RLS               : %', v_policy_count;
  RAISE NOTICE '📇 Index                        : %', v_index_count;
  RAISE NOTICE '✔️  CHECK status                : %', v_constraint_exists;
  RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =============================================================================
-- FIN DE LA MIGRATION
-- =============================================================================