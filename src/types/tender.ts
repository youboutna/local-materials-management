export type TenderDocumentCategory = 'administrative' | 'technical' | 'financial';

export type TenderDocumentSubcategory = 
  // Administrative subcategories
  | 'lettre_soumission'
  | 'pouvoir_signature'
  | 'acte_groupement'
  | 'attestation_impot'
  | 'attestation_cnss'
  | 'attestation_non_faillite'
  | 'renseignement_soumissionnaire'
  // Planification (PAA) - Administrative
  | 'plan_annuel_achats'
  | 'modele_paa'
  | 'validation_ordonnateur'
  | 'publication_armp'
  // Initiation - Administrative
  | 'demande_initiation'
  | 'procedure_proposee'
  // Sélection - Administrative
  | 'consultation_directe'
  | 'consultation_concurrentielle'
  | 'lettre_consultation'
  | 'modele_soumission'
  | 'modele_contrat'
  | 'registre_reception_plis'
  | 'recu_depot_plis'
  | 'pv_ouverture_plis'
  | 'pv_evaluation_attribution'
  | 'selection_consultants'
  | 'dossier_smc_sfqc_sci'
  | 'lettre_invitation'
  // Attribution - Administrative
  | 'lettre_notification'
  | 'nom_attributaire'
  | 'delai_execution'
  | 'publication_provisoire'
  | 'signature_contrat'
  // Archivage - Administrative
  | 'original_offres'
  | 'pv_archivage'
  | 'contrats_signes'
  | 'preuves_publication'
  | 'chemises_archivage'
  | 'double_numerique'
  // Technical subcategories
  | 'preuves_capacites_techniques'
  | 'experience_generale_marche'
  | 'methodologie'
  | 'personnel_cle'
  | 'planning_travaux'
  | 'calendrier_livraison'
  | 'conformite_techniques'
  // Initiation - Technical
  | 'description_besoin'
  // Sélection - Technical
  | 'ddqe'
  | 'termes_reference'
  | 'pv_evaluation_technique'
  // Financial subcategories
  | 'preuves_capacites_financieres'
  | 'chiffre_affaires_annuel'
  | 'devis_quantitatif_estimatif'
  | 'garantie_bancaire'
  | 'garantie_soumission'
  // Initiation - Financial
  | 'source_financement'
  | 'montant_alloue'
  // Sélection - Financial
  | 'devis_comparatifs'
  | 'factures_commandes'
  // Attribution - Financial
  | 'montant_marche';

export type TenderDocumentStatus = 'pending' | 'approved' | 'rejected' | 'requires_revision';

export interface TenderDocument {
  id: string;
  project_id: string;
  document_id: string;
  category: TenderDocumentCategory;
  subcategory: TenderDocumentSubcategory;
  is_required: boolean;
  is_submitted: boolean;
  submission_date?: string;
  reviewer_notes?: string;
  status: TenderDocumentStatus;
  created_at: string;
  updated_at: string;
}

export interface TenderDocumentWithDetails extends TenderDocument {
  document?: {
    id: string;
    title: string;
    description?: string | null;
    file_url?: string | null;
    file_name?: string | null;
    mime_type?: string | null;
    file_size?: number | null;
  } | null;
}

export const TENDER_DOCUMENT_LABELS = {
  // Administrative
  lettre_soumission: 'Lettre de soumission',
  pouvoir_signature: 'Pouvoir de signature',
  acte_groupement: 'Acte de groupement',
  attestation_impot: 'Attestation d\'impôt',
  attestation_cnss: 'Attestation CNSS',
  attestation_non_faillite: 'Attestation non faillite',
  renseignement_soumissionnaire: 'Renseignement sur le soumissionnaire',
  
  // Technical
  preuves_capacites_techniques: 'Preuves de capacités techniques (projets similaires)',
  experience_generale_marche: 'Expérience générale dans l\'objet du marché',
  methodologie: 'Méthodologie',
  personnel_cle: 'Personnel clé',
  planning_travaux: 'Planning travaux',
  calendrier_livraison: 'Calendrier de livraison',
  conformite_techniques: 'Conformité techniques',
  
  // Financial
  preuves_capacites_financieres: 'Preuves de capacités financières',
  chiffre_affaires_annuel: 'Chiffre d\'affaires annuel moyen des activités',
  devis_quantitatif_estimatif: 'Devis quantitatif estimatif',
  garantie_bancaire: 'Garantie bancaire',
  garantie_soumission: 'Garantie de soumission pour la période',

  // Planification (PAA)
  plan_annuel_achats: 'Plan Annuel d\'Achats (PAA)',
  modele_paa: 'Modèle de Plan Annuel des Achats',
  validation_ordonnateur: 'Validation par l\'Ordonnateur',
  publication_armp: 'Publication sur le site ARMP',

  // Initiation
  demande_initiation: 'Demande d\'Initiation d\'une Procédure',
  description_besoin: 'Description détaillée du besoin',
  source_financement: 'Source de financement',
  montant_alloue: 'Montant alloué',
  procedure_proposee: 'Procédure proposée',

  // Sélection
  consultation_directe: 'Consultation Directe (≤ 600 000 MRU)',
  devis_comparatifs: 'Devis comparatifs (3 minimum)',
  factures_commandes: 'Factures et bons de commande',
  consultation_concurrentielle: 'Consultation Concurrentielle',
  lettre_consultation: 'Lettre de consultation (Pièce N°1)',
  modele_soumission: 'Modèle de soumission (Pièce N°2)',
  ddqe: 'Devis Descriptif Quantitatif Estimatif - DDQE (Pièce N°3)',
  modele_contrat: 'Modèle de contrat (Pièce N°4)',
  registre_reception_plis: 'Registre de Réception des Plis',
  recu_depot_plis: 'Reçu de Dépôt de Plis',
  pv_ouverture_plis: 'Procès-Verbal d\'Ouverture des Plis',
  pv_evaluation_attribution: 'PV d\'Évaluation et Proposition d\'Attribution',
  selection_consultants: 'Sélection de Consultants',
  dossier_smc_sfqc_sci: 'Dossier Type pour SMC/SFQC/SCI',
  lettre_invitation: 'Lettre d\'invitation (Pièce N°1)',
  termes_reference: 'Termes de Référence - TdR (Pièce N°3)',
  pv_evaluation_technique: 'PV d\'évaluation technique et financière',

  // Attribution
  lettre_notification: 'Lettre de Notification d\'Attribution',
  nom_attributaire: 'Nom de l\'attributaire',
  montant_marche: 'Montant du marché',
  delai_execution: 'Délai d\'exécution',
  publication_provisoire: 'Publication provisoire (2 jours pour recours)',
  signature_contrat: 'Signature du contrat',

  // Archivage
  original_offres: 'Original des offres',
  pv_archivage: 'PV d\'ouverture et d\'évaluation',
  contrats_signes: 'Contrats signés',
  preuves_publication: 'Preuves de publication',
  chemises_archivage: 'Chemises ou boîtes d\'archivage étiquetées',
  double_numerique: 'Double numérique recommandé'
};

export const TENDER_CATEGORY_LABELS = {
  administrative: 'A - Administratifs',
  technical: 'B - Techniques',
  financial: 'C - Financières'
};
