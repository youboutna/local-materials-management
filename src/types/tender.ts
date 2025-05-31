
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
  // Technical subcategories
  | 'preuves_capacites_techniques'
  | 'experience_generale_marche'
  | 'methodologie'
  | 'personnel_cle'
  | 'planning_travaux'
  | 'calendrier_livraison'
  | 'conformite_techniques'
  // Financial subcategories
  | 'preuves_capacites_financieres'
  | 'chiffre_affaires_annuel'
  | 'devis_quantitatif_estimatif'
  | 'garantie_bancaire'
  | 'garantie_soumission';

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
    description?: string;
    file_url?: string;
    file_name?: string;
    mime_type?: string;
    file_size?: number;
  };
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
  garantie_soumission: 'Garantie de soumission pour la période'
};

export const TENDER_CATEGORY_LABELS = {
  administrative: 'A - Administratifs',
  technical: 'B - Techniques',
  financial: 'C - Financières'
};
