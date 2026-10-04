-- =============================================================================
-- MIGRATION : 20250913140000_fix_phase_type_constraint.sql
-- Date       : 2025-09-13
-- Objet      : SUPPRIMER la contrainte CHECK sur phase_type
--              → La validation se fait côté application (référentiels TS)
--
-- PRINCIPE :
--   La colonne phase_type est une NOMENCLATURE ÉVOLUTIVE.
--   → Pas de CHECK IN (...) en DB
--   → Validation côté application via référentiels TS
--   → Ajout d'une valeur = éditer un fichier TS, PAS une migration DB
--
-- FIX 23514 : la contrainte échouait car des valeurs existantes
--             (ex: 'infrastructure', 'batiment') n'étaient pas dans la liste.
--             → On supprime la contrainte au lieu de l'élargir.
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : DIAGNOSTIC — Quelles valeurs existent réellement ?
-- =============================================================================

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  DIAGNOSTIC — Valeurs phase_type dans btp.project_phases';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  FOR v_rec IN
    SELECT phase_type, COUNT(*) AS nb
    FROM btp.project_phases
    GROUP BY phase_type
    ORDER BY nb DESC
  LOOP
    RAISE NOTICE '  • phase_type = % : % lignes',
      COALESCE(quote_literal(v_rec.phase_type), 'NULL'), v_rec.nb;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- ÉTAPE 2 : SUPPRIMER LA CONTRAINTE (définitive)
-- =============================================================================
-- ✅ Pas d'élargissement — on supprime la contrainte.
-- ✅ La validation est côté app.
-- =============================================================================

ALTER TABLE btp.project_phases
  DROP CONSTRAINT IF EXISTS project_phases_phase_type_check;

DO $$ BEGIN RAISE NOTICE '✅ Contrainte project_phases_phase_type_check supprimée'; END $$;

-- =============================================================================
-- ÉTAPE 3 : NORMALISER les valeurs NULL/vides (optionnel)
-- =============================================================================
-- On ne remplit PAS les NULL : on laisse la DB accepter NULL.
-- La validation côté app gérera la valeur par défaut.

-- Note : on ne fait PAS d'UPDATE ici pour ne pas modifier les données existantes.
-- Si vous voulez forcer une valeur par défaut, décommenter :
--
-- UPDATE btp.project_phases
-- SET phase_type = 'standard'
-- WHERE phase_type IS NULL OR phase_type = '';

-- =============================================================================
-- ÉTAPE 4 : DÉFINIR UN DEFAULT (facultatif, structurel)
-- =============================================================================
-- Un DEFAULT est un invariant structurel → OK en DB.

ALTER TABLE btp.project_phases
  ALTER COLUMN phase_type SET DEFAULT 'standard';

DO $$ BEGIN RAISE NOTICE '✅ DEFAULT phase_type = standard'; END $$;

-- =============================================================================
-- ÉTAPE 5 : SEED DES VALEURS DANS ref_nomenclature (cache UI)
-- =============================================================================

INSERT INTO btp.ref_nomenclature (domain, code, label_fr, label_en, sort_order) VALUES
  ('phase_type', 'standard',           'Standard',              'Standard',           1),
  ('phase_type', 'custom',             'Personnalisé',          'Custom',             2),
  ('phase_type', 'pre_construction',   'Pré-construction',      'Pre-construction',   3),
  ('phase_type', 'site_preparation',   'Préparation du site',   'Site Preparation',   4),
  ('phase_type', 'foundation',         'Fondation',             'Foundation',         5),
  ('phase_type', 'framing',            'Charpente / Élévation', 'Framing',            6),
  ('phase_type', 'structural_work',    'Gros œuvre / Toiture',  'Structural Work',    7),
  ('phase_type', 'finishing',          'Finitions',             'Finishing',          8),
  ('phase_type', 'post_construction',  'Post-construction',     'Post-construction',  9),
  ('phase_type', 'handover',           'Livraison',             'Handover',          10),
  ('phase_type', 'etudes',             'Études',                'Studies',           11),
  ('phase_type', 'travaux',            'Travaux',               'Works',             12),
  ('phase_type', 'reception',          'Réception',             'Reception',         13),
  ('phase_type', 'fabrication',        'Fabrication',           'Manufacturing',     14),
  ('phase_type', 'installation',       'Installation',          'Installation',      15),
  ('phase_type', 'analyse',            'Analyse',               'Analysis',          16),
  ('phase_type', 'definition',         'Définition',            'Definition',        17),
  ('phase_type', 'validation',         'Validation',            'Validation',        18),
  ('phase_type', 'execution',          'Exécution',             'Execution',         19),
  ('phase_type', 'pre_feasibility',    'Pré-faisabilité',       'Pre-feasibility',   20),
  ('phase_type', 'design_dao',         'Conception DAO',        'Design DAO',        21),
  ('phase_type', 'conception',         'Conception',            'Design',            22),
  ('phase_type', 'preparation',        'Préparation',           'Preparation',       23),
  ('phase_type', 'design',             'Design',                'Design',            24),
  ('phase_type', 'construction',       'Construction',          'Construction',      25),
  ('phase_type', 'cloture',            'Clôture',               'Closure',           26),
  ('phase_type', 'livraison',          'Livraison',             'Delivery',          27),
  ('phase_type', 'planification',      'Planification',         'Planning',          28),
  ('phase_type', 'planning',           'Planning',              'Planning',          29)
ON CONFLICT (domain, code) DO NOTHING;

DO $$ BEGIN RAISE NOTICE '✅ Seed phase_type appliqué'; END $$;

-- =============================================================================
-- ÉTAPE 6 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
  v_constraint_exists BOOLEAN;
  v_rec RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════';
  RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════';

  -- La contrainte est-elle vraiment absente ?
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'project_phases_phase_type_check'
      AND conrelid = 'btp.project_phases'::regclass
  ) INTO v_constraint_exists;

  IF v_constraint_exists THEN
    RAISE EXCEPTION '❌ Contrainte TOUJOURS PRÉSENTE';
  ELSE
    RAISE NOTICE '✅ Contrainte project_phases_phase_type_check : ABSENTE';
  END IF;

  -- Valeurs actuelles
  RAISE NOTICE '';
  RAISE NOTICE 'Valeurs phase_type actuelles :';
  FOR v_rec IN
    SELECT phase_type, COUNT(*) AS nb
    FROM btp.project_phases
    GROUP BY phase_type
    ORDER BY nb DESC
  LOOP
    RAISE NOTICE '  • % : % lignes',
      COALESCE(quote_literal(v_rec.phase_type), 'NULL'), v_rec.nb;
  END LOOP;

  RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;