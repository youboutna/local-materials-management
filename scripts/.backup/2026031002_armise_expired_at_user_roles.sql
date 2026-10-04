-- ============================================================
-- Fix : harmoniser user_roles.expired_at → expires_at
-- Idempotent : OUI
-- ============================================================

-- 1. Renommer la colonne
ALTER TABLE public.user_roles
  RENAME COLUMN expired_at TO expires_at;

-- 2. Recréer l'index (si existant, avec l'ancien nom)
DROP INDEX IF EXISTS public.idx_user_roles_expired_at;
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at
  ON public.user_roles(expires_at)
  WHERE expires_at IS NOT NULL;

-- 3. Recharger le cache PostgREST
NOTIFY pgrst, 'reload schema';

-- 4. Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_roles'
  AND column_name IN ('expires_at', 'expired_at')
ORDER BY column_name;


CREATE OR REPLACE FUNCTION public.is_user_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id
      AND role_name IN ('admin', 'super_admin', 'director')
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO authenticated, anon, service_role;