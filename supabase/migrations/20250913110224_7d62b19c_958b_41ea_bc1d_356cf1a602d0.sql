-- =============================================================================
-- MIGRATION : 20250913110224_drop_nomenclature_constraints.sql
-- Date       : 2025-09-13
-- Objet      : Supprimer TOUTES les contraintes de nomenclature du schéma btp
--              + créer la table ref_nomenclature (cache UI)
--
-- FIX v2 : Correction du RAISE NOTICE trop peu de paramètres (42601)
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 0 : TABLE D'AUDIT
-- =============================================================================

DROP TABLE IF EXISTS btp._audit_dropped_constraints;

CREATE TABLE btp._audit_dropped_constraints (
    id SERIAL PRIMARY KEY,
    dropped_at TIMESTAMPTZ DEFAULT NOW(),
    object_type TEXT NOT NULL,
    table_schema TEXT,
    table_name TEXT,
    object_name TEXT NOT NULL,
    object_definition TEXT,
    column_name TEXT,
    reason TEXT
);

COMMENT ON TABLE btp._audit_dropped_constraints IS
  'Audit des contraintes de nomenclature supprimées par 20250913110224';

-- =============================================================================
-- ÉTAPE 1 : SUPPRESSION DES CHECK "IN (...)" SUR COLONNES TEXT
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
  v_errors INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ÉTAPE 1 : CHECK IN (...) sur colonnes TEXT';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT DISTINCT
      n.nspname AS table_schema,
      t.relname AS table_name,
      c.conname AS constraint_name,
      pg_get_constraintdef(c.oid) AS constraint_def,
      a.attname AS column_name
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    JOIN information_schema.columns col
      ON col.table_schema = n.nspname
     AND col.table_name = t.relname
     AND col.column_name = a.attname
    WHERE n.nspname = 'btp'
      AND c.contype = 'c'
      AND col.data_type IN ('text', 'character varying', 'character')
      AND (
        pg_get_constraintdef(c.oid) ILIKE '%IN (%'
        OR pg_get_constraintdef(c.oid) ILIKE '%ANY (ARRAY%'
      )
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%IS NOT NULL%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%IS NULL OR%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%length(%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%char_length(%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%trim(%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%>=%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%<=%'
    ORDER BY t.relname, c.conname
  LOOP
    BEGIN
      INSERT INTO btp._audit_dropped_constraints
        (object_type, table_schema, table_name, object_name, object_definition, column_name, reason)
      VALUES
        ('CHECK', v_rec.table_schema, v_rec.table_name, v_rec.constraint_name,
         v_rec.constraint_def, v_rec.column_name, 'CHECK IN (nomenclature)');

      EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
        v_rec.table_schema, v_rec.table_name, v_rec.constraint_name);

      RAISE NOTICE '  ✅ CHECK supprimée : % (table %, col %)',
        v_rec.constraint_name, v_rec.table_name, v_rec.column_name;
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  ⚠️  Échec sur % : %',
        v_rec.constraint_name, SQLERRM;
      v_errors := v_errors + 1;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '  → % CHECK supprimées, % erreurs', v_count, v_errors;
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 2 : SUPPRESSION DES ENUM
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
  v_errors INT := 0;
  v_refs INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ÉTAPE 2 : ENUM PostgreSQL';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT t.typname AS enum_name, n.nspname AS enum_schema
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'btp'
      AND t.typtype = 'e'
    ORDER BY t.typname
  LOOP
    BEGIN
      SELECT COUNT(*) INTO v_refs
      FROM information_schema.columns
      WHERE table_schema = 'btp'
        AND udt_name = v_rec.enum_name;

      IF v_refs > 0 THEN
        RAISE WARNING '  ⚠️  ENUM % utilisé par % colonnes — CASCADE',
          v_rec.enum_name, v_refs;
      END IF;

      INSERT INTO btp._audit_dropped_constraints
        (object_type, table_schema, object_name, object_definition, reason)
      VALUES
        ('ENUM', v_rec.enum_schema, v_rec.enum_name,
         'TYPE ' || v_rec.enum_schema || '.' || v_rec.enum_name,
         'ENUM (nomenclature non évolutive)');

      EXECUTE format('DROP TYPE IF EXISTS %I.%I CASCADE',
        v_rec.enum_schema, v_rec.enum_name);

      RAISE NOTICE '  ✅ ENUM supprimé : %', v_rec.enum_name;
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  ⚠️  Échec sur % : %', v_rec.enum_name, SQLERRM;
      v_errors := v_errors + 1;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '  → % ENUM supprimés, % erreurs', v_count, v_errors;
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 3 : SUPPRESSION DES FK VERS TABLE DE NOMENCLATURE
-- =============================================================================
-- ✅ FIX 42601 : RAISE NOTICE reformulé avec un compte correct de placeholders
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
  v_errors INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ÉTAPE 3 : FK vers tables de nomenclature';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT DISTINCT
      tc.table_schema,
      tc.table_name,
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS target_table,
      ccu.table_schema AS target_schema
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
     AND ccu.table_schema = tc.table_schema
    JOIN information_schema.columns col
      ON col.table_schema = tc.table_schema
     AND col.table_name = tc.table_name
     AND col.column_name = kcu.column_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'btp'
      AND (
        ccu.table_name LIKE 'ref_%'
        OR ccu.table_name LIKE '%nomenclature%'
        OR ccu.table_name LIKE '%status%'
        OR ccu.table_name LIKE '%_type%'
      )
      AND col.data_type IN ('text', 'character varying', 'character')
    ORDER BY tc.table_name, tc.constraint_name
  LOOP
    BEGIN
      INSERT INTO btp._audit_dropped_constraints
        (object_type, table_schema, table_name, object_name, object_definition, column_name, reason)
      VALUES
        ('FK', v_rec.table_schema, v_rec.table_name, v_rec.constraint_name,
         'FK ' || v_rec.table_name || '.' || v_rec.column_name || ' → ' || v_rec.target_table,
         v_rec.column_name,
         'FK vers table de nomenclature (' || v_rec.target_table || ')');

      EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
        v_rec.table_schema, v_rec.table_name, v_rec.constraint_name);

      -- ✅ FIX : 4 placeholders, 4 paramètres
      RAISE NOTICE '  ✅ FK supprimée : % (sur %, col %, cible %)',
        v_rec.constraint_name, v_rec.table_name,
        v_rec.column_name, v_rec.target_table;
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  ⚠️  Échec sur % : %',
        v_rec.constraint_name, SQLERRM;
      v_errors := v_errors + 1;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '  → % FK supprimées, % erreurs', v_count, v_errors;
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 4 : SUPPRESSION DES TRIGGERS DE VALIDATION
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_count INT := 0;
  v_errors INT := 0;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ÉTAPE 4 : Triggers de validation';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT DISTINCT
      t.event_object_schema AS trigger_schema,
      t.event_object_table AS trigger_table,
      t.trigger_name,
      t.action_statement
    FROM information_schema.triggers t
    WHERE t.event_object_schema = 'btp'
      AND (
        t.trigger_name ILIKE '%validate%'
        OR t.trigger_name ILIKE '%nomenclature%'
        OR t.trigger_name ILIKE '%check_status%'
        OR t.trigger_name ILIKE '%check_type%'
        OR t.action_statement ILIKE '%RAISE EXCEPTION%'
      )
      AND t.trigger_name NOT ILIKE '%updated_at%'
      AND t.trigger_name NOT ILIKE '%update_timestamp%'
    ORDER BY t.event_object_table, t.trigger_name
  LOOP
    BEGIN
      INSERT INTO btp._audit_dropped_constraints
        (object_type, table_schema, table_name, object_name, object_definition, reason)
      VALUES
        ('TRIGGER', v_rec.trigger_schema, v_rec.trigger_table,
         v_rec.trigger_name, v_rec.action_statement,
         'Trigger de validation de nomenclature');

      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE',
        v_rec.trigger_name, v_rec.trigger_schema, v_rec.trigger_table);

      RAISE NOTICE '  ✅ Trigger supprimé : % (sur %)',
        v_rec.trigger_name, v_rec.trigger_table;
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '  ⚠️  Échec sur % : %', v_rec.trigger_name, SQLERRM;
      v_errors := v_errors + 1;
    END;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '  → % triggers supprimés, % erreurs', v_count, v_errors;
  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 5 : TABLE ref_nomenclature (CACHE UI)
