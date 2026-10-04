-- =============================================================================
-- MIGRATION : 20250820113324_add_performance_indexes_and_triggers.sql
-- Date       : 2025-08-20
-- Objet      : Index de performance + triggers updated_at + complétion notifications
--
-- SÉCURITÉ :
--   - public.update_timestamp() : SECURITY DEFINER + SET search_path = ''
--   - REVOKE ALL FROM PUBLIC + GRANT aux rôles concernés
--   - Idempotente : CREATE INDEX IF NOT EXISTS + DROP TRIGGER IF EXISTS
--   - notifications : user_id → auth.users(id) (FK explicite)
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : FONCTION update_timestamp() — SÉCURISÉE
-- =============================================================================

DROP FUNCTION IF EXISTS btp.update_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.update_timestamp() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_timestamp() FROM anon;
GRANT EXECUTE ON FUNCTION public.update_timestamp() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_timestamp() TO service_role;

COMMENT ON FUNCTION public.update_timestamp() IS
  'Met à jour NEW.updated_at. SECURITY DEFINER + search_path='''' (anti schema hijacking).';

DO $$ BEGIN RAISE NOTICE '✅ public.update_timestamp() créée'; END $$;

-- =============================================================================
-- ÉTAPE 2 : COMPLÉTER btp.notifications (ajout user_id → auth.users)
-- =============================================================================
-- Si la table existe déjà sans user_id (ou avec un autre nom de colonne),
-- on ajoute la colonne user_id avec FK vers auth.users(id).
-- =============================================================================

DO $$
BEGIN
  -- 2.1 : Créer la table si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'btp' AND table_name = 'notifications'
  ) THEN
    CREATE TABLE btp.notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL DEFAULT 'info',
      title TEXT,
      message TEXT,
      data JSONB DEFAULT '{}'::jsonb,
      is_read BOOLEAN DEFAULT false,
      read_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    RAISE NOTICE '  ✅ Table btp.notifications créée';
  ELSE
    RAISE NOTICE '  ℹ️  Table btp.notifications existe déjà';
  END IF;

  -- 2.2 : Ajouter user_id si absent
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'btp' AND table_name = 'notifications'
      AND column_name = 'user_id'
  ) THEN
    ALTER TABLE btp.notifications
      ADD COLUMN user_id UUID;

    RAISE NOTICE '  ✅ Colonne user_id ajoutée à btp.notifications';

    -- 2.3 : Ajouter la FK vers auth.users (si pas déjà présente)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'btp'
        AND tc.table_name = 'notifications'
        AND kcu.column_name = 'user_id'
    ) THEN
      ALTER TABLE btp.notifications
        ADD CONSTRAINT notifications_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
      RAISE NOTICE '  ✅ FK notifications.user_id → auth.users(id) créée';
    END IF;
  ELSE
    RAISE NOTICE '  ℹ️  Colonne user_id déjà présente dans btp.notifications';
  END IF;

  -- 2.4 : Ajouter les autres colonnes manquantes (idempotent)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='btp' AND table_name='notifications' AND column_name='type') THEN
    ALTER TABLE btp.notifications ADD COLUMN type TEXT DEFAULT 'info';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='btp' AND table_name='notifications' AND column_name='title') THEN
    ALTER TABLE btp.notifications ADD COLUMN title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='btp' AND table_name='notifications' AND column_name='message') THEN
    ALTER TABLE btp.notifications ADD COLUMN message TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='btp' AND table_name='notifications' AND column_name='data') THEN
    ALTER TABLE btp.notifications ADD COLUMN data JSONB DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='btp' AND table_name='notifications' AND column_name='is_read') THEN
    ALTER TABLE btp.notifications ADD COLUMN is_read BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='btp' AND table_name='notifications' AND column_name='read_at') THEN
    ALTER TABLE btp.notifications ADD COLUMN read_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='btp' AND table_name='notifications' AND column_name='created_at') THEN
    ALTER TABLE btp.notifications ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_schema='btp' AND table_name='notifications' AND column_name='updated_at') THEN
    ALTER TABLE btp.notifications ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- =============================================================================
-- ÉTAPE 3 : INDEX DE PERFORMANCE (IDEMPOTENTS)
-- =============================================================================

-- btp.projects
CREATE INDEX IF NOT EXISTS idx_projects_status ON btp.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON btp.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_coordinates ON btp.projects(coordinates_latitude, coordinates_longitude);

-- btp.project_phases
CREATE INDEX IF NOT EXISTS idx_project_phases_project_id ON btp.project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_project_phases_status ON btp.project_phases(status);
CREATE INDEX IF NOT EXISTS idx_project_phases_dates ON btp.project_phases(start_date, end_date);

-- btp.materials
CREATE INDEX IF NOT EXISTS idx_materials_category ON btp.materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_supplier ON btp.materials(supplier_id) WHERE supplier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_materials_code ON btp.materials(material_code) WHERE material_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_materials_status ON btp.materials(material_status);

-- btp.tenders
CREATE INDEX IF NOT EXISTS idx_tenders_status ON btp.tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_project ON btp.tenders(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenders_dates ON btp.tenders(launch_date, attribution_date);

-- btp.documents
CREATE INDEX IF NOT EXISTS idx_documents_project ON btp.documents(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_type ON btp.documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON btp.documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON btp.documents(uploaded_by) WHERE uploaded_by IS NOT NULL;

-- btp.quantity_takeoffs
CREATE INDEX IF NOT EXISTS idx_quantity_takeoffs_project ON btp.quantity_takeoffs(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quantity_takeoffs_material ON btp.quantity_takeoffs(material_id) WHERE material_id IS NOT NULL;

-- btp.notifications (colonne user_id garantie par l'ÉTAPE 2)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON btp.notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_read ON btp.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON btp.notifications(type);

DO $$ BEGIN RAISE NOTICE '✅ Index de performance créés'; END $$;

-- =============================================================================
-- ÉTAPE 4 : TRIGGERS updated_at (IDEMPOTENTS)
-- =============================================================================

-- btp.projects
DROP TRIGGER IF EXISTS update_projects_timestamp ON btp.projects;
CREATE TRIGGER update_projects_timestamp
  BEFORE UPDATE ON btp.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- btp.project_phases
DROP TRIGGER IF EXISTS update_project_phases_timestamp ON btp.project_phases;
CREATE TRIGGER update_project_phases_timestamp
  BEFORE UPDATE ON btp.project_phases
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- btp.materials
DROP TRIGGER IF EXISTS update_materials_timestamp ON btp.materials;
CREATE TRIGGER update_materials_timestamp
  BEFORE UPDATE ON btp.materials
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- btp.suppliers
DROP TRIGGER IF EXISTS update_suppliers_timestamp ON btp.suppliers;
CREATE TRIGGER update_suppliers_timestamp
  BEFORE UPDATE ON btp.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- btp.tenders
DROP TRIGGER IF EXISTS update_tenders_timestamp ON btp.tenders;
CREATE TRIGGER update_tenders_timestamp
  BEFORE UPDATE ON btp.tenders
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- btp.documents
DROP TRIGGER IF EXISTS update_documents_timestamp ON btp.documents;
CREATE TRIGGER update_documents_timestamp
  BEFORE UPDATE ON btp.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- btp.quantity_takeoffs
DROP TRIGGER IF EXISTS update_quantity_takeoffs_timestamp ON btp.quantity_takeoffs;
CREATE TRIGGER update_quantity_takeoffs_timestamp
  BEFORE UPDATE ON btp.quantity_takeoffs
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- btp.workspaces
DROP TRIGGER IF EXISTS update_workspaces_timestamp ON btp.workspaces;
CREATE TRIGGER update_workspaces_timestamp
  BEFORE UPDATE ON btp.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- btp.notifications
DROP TRIGGER IF EXISTS update_notifications_timestamp ON btp.notifications;
CREATE TRIGGER update_notifications_timestamp
  BEFORE UPDATE ON btp.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- public.profiles
DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DO $$ BEGIN RAISE NOTICE '✅ Triggers updated_at créés'; END $$;

-- =============================================================================
-- ÉTAPE 5 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_func_security TEXT;
  v_trigger_count INT;
  v_index_count INT;
  v_notif_cols TEXT;
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT CASE WHEN prosecdef THEN 'DEFINER' ELSE 'INVOKER' END
  INTO v_func_security
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = 'update_timestamp';

  RAISE NOTICE 'Fonction update_timestamp : %', COALESCE(v_func_security, 'INTROUVABLE');

  -- Structure notifications
  SELECT string_agg(column_name || ':' || data_type, ', ' ORDER BY ordinal_position)
  INTO v_notif_cols
  FROM information_schema.columns
  WHERE table_schema = 'btp' AND table_name = 'notifications';

  RAISE NOTICE '';
  RAISE NOTICE 'Structure btp.notifications :';
  RAISE NOTICE '   %', v_notif_cols;

  -- FK user_id
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'btp'
      AND tc.table_name = 'notifications'
      AND kcu.column_name = 'user_id'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
  ) THEN
    RAISE NOTICE '✅ FK notifications.user_id → auth.users(id) présente';
  ELSE
    RAISE WARNING '⚠️  FK notifications.user_id → auth.users absente';
  END IF;

  SELECT COUNT(*) INTO v_trigger_count
  FROM information_schema.triggers
  WHERE trigger_schema IN ('btp', 'public')
    AND trigger_name LIKE 'update_%_timestamp';

  RAISE NOTICE '';
  RAISE NOTICE 'Triggers updated_at : %', v_trigger_count;
  FOR v_rec IN
    SELECT event_object_schema, event_object_table, trigger_name
    FROM information_schema.triggers
    WHERE trigger_schema IN ('btp', 'public')
      AND trigger_name LIKE 'update_%_timestamp'
    ORDER BY event_object_schema, event_object_table
  LOOP
    RAISE NOTICE '   • %.% → %', v_rec.event_object_schema, v_rec.event_object_table, v_rec.trigger_name;
  END LOOP;

  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes WHERE schemaname = 'btp' AND indexname LIKE 'idx_%';

  RAISE NOTICE '';
  RAISE NOTICE 'Index btp : %', v_index_count;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;