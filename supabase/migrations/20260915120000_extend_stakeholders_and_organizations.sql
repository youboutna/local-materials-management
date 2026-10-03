-- ============================================================
-- MIGRATION : 20260914120000_extend_stakeholders_and_organizations.sql
-- Description :
--   1. Découverte + normalisation des valeurs existantes de org_type
--   2. Contrainte CHECK adaptative (basée sur les valeurs réelles)
--   3. Extension de btp.project_stakeholders (FK nullable + colonnes génériques)
--   4. Fonctions ensure_community_organization + upsert_stakeholder
--   5. Vues utilitaires
--   6. Ajout colonne cb à btp.organizations
-- Date : 2026-09-15
-- Idempotente : OUI
-- ============================================================

BEGIN;

-- ============================================================
-- 0. DÉCOUVERTE DES VALEURS EXISTANTES DE org_type
-- ============================================================

DO $$
DECLARE
  v_values text[];
  v_count int;
  v_null_count int;
BEGIN
  SELECT ARRAY_AGG(DISTINCT org_type ORDER BY org_type)
  INTO v_values
  FROM btp.organizations
  WHERE org_type IS NOT NULL;

  SELECT COUNT(DISTINCT org_type) INTO v_count
  FROM btp.organizations
  WHERE org_type IS NOT NULL;

  SELECT COUNT(*) INTO v_null_count
  FROM btp.organizations
  WHERE org_type IS NULL;

  RAISE NOTICE '============================================================';
  RAISE NOTICE '  ÉTAT ACTUEL DE btp.organizations';
  RAISE NOTICE '============================================================';
  RAISE NOTICE '  Valeurs org_type     : %', COALESCE(v_values::text, '(aucune)');
  RAISE NOTICE '  Nb valeurs distinctes: %', v_count;
  RAISE NOTICE '  Lignes org_type NULL : %', v_null_count;
  RAISE NOTICE '============================================================';
END $$;

-- ============================================================
-- 1. NORMALISATION DES VALEURS EXISTANTES DE org_type
-- ============================================================

-- 1.1 Mapping par correspondance exacte
UPDATE btp.organizations
SET org_type = CASE
  WHEN lower(trim(org_type)) IN ('institution', 'institutionnel', 'institutional',
                                  'gouvernement', 'government', 'etat', 'state',
                                  'ministere', 'ministry', 'ministère') THEN 'public'
  WHEN lower(trim(org_type)) IN ('prive', 'privé', 'private', 'entreprise',
                                  'company', 'societe', 'société', 'corp') THEN 'prive'
  WHEN lower(trim(org_type)) IN ('prestataire', 'contractor', 'sous-traitant',
                                  'sous_traitant', 'subcontractor') THEN 'prestataire'
  WHEN lower(trim(org_type)) IN ('fournisseur', 'supplier', 'vendor') THEN 'fournisseur'
  WHEN lower(trim(org_type)) IN ('groupement', 'consortium', 'group',
                                  'joint-venture', 'jv') THEN 'groupement'
  WHEN lower(trim(org_type)) IN ('ong', 'ngo') THEN 'ong'
  WHEN lower(trim(org_type)) IN ('community', 'communaute', 'communauté') THEN 'community'
  WHEN lower(trim(org_type)) IN ('association', 'cooperative', 'coopérative') THEN 'cooperative'
  WHEN lower(trim(org_type)) IN ('autorite-regionale', 'autorité-régionale',
                                  'autorite_regionale', 'regional-authority',
                                  'wali', 'region') THEN 'autorite_regionale'
  WHEN lower(trim(org_type)) IN ('autorite-locale', 'autorité-locale',
                                  'autorite_locale', 'local-authority',
                                  'mairie', 'commune') THEN 'autorite_locale'
  WHEN lower(trim(org_type)) IN ('administration', 'admin') THEN 'administration'
  ELSE org_type
END
WHERE org_type IS NOT NULL;

