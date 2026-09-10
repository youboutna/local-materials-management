-- =============================================================================
-- HadraTech-GPI – Initialisation DB (scénario Keycloak)
-- =============================================================================
-- 📁 Emplacement : docker/keycloak/scripts/init-db.sql
-- 🎯 Rôle : Créer les rôles PostgreSQL pour PostgREST
-- ⚠️ S'exécute UNE SEULE FOIS au premier démarrage de Postgres
-- =============================================================================

-- =============================================================================
-- 1. CRÉATION DES RÔLES POSTGREST
-- =============================================================================

-- Rôle anonyme (accès public non authentifié)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_anon') THEN
    CREATE ROLE web_anon NOLOGIN;
    RAISE NOTICE '✅ Rôle web_anon créé';
  ELSE
    RAISE NOTICE 'ℹ️ Rôle web_anon déjà existant';
  END IF;
END $$;

-- Rôle authentifié (utilisateurs connectés)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
    RAISE NOTICE '✅ Rôle authenticated créé';
  ELSE
    RAISE NOTICE 'ℹ️ Rôle authenticated déjà existant';
  END IF;
END $$;

-- =============================================================================
-- 2. CRÉATION DES SCHÉMAS
-- =============================================================================

-- Schéma btp (métier HadraTech)
CREATE SCHEMA IF NOT EXISTS btp;

-- Schéma extensions (pour les extensions PostgreSQL)
CREATE SCHEMA IF NOT EXISTS extensions;

-- =============================================================================
-- 3. PERMISSIONS
-- =============================================================================

-- Usage des schémas
GRANT USAGE ON SCHEMA public TO web_anon, authenticated;
GRANT USAGE ON SCHEMA btp TO web_anon, authenticated;
GRANT USAGE ON SCHEMA extensions TO web_anon, authenticated;

-- Permissions par défaut sur les futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA btp GRANT SELECT ON TABLES TO web_anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA btp GRANT ALL ON TABLES TO authenticated;

-- Permissions sur les séquences (pour les SERIAL/BIGSERIAL)
ALTER DEFAULT PRIVILEGES IN SCHEMA btp GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- =============================================================================
-- 4. EXTENSIONS POSTGRESQL
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgjwt" SCHEMA extensions;

-- =============================================================================
-- 5. FONCTION DE VÉRIFICATION DE SANTÉ
-- =============================================================================

CREATE OR REPLACE FUNCTION public.health_check()
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'status', 'ok',
    'timestamp', NOW(),
    'database', current_database(),
    'user', current_user
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.health_check() TO web_anon, authenticated;

-- =============================================================================
-- 6. MESSAGE FINAL
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Initialisation DB HadraTech terminée';
  RAISE NOTICE '📦 Schémas : public, btp, extensions';
  RAISE NOTICE '👥 Rôles : web_anon, authenticated';
  RAISE NOTICE '⚠️  Les migrations HadraTech seront appliquées automatiquement';
  RAISE NOTICE '========================================';
END $$;