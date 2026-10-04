-- =============================================================================
-- MIGRATION : 20250830171458_fix_tender_document_category.sql
-- Date       : 2025-08-30
-- Objet      : Convertir ENUM → TEXT sur btp.tender_documents
--              + supprimer la vue legacy public.tender_documents
--
-- CONTEXTE :
--   - Ancien schéma : tables métier dans public
--   - Nouveau schéma : tables métier dans btp
--   - Legacy : vue public.tender_documents (redirection) à SUPPRIMER
--
-- SÉCURITÉ :
--   - Idempotente : DROP IF EXISTS + vérifications de type
--   - Pas d'ENUM (validation côté référentiels TS)
--   - Table ref_nomenclature pour cache UI
-- =============================================================================

BEGIN;

-- =============================================================================
-- ÉTAPE 1 : SUPPRIMER LA VUE LEGACY public.tender_documents
-- =============================================================================
-- Cette vue n'est plus nécessaire depuis la migration vers le schéma btp.

DO $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = 'tender_documents'
          AND c.relkind IN ('v', 'm')
    ) INTO v_exists;

    IF v_exists THEN
        EXECUTE 'DROP VIEW IF EXISTS public.tender_documents CASCADE';
        RAISE NOTICE '✅ Vue legacy supprimée : public.tender_documents';
    ELSE
        RAISE NOTICE 'ℹ️  Vue legacy public.tender_documents absente';
    END IF;
END $$;

-- Sécurité : drop aussi les autres vues legacy éventuelles
DO $$
DECLARE
    v_rec RECORD;
    v_legacy_views TEXT[] := ARRAY[
        'public.tender_document_submissions',
        'public.tender_documents_view',
        'public.v_tender_documents'
    ];
    v_view TEXT;
BEGIN
    FOREACH v_view IN ARRAY v_legacy_views
    LOOP
        BEGIN
            EXECUTE format('DROP VIEW IF EXISTS %s CASCADE', v_view);
            RAISE NOTICE '  ✅ Vue legacy supprimée : %', v_view;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '  ℹ️  % : %', v_view, SQLERRM;
        END;
    END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 2 : CONVERTIR ENUM → TEXT SUR btp.tender_documents
-- =============================================================================

DO $$
DECLARE
    v_current_type TEXT;
BEGIN
    -- category
    SELECT c.udt_name INTO v_current_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'btp'
      AND c.table_name = 'tender_documents'
      AND c.column_name = 'category';

    IF v_current_type IS NULL THEN
        RAISE NOTICE '  ⚠️  btp.tender_documents.category absente — skip';
    ELSIF v_current_type = 'text' THEN
        RAISE NOTICE '  ℹ️  btp.tender_documents.category déjà TEXT';
    ELSE
        EXECUTE 'ALTER TABLE btp.tender_documents
                 ALTER COLUMN category TYPE TEXT USING category::text';
        RAISE NOTICE '  ✅ category converti de % en TEXT', v_current_type;
    END IF;

    -- subcategory
    SELECT c.udt_name INTO v_current_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'btp'
      AND c.table_name = 'tender_documents'
      AND c.column_name = 'subcategory';

    IF v_current_type IS NULL THEN
        RAISE NOTICE '  ⚠️  btp.tender_documents.subcategory absente — skip';
    ELSIF v_current_type = 'text' THEN
        RAISE NOTICE '  ℹ️  btp.tender_documents.subcategory déjà TEXT';
    ELSE
        EXECUTE 'ALTER TABLE btp.tender_documents
                 ALTER COLUMN subcategory TYPE TEXT USING subcategory::text';
        RAISE NOTICE '  ✅ subcategory converti de % en TEXT', v_current_type;
    END IF;
END $$;

-- =============================================================================
-- ÉTAPE 3 : SUPPRIMER LES ENUM (anti-pattern)
-- =============================================================================

DO $$
DECLARE
    v_enum TEXT;
    v_enums TEXT[] := ARRAY[
        'tender_document_category',
        'tender_document_subcategory',
        'tender_document_category_old',
        'tender_document_subcategory_old'
    ];
BEGIN
    FOREACH v_enum IN ARRAY v_enums
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS btp.%I CASCADE', v_enum);
        RAISE NOTICE '  ✅ ENUM supprimé : btp.%', v_enum;
    END LOOP;
END $$;

-- =============================================================================
-- ÉTAPE 4 : TABLE ref_nomenclature (cache UI)
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

-- =============================================================================
-- ÉTAPE 5 : SEED des nomenclatures (idempotent)
-- =============================================================================