-- 1.2 Normalisation par pattern (valeurs composées)
UPDATE btp.organizations
SET org_type = CASE
  WHEN lower(trim(org_type)) LIKE '%ong%'            THEN 'ong'
  WHEN lower(trim(org_type)) LIKE '%institution%'    THEN 'public'
  WHEN lower(trim(org_type)) LIKE '%gouvernement%'   THEN 'public'
  WHEN lower(trim(org_type)) LIKE '%prestataire%'    THEN 'prestataire'
  WHEN lower(trim(org_type)) LIKE '%fournisseur%'    THEN 'fournisseur'
  WHEN lower(trim(org_type)) LIKE '%groupement%'     THEN 'groupement'
  WHEN lower(trim(org_type)) LIKE '%communaut%'      THEN 'community'
  WHEN lower(trim(org_type)) LIKE '%associat%'       THEN 'association'
  WHEN lower(trim(org_type)) LIKE '%cooperat%'       THEN 'cooperative'
  WHEN lower(trim(org_type)) LIKE '%autorit%reg%'    THEN 'autorite_regionale'
  WHEN lower(trim(org_type)) LIKE '%autorit%loc%'    THEN 'autorite_locale'
  WHEN lower(trim(org_type)) LIKE '%admin%'          THEN 'administration'
  ELSE org_type
END
WHERE org_type IS NOT NULL
  AND lower(trim(org_type)) NOT IN (
    'public', 'prive', 'ong', 'prestataire', 'fournisseur',
    'groupement', 'sous_traitant', 'community', 'association',
    'cooperative', 'groupement_communautaire',
    'autorite_regionale', 'autorite_locale', 'administration', 'autre'
  );

-- 1.3 Valeurs NULL → 'autre'
UPDATE btp.organizations
SET org_type = 'autre'
WHERE org_type IS NULL;

-- 1.4 Fallback : toute valeur encore inconnue → 'autre'
UPDATE btp.organizations
SET org_type = 'autre'
WHERE org_type IS NOT NULL
  AND lower(trim(org_type)) NOT IN (
    'public', 'prive', 'ong', 'prestataire', 'fournisseur',
    'groupement', 'sous_traitant', 'community', 'association',
    'cooperative', 'groupement_communautaire',
    'autorite_regionale', 'autorite_locale', 'administration', 'autre'
  );

-- 1.5 Log post-normalisation
DO $$
DECLARE
  v_values text[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT org_type ORDER BY org_type)
  INTO v_values
  FROM btp.organizations
  WHERE org_type IS NOT NULL;

  RAISE NOTICE '✅ Normalisation terminée — Valeurs finales : %', v_values;
END $$;

-- ============================================================
-- 2. CONTRAINTE CHECK ADAPTATIVE SUR org_type
-- ============================================================

-- 2.1 Supprimer l'ancienne contrainte
ALTER TABLE btp.organizations
  DROP CONSTRAINT IF EXISTS organizations_org_type_check;

-- 2.2 Construire dynamiquement la contrainte avec toutes les valeurs présentes
DO $$
DECLARE
  v_all_values text[];
  v_check_expr text;
BEGIN
  SELECT ARRAY(
    SELECT DISTINCT unnest(
      ARRAY[
        'public', 'prive', 'ong',
        'prestataire', 'fournisseur', 'groupement', 'sous_traitant',
        'community', 'association', 'cooperative', 'groupement_communautaire',
        'autorite_regionale', 'autorite_locale', 'administration',
        'autre'
      ]::text[]
      ||
      COALESCE(
        (SELECT ARRAY_AGG(DISTINCT org_type)
         FROM btp.organizations
         WHERE org_type IS NOT NULL),
        ARRAY[]::text[]
      )
    )
    ORDER BY 1
  ) INTO v_all_values;

  v_check_expr := array_to_string(
    ARRAY(SELECT quote_literal(v) FROM unnest(v_all_values) AS v),
    ', '
  );

  EXECUTE format(
    'ALTER TABLE btp.organizations
     ADD CONSTRAINT organizations_org_type_check
     CHECK (org_type IN (%s))',
    v_check_expr
  );

  -- ✅ FIX : un seul % (pas de %%)
  RAISE NOTICE '✅ Contrainte organizations_org_type_check créée (% valeurs)',
    array_length(v_all_values, 1);
END $$;

-- 2.3 NOT NULL + DEFAULT après normalisation
ALTER TABLE btp.organizations
  ALTER COLUMN org_type SET NOT NULL,
  ALTER COLUMN org_type SET DEFAULT 'autre';

-- ============================================================
-- 3. COLONNE category (GÉNÉRÉE)
-- ============================================================

ALTER TABLE btp.organizations
  DROP COLUMN IF EXISTS category;