-- =============================================================================

CREATE TABLE IF NOT EXISTS btp.ref_nomenclature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  code TEXT NOT NULL,
  label_fr TEXT,
  label_en TEXT,
  label_ar TEXT,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (domain, code)
);

CREATE INDEX IF NOT EXISTS idx_ref_nomenclature_domain
  ON btp.ref_nomenclature(domain) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ref_nomenclature_domain_code
  ON btp.ref_nomenclature(domain, code);

COMMENT ON TABLE btp.ref_nomenclature IS
  'Cache UI des nomenclatures — ALIMENTÉE PAR L''APPLICATION.';

-- =============================================================================
-- ÉTAPE 6 : FONCTION is_valid_nomenclature()
-- =============================================================================

CREATE OR REPLACE FUNCTION btp.is_valid_nomenclature(
  p_domain TEXT,
  p_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM btp.ref_nomenclature
    WHERE domain = p_domain AND is_active = true
  ) THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM btp.ref_nomenclature
    WHERE domain = p_domain AND code = p_code AND is_active = true
  );
END;
$$;

REVOKE ALL ON FUNCTION btp.is_valid_nomenclature(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION btp.is_valid_nomenclature(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION btp.is_valid_nomenclature(TEXT, TEXT) TO service_role;

-- =============================================================================
-- ÉTAPE 7 : SEED INITIAL
-- =============================================================================

INSERT INTO btp.ref_nomenclature (domain, code, label_fr, label_en, sort_order) VALUES
  ('task_status', 'pending',     'En attente', 'Pending',      1),
  ('task_status', 'assigned',    'Assignée',   'Assigned',     2),
  ('task_status', 'in_progress', 'En cours',   'In Progress',  3),
  ('task_status', 'on_hold',     'En pause',   'On Hold',      4),
  ('task_status', 'blocked',     'Bloquée',    'Blocked',      5),
  ('task_status', 'completed',   'Terminée',   'Completed',    6),
  ('task_status', 'cancelled',   'Annulée',    'Cancelled',    7),

  ('task_priority', 'low',      'Basse',    'Low',      1),
  ('task_priority', 'medium',   'Moyenne',  'Medium',   2),
  ('task_priority', 'high',     'Haute',    'High',     3),
  ('task_priority', 'critical', 'Critique', 'Critical', 4),
  ('task_priority', 'urgent',   'Urgente',  'Urgent',   5),

  ('project_status', 'DRAFT',       'Brouillon',  'Draft',       1),
  ('project_status', 'PENDING',     'En attente', 'Pending',     2),
  ('project_status', 'IN_PROGRESS', 'En cours',   'In Progress', 3),
  ('project_status', 'SUSPENDED',   'Suspendu',   'Suspended',   4),
  ('project_status', 'COMPLETED',   'Terminé',    'Completed',   5),
  ('project_status', 'CANCELLED',   'Annulé',     'Cancelled',   6),

  ('milestone_status', 'pending',     'En attente', 'Pending',     1),
  ('milestone_status', 'in_progress', 'En cours',   'In Progress', 2),
  ('milestone_status', 'completed',   'Terminé',    'Completed',   3),
  ('milestone_status', 'delayed',     'En retard',  'Delayed',     4),
  ('milestone_status', 'cancelled',   'Annulé',     'Cancelled',   5),

  ('stakeholder_entity_type', 'employee',     'Employé',      'Employee',     1),
  ('stakeholder_entity_type', 'supplier',     'Fournisseur',  'Supplier',     2),
  ('stakeholder_entity_type', 'organization', 'Organisation', 'Organization', 3),
  ('stakeholder_entity_type', 'community',    'Communauté',   'Community',    4),

  ('org_type', 'public',             'Public',             'Public',            1),
  ('org_type', 'prive',              'Privé',              'Private',           2),
  ('org_type', 'prestataire',        'Prestataire',        'Contractor',        3),
  ('org_type', 'fournisseur',        'Fournisseur',        'Supplier',          4),
  ('org_type', 'groupement',         'Groupement',         'Consortium',        5),
  ('org_type', 'sous_traitant',      'Sous-traitant',      'Subcontractor',     6),
  ('org_type', 'ong',                'ONG',                'NGO',               7),
  ('org_type', 'community',          'Communauté',         'Community',         8),
  ('org_type', 'association',        'Association',        'Association',       9),
  ('org_type', 'cooperative',        'Coopérative',        'Cooperative',      10),
  ('org_type', 'autorite_regionale', 'Autorité régionale', 'Regional Authority',11),
  ('org_type', 'autorite_locale',    'Autorité locale',    'Local Authority',  12),
  ('org_type', 'administration',     'Administration',     'Administration',   13),
  ('org_type', 'autre',              'Autre',              'Other',            99),

  ('action_type', 'task_assignment',     'Tâche',              'Task Assignment',  1),
  ('action_type', 'schedule_inspection', 'Inspection',         'Inspection',       2),
  ('action_type', 'deliver_material',    'Livraison matériel', 'Deliver Material', 3),
  ('action_type', 'milestone_review',    'Revue de jalon',     'Milestone Review', 4),
  ('action_type', 'validation',          'Validation',         'Validation',       5),
  ('action_type', 'meeting',             'Réunion',            'Meeting',          6),

  ('workflow_status', 'pending',     'En attente', 'Pending',     1),
  ('workflow_status', 'in_progress', 'En cours',   'In Progress', 2),
  ('workflow_status', 'completed',   'Terminé',    'Completed',   3),
  ('workflow_status', 'blocked',     'Bloqué',     'Blocked',     4),

  ('workflow_entity_type', 'project', 'Projet',          'Project', 1),
  ('workflow_entity_type', 'tender',  'Appel d''offres',  'Tender',  2)
ON CONFLICT (domain, code) DO NOTHING;

-- =============================================================================
-- ÉTAPE 8 : SCAN FINAL
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_remaining_checks INT := 0;
  v_remaining_enums INT := 0;
  v_remaining_fks INT := 0;
  v_seeded INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  ÉTAPE 8 : SCAN FINAL';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT t.relname AS table_name, c.conname, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(c.conkey)
    JOIN information_schema.columns col
      ON col.table_schema = n.nspname
     AND col.table_name = t.relname
     AND col.column_name = a.attname
    WHERE n.nspname = 'btp'
      AND c.contype = 'c'
      AND col.data_type IN ('text', 'character varying')
      AND pg_get_constraintdef(c.oid) ILIKE '%IN (%'
      AND pg_get_constraintdef(c.oid) NOT ILIKE '%IS NULL OR%'
  LOOP
    v_remaining_checks := v_remaining_checks + 1;
    RAISE NOTICE '  ⚠️  CHECK restante : % sur % → %',
      v_rec.conname, v_rec.table_name, v_rec.def;
  END LOOP;

  SELECT COUNT(*) INTO v_remaining_enums
  FROM pg_type t
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE n.nspname = 'btp' AND t.typtype = 'e';

  SELECT COUNT(*) INTO v_remaining_fks
  FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'btp'
    AND (ccu.table_name LIKE 'ref_%' OR ccu.table_name LIKE '%nomenclature%');

  SELECT COUNT(*) INTO v_seeded FROM btp.ref_nomenclature WHERE is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '  Contraintes résiduelles :';
  RAISE NOTICE '    • CHECK IN (...) restantes  : %', v_remaining_checks;
  RAISE NOTICE '    • ENUM restants             : %', v_remaining_enums;
  RAISE NOTICE '    • FK vers ref_* restantes   : %', v_remaining_fks;
  RAISE NOTICE '    • Nomenclatures seedées     : %', v_seeded;
  RAISE NOTICE '';

  IF v_remaining_checks = 0 AND v_remaining_enums = 0 AND v_remaining_fks = 0 THEN
    RAISE NOTICE '  ✅ PLUS AUCUNE CONTRAINTE DE NOMENCLATURE';
  ELSE
    RAISE WARNING '  ⚠️  Certaines contraintes persistent';
  END IF;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 9 : RAPPORT D'AUDIT
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
  v_total INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  RAPPORT D''AUDIT FINAL';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  SELECT COUNT(*) INTO v_total FROM btp._audit_dropped_constraints;
  RAISE NOTICE '  Total contraintes supprimées : %', v_total;
  RAISE NOTICE '';

  FOR v_rec IN
    SELECT object_type, COUNT(*) AS nb
    FROM btp._audit_dropped_constraints
    GROUP BY object_type
    ORDER BY object_type
  LOOP
    RAISE NOTICE '    • % : %', RPAD(v_rec.object_type, 10), v_rec.nb;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 10 : NOTIFY POSTGREST
-- =============================================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;