INSERT INTO btp.ref_nomenclature (domain, code, label_fr, label_en, sort_order) VALUES
    -- Catégories
    ('tender_document_category', 'administrative', 'Administratif', 'Administrative', 1),
    ('tender_document_category', 'technical',      'Technique',     'Technical',      2),
    ('tender_document_category', 'financial',      'Financier',     'Financial',      3),

    -- Sous-catégories administratives
    ('tender_document_subcategory', 'lettre_soumission',            'Lettre de soumission',            'Submission Letter',         101),
    ('tender_document_subcategory', 'pouvoir_signature',            'Pouvoir de signature',            'Signature Power',           102),
    ('tender_document_subcategory', 'acte_groupement',              'Acte de groupement',              'Consortium Deed',           103),
    ('tender_document_subcategory', 'attestation_impot',            'Attestation d''impôt',            'Tax Certificate',           104),
    ('tender_document_subcategory', 'attestation_cnss',             'Attestation CNSS',                'Social Security Cert.',     105),
    ('tender_document_subcategory', 'attestation_non_faillite',     'Attestation de non-faillite',     'Bankruptcy Cert.',          106),
    ('tender_document_subcategory', 'renseignement_soumissionnaire', 'Renseignements soumissionnaire', 'Bidder Information',        107),

    -- Sous-catégories techniques
    ('tender_document_subcategory', 'preuves_capacites_techniques', 'Preuves de capacités techniques', 'Technical Capacity Proofs', 201),
    ('tender_document_subcategory', 'experience_generale_marche',   'Expérience générale',             'General Experience',        202),
    ('tender_document_subcategory', 'methodologie',                 'Méthodologie',                    'Methodology',               203),
    ('tender_document_subcategory', 'personnel_cle',                'Personnel clé',                   'Key Personnel',             204),
    ('tender_document_subcategory', 'planning_travaux',             'Planning des travaux',            'Work Schedule',             205),
    ('tender_document_subcategory', 'ddqe',                         'DDQE',                            'DQEP',                      206),

    -- Sous-catégories financières
    ('tender_document_subcategory', 'preuves_capacites_financieres', 'Preuves de capacités financières','Financial Capacity Proofs', 301),
    ('tender_document_subcategory', 'chiffre_affaires_annuel',      'Chiffre d''affaires annuel',      'Annual Revenue',            302),
    ('tender_document_subcategory', 'devis_quantitatif_estimatif',  'Devis quantitatif estimatif',     'Estimated Quantities',      303),
    ('tender_document_subcategory', 'garantie_bancaire',            'Garantie bancaire',               'Bank Guarantee',            304),
    ('tender_document_subcategory', 'montant_marche',               'Montant du marché',               'Contract Amount',           305)
ON CONFLICT (domain, code) DO NOTHING;

-- =============================================================================
-- ÉTAPE 6 : VÉRIFICATION POST-MIGRATION
-- =============================================================================

DO $$
DECLARE
    v_rec RECORD;
    v_enum_count INT;
    v_legacy_count INT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════════════════════════';
    RAISE NOTICE '  VÉRIFICATION POST-MIGRATION';
    RAISE NOTICE '════════════════════════════════════════════════════════════';

    -- Colonnes converties
    FOR v_rec IN
        SELECT column_name, udt_name
        FROM information_schema.columns
        WHERE table_schema = 'btp'
          AND table_name = 'tender_documents'
          AND column_name IN ('category', 'subcategory')
    LOOP
        RAISE NOTICE '  • btp.tender_documents.% : %',
            v_rec.column_name, v_rec.udt_name;
    END LOOP;

    -- ENUM restants
    SELECT COUNT(*) INTO v_enum_count
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'btp'
      AND t.typtype = 'e'
      AND t.typname LIKE 'tender_document%';

    RAISE NOTICE '';
    IF v_enum_count = 0 THEN
        RAISE NOTICE '  ✅ Plus aucun ENUM tender_document*';
    ELSE
        RAISE WARNING '  ⚠️  % ENUM persistent', v_enum_count;
    END IF;

    -- Vues legacy restantes
    SELECT COUNT(*) INTO v_legacy_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname LIKE '%tender_document%'
      AND c.relkind IN ('v', 'm');

    IF v_legacy_count = 0 THEN
        RAISE NOTICE '  ✅ Plus aucune vue legacy dans public';
    ELSE
        RAISE WARNING '  ⚠️  % vue(s) legacy persistent dans public', v_legacy_count;
    END IF;

    RAISE NOTICE '════════════════════════════════════════════════════════════';
END $$;

NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

COMMIT;