ALTER TABLE btp.organizations
  ADD COLUMN category text
  GENERATED ALWAYS AS (
    CASE
      WHEN org_type IN ('public', 'prive', 'administration', 'autorite_regionale', 'autorite_locale') THEN 'institutionnel'
      WHEN org_type IN ('prestataire', 'fournisseur', 'groupement', 'sous_traitant') THEN 'commercial'
      WHEN org_type IN ('community', 'association', 'cooperative', 'groupement_communautaire') THEN 'communautaire'
      WHEN org_type = 'ong' THEN 'ong'
      ELSE 'autre'
    END
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_organizations_category
  ON btp.organizations(category);

-- ============================================================
-- 4. COLONNES SUPPLÉMENTAIRES organizations (cb, rc, sector)
-- ============================================================

ALTER TABLE btp.organizations
  ADD COLUMN IF NOT EXISTS cb text,
  ADD COLUMN IF NOT EXISTS rc text,
  ADD COLUMN IF NOT EXISTS sector text;

COMMENT ON COLUMN btp.organizations.cb IS 'Compte Bancaire (CB)';
COMMENT ON COLUMN btp.organizations.rc IS 'Registre de Commerce (RC)';
COMMENT ON COLUMN btp.organizations.sector IS 'Secteur d''activité';

-- ============================================================
-- 5. HIÉRARCHIE
-- ============================================================

ALTER TABLE btp.organizations
  ADD COLUMN IF NOT EXISTS parent_organization_id uuid
  REFERENCES btp.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_parent
  ON btp.organizations(parent_organization_id);

-- ============================================================
-- 6. EXTENSION DE btp.project_stakeholders
-- ============================================================

ALTER TABLE btp.project_stakeholders
  ALTER COLUMN organization_id DROP NOT NULL,
  ALTER COLUMN supplier_id DROP NOT NULL,
  ALTER COLUMN employee_id DROP NOT NULL;

ALTER TABLE btp.project_stakeholders
  ADD COLUMN IF NOT EXISTS external_ref text,
  ADD COLUMN IF NOT EXISTS community_type text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_primary boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS stakeholder_entity_type text;

ALTER TABLE btp.project_stakeholders
  DROP CONSTRAINT IF EXISTS stakeholders_entity_type_check;

ALTER TABLE btp.project_stakeholders
  ADD CONSTRAINT stakeholders_entity_type_check
  CHECK (
    stakeholder_entity_type IS NULL
    OR stakeholder_entity_type IN ('employee', 'supplier', 'organization', 'community')
  );

ALTER TABLE btp.project_stakeholders
  DROP CONSTRAINT IF EXISTS stakeholders_entity_consistency_check;

ALTER TABLE btp.project_stakeholders
  ADD CONSTRAINT stakeholders_entity_consistency_check
  CHECK (
    organization_id IS NOT NULL
    OR supplier_id IS NOT NULL
    OR employee_id IS NOT NULL
    OR community_type IS NOT NULL
    OR stakeholder_entity_type IN ('community')
  );

DROP INDEX IF EXISTS btp.idx_stakeholders_external_ref;
CREATE UNIQUE INDEX idx_stakeholders_external_ref
  ON btp.project_stakeholders(external_ref)
  WHERE external_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stakeholders_project_id ON btp.project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_organization_id ON btp.project_stakeholders(organization_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_supplier_id ON btp.project_stakeholders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_employee_id ON btp.project_stakeholders(employee_id);
CREATE INDEX IF NOT EXISTS idx_stakeholders_community_type ON btp.project_stakeholders(community_type) WHERE community_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholders_entity_type ON btp.project_stakeholders(stakeholder_entity_type);
CREATE INDEX IF NOT EXISTS idx_stakeholders_metadata_gin ON btp.project_stakeholders USING gin(metadata);

-- ============================================================
-- 7. TRIGGER DE VALIDATION
-- ============================================================

CREATE OR REPLACE FUNCTION btp.validate_stakeholder_entity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.stakeholder_entity_type = 'organization'
     AND NEW.organization_id IS NULL
     AND NEW.community_type IS NULL THEN
    RAISE EXCEPTION 'Stakeholder de type "organization" doit avoir un organization_id ou un community_type';
  END IF;

  IF NEW.stakeholder_entity_type = 'supplier'
     AND NEW.supplier_id IS NULL THEN
    RAISE EXCEPTION 'Stakeholder de type "supplier" doit avoir un supplier_id';
  END IF;

  IF NEW.stakeholder_entity_type = 'employee'
     AND NEW.employee_id IS NULL THEN
    RAISE EXCEPTION 'Stakeholder de type "employee" doit avoir un employee_id';
  END IF;

  IF NEW.stakeholder_entity_type = 'community'
     AND NEW.community_type IS NULL
     AND NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Stakeholder de type "community" doit avoir un community_type ou un organization_id';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_stakeholder_entity ON btp.project_stakeholders;
CREATE TRIGGER trg_validate_stakeholder_entity
  BEFORE INSERT OR UPDATE ON btp.project_stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION btp.validate_stakeholder_entity();

-- ============================================================
-- 8. FONCTION : ensure_community_organization (GÉNÉRIQUE)
-- ============================================================

CREATE OR REPLACE FUNCTION btp.ensure_community_organization(
  p_name text,
  p_community_type text DEFAULT 'communaute',
  p_external_ref text DEFAULT NULL,
  p_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
  v_ref text;
  v_has_short_name boolean;
  v_has_sector boolean;
  v_has_role boolean;
  v_has_is_active boolean;
  v_cols text[];
BEGIN
  v_ref := COALESCE(p_external_ref, 'COMMUNITY-' || p_community_type || '-' || p_name);

  SELECT ARRAY_AGG(column_name) INTO v_cols
  FROM information_schema.columns
  WHERE table_schema = 'btp' AND table_name = 'organizations';

  v_has_short_name := 'short_name' = ANY(v_cols);
  v_has_sector     := 'sector'     = ANY(v_cols);
  v_has_role       := 'role'       = ANY(v_cols);
  v_has_is_active  := 'is_active'  = ANY(v_cols);

  SELECT id INTO v_org_id
  FROM btp.organizations
  WHERE external_ref = v_ref
     OR (name = p_name AND org_type IN ('community', 'association', 'cooperative', 'groupement_communautaire'))
  LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;

  -- INSERT minimal mais robuste (utilise uniquement les colonnes sûres)
  INSERT INTO btp.organizations (
    id, external_ref, name, org_type, description, address
  ) VALUES (
    gen_random_uuid(), v_ref, p_name, 'community',
    'Organisation communautaire importée automatiquement',
    p_address
  )
  RETURNING id INTO v_org_id;

  RETURN v_org_id;
END;
$$;

COMMENT ON FUNCTION btp.ensure_community_organization IS
  'Crée ou récupère une organisation communautaire (générique)';

GRANT EXECUTE ON FUNCTION btp.ensure_community_organization(text, text, text, text)
  TO authenticated, service_role;

-- ============================================================
-- 9. FONCTION : upsert_stakeholder
-- ============================================================

CREATE OR REPLACE FUNCTION btp.upsert_stakeholder(
  p_project_id uuid,
  p_external_ref text,
  p_stakeholder_type text,
  p_entity_type text,
  p_organization_id uuid DEFAULT NULL,
  p_supplier_id uuid DEFAULT NULL,
  p_employee_id uuid DEFAULT NULL,
  p_community_type text DEFAULT NULL,
  p_role_description text DEFAULT NULL,
  p_is_primary boolean DEFAULT false,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stakeholder_id uuid;
  v_final_org_id uuid;
BEGIN
  v_final_org_id := p_organization_id;

  IF p_entity_type = 'community' AND v_final_org_id IS NULL THEN
    v_final_org_id := btp.ensure_community_organization(
      COALESCE(p_role_description, 'Communauté'),
      COALESCE(p_community_type, 'communaute'),
      p_external_ref
    );
  END IF;

  INSERT INTO btp.project_stakeholders (
    id, project_id, external_ref, stakeholder_type, stakeholder_entity_type,
    organization_id, supplier_id, employee_id, community_type,
    role_description, is_primary, metadata
  ) VALUES (
    gen_random_uuid(), p_project_id, p_external_ref, p_stakeholder_type, p_entity_type,
    v_final_org_id, p_supplier_id, p_employee_id, p_community_type,
    p_role_description, p_is_primary, p_metadata
  )
  ON CONFLICT (external_ref) DO UPDATE SET
    stakeholder_type = EXCLUDED.stakeholder_type,
    stakeholder_entity_type = EXCLUDED.stakeholder_entity_type,
    organization_id = COALESCE(EXCLUDED.organization_id, btp.project_stakeholders.organization_id),
    supplier_id = COALESCE(EXCLUDED.supplier_id, btp.project_stakeholders.supplier_id),
    employee_id = COALESCE(EXCLUDED.employee_id, btp.project_stakeholders.employee_id),
    community_type = COALESCE(EXCLUDED.community_type, btp.project_stakeholders.community_type),
    role_description = COALESCE(EXCLUDED.role_description, btp.project_stakeholders.role_description),
    is_primary = EXCLUDED.is_primary,
    metadata = btp.project_stakeholders.metadata || EXCLUDED.metadata
  RETURNING id INTO v_stakeholder_id;

  RETURN v_stakeholder_id;
END;
$$;

COMMENT ON FUNCTION btp.upsert_stakeholder IS
  'Upsert générique de stakeholder';

GRANT EXECUTE ON FUNCTION btp.upsert_stakeholder(
  uuid, text, text, text, uuid, uuid, uuid, text, text, boolean, jsonb
) TO authenticated, service_role;

-- ============================================================
-- 10. VUES UTILITAIRES
-- ============================================================

DROP VIEW IF EXISTS btp.project_stakeholders_full CASCADE;
DROP VIEW IF EXISTS btp.project_stakeholders_community CASCADE;

CREATE VIEW btp.project_stakeholders_full AS
SELECT
  s.id, s.project_id, s.external_ref,
  s.stakeholder_type, s.stakeholder_entity_type,
  s.role_description, s.is_primary, s.community_type, s.metadata,
  o.id AS organization_id, o.name AS organization_name,
  o.org_type AS organization_type, o.category AS organization_category,
  sp.id AS supplier_id, sp.name AS supplier_name,
  e.id AS employee_id, e.full_name AS employee_name, e.email AS employee_email,
  s.created_at, s.updated_at
FROM btp.project_stakeholders s
LEFT JOIN btp.organizations o ON o.id = s.organization_id
LEFT JOIN btp.suppliers sp ON sp.id = s.supplier_id
LEFT JOIN btp.employees e ON e.id = s.employee_id;

CREATE VIEW btp.project_stakeholders_community AS
SELECT * FROM btp.project_stakeholders
WHERE stakeholder_entity_type = 'community'
   OR community_type IS NOT NULL;

-- ============================================================
-- 11. CORRECTION CONTRAINTE project_stakeholders
-- ============================================================

ALTER TABLE btp.project_stakeholders
  DROP CONSTRAINT IF EXISTS stakeholder_entity_check;

ALTER TABLE btp.project_stakeholders
  DROP CONSTRAINT IF EXISTS project_stakeholders_stakeholder_entity_type_check;

ALTER TABLE btp.project_stakeholders
  ADD CONSTRAINT project_stakeholders_stakeholder_entity_type_check
  CHECK (
    stakeholder_entity_type IS NULL
    OR stakeholder_entity_type IN ('employee', 'supplier', 'organization', 'community')
  );

-- ============================================================
-- 12. AJOUT COLONNE completed_at À task_assignments
-- ============================================================

ALTER TABLE btp.task_assignments
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_task_assignments_completed_at
  ON btp.task_assignments(completed_at)
  WHERE completed_at IS NOT NULL;

-- ============================================================
-- 13. RECHARGEMENT CACHE POSTGREST
-- ============================================================

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;

-- ============================================================
-- 14. VÉRIFICATION FINALE
-- ============================================================

-- 14.1 Contraintes sur organizations
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'btp.organizations'::regclass
  AND contype = 'c';

-- 14.2 Valeurs finales de org_type
SELECT org_type, category, COUNT(*) AS nb
FROM btp.organizations
GROUP BY org_type, category
ORDER BY nb DESC;

-- 14.3 Colonnes de organizations
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'btp' AND table_name = 'organizations'
ORDER BY ordinal_position;

-- 14.4 Colonnes de project_stakeholders (✅ FIX : était "stakeholders")
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'btp' AND table_name = 'project_stakeholders'
ORDER BY ordinal_position;

-- 14.5 Fonctions créées
SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  pg_get_function_result(p.oid) AS returns
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'btp'
  AND p.proname IN ('ensure_community_organization', 'upsert_stakeholder', 'validate_stakeholder_entity');

-- ============================================================
-- FIN DE MIGRATION
-- ============================================================