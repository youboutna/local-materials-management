-- Update tender document category enum to match the reorganized structure
/*ALTER TYPE IF EXISTS tender_document_category RENAME TO tender_document_category_old;
*/
CREATE TYPE tender_document_category AS ENUM (
  'administrative',
  'technical', 
  'financial'
);

-- Update tender document subcategory enum to include all new subcategories
/*ALTER TYPE IF EXISTS tender_document_subcategory RENAME TO tender_document_subcategory_old;
*/
CREATE TYPE tender_document_subcategory AS ENUM (
  -- Administrative subcategories
  'lettre_soumission',
  'pouvoir_signature',
  'acte_groupement',
  'attestation_impot',
  'attestation_cnss',
  'attestation_non_faillite',
  'renseignement_soumissionnaire',
  -- Planification (PAA) - Administrative
  'plan_annuel_achats',
  'modele_paa',
  'validation_ordonnateur',
  'publication_armp',
  -- Initiation - Administrative
  'demande_initiation',
  'procedure_proposee',
  -- Sélection - Administrative
  'consultation_directe',
  'consultation_concurrentielle',
  'lettre_consultation',
  'modele_soumission',
  'modele_contrat',
  'registre_reception_plis',
  'recu_depot_plis',
  'pv_ouverture_plis',
  'pv_evaluation_attribution',
  'selection_consultants',
  'dossier_smc_sfqc_sci',
  'lettre_invitation',
  -- Attribution - Administrative
  'lettre_notification',
  'nom_attributaire',
  'delai_execution',
  'publication_provisoire',
  'signature_contrat',
  -- Archivage - Administrative
  'original_offres',
  'pv_archivage',
  'contrats_signes',
  'preuves_publication',
  'chemises_archivage',
  'double_numerique',
  -- Technical subcategories
  'preuves_capacites_techniques',
  'experience_generale_marche',
  'methodologie',
  'personnel_cle',
  'planning_travaux',
  'calendrier_livraison',
  'conformite_techniques',
  -- Initiation - Technical
  'description_besoin',
  -- Sélection - Technical
  'ddqe',
  'termes_reference',
  'pv_evaluation_technique',
  -- Financial subcategories
  'preuves_capacites_financieres',
  'chiffre_affaires_annuel',
  'devis_quantitatif_estimatif',
  'garantie_bancaire',
  'garantie_soumission',
  -- Initiation - Financial
  'source_financement',
  'montant_alloue',
  -- Sélection - Financial
  'devis_comparatifs',
  'factures_commandes',
  -- Attribution - Financial
  'montant_marche'
);

-- Update the tender_documents table to use new enum types
/**ALTER TABLE btp.tender_documents 
  ALTER COLUMN category TYPE tender_document_category USING category::text::tender_document_category,
  ALTER COLUMN subcategory TYPE tender_document_subcategory USING subcategory::text::tender_document_subcategory;

-- Clean up old enum types
DROP TYPE IF EXISTS tender_document_category_old;
DROP TYPE IF EXISTS tender_document_subcategory_old;
*/