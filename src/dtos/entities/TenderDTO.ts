/**
 * Tender DTO - Data Transfer Object for Tender Entity
 * Following hexagonal architecture principles
 */

import { BaseEntityDTO } from '@/dtos/entities/OrganizationDTO';;
import { 
  TenderStatus, 
  SelectionMode, 
  MarketType, 
  EvaluationCriteria, 
  TenderSubmissionStatus, 
  TenderCategory, 
  TenderDocumentType, 
  TenderProcurementType 
} from '@/domain/entities/Tender';

export interface TenderDTO extends BaseEntityDTO {
  // Basic Information
  projectId: string | null;
  title: string;
  description: string | null;
  tenderNumber: string | null;
  status: TenderStatus;
  
  // Tender Configuration
  selectionMode: SelectionMode | null;
  marketType: MarketType | null;
  financingSource: string | null;
  projectReference: string | null;
  
  // Dates
  publicationDate: string | null;
  deadlineDate: string | null;
  submissionDeadline: string | null;
  launchDate: string | null;
  attributionDate: string | null;
  
  // Budget Information
  budgetMin: number | null;
  budgetMax: number | null;
  estimatedValue: number | null;
  contractDuration: number | null;
  
  // Evaluation Configuration
  evaluationCriteria: EvaluationCriteria[];
  eligibilityRequirements: string[];
  evaluationDeadline: string | null;
  awardCriteria: string | null;
  
  // Workflow Information
  currentPhase: number | null;
  currentStage: string | null;
  tenderCategory: TenderCategory | null;
  
  // Additional Fields
  procurementType: TenderProcurementType | null;
  weight: number | null;
}

// TenderSubmissionDTO defined below at line ~190

export interface TenderCreateDTO {
  projectId?: string;
  title: string;
  description?: string;
  tenderNumber?: string;
  selectionMode?: SelectionMode;
  marketType?: MarketType;
  deadlineDate?: string;
  budgetMin?: number;
  budgetMax?: number;
  evaluationCriteria?: EvaluationCriteria[];
  eligibilityRequirements?: string[];
  procurementType?: TenderProcurementType;
  tenderCategory?: TenderCategory;
}

export interface TenderUpdateDTO {
  title?: string;
  description?: string;
  status?: TenderStatus;
  selectionMode?: SelectionMode;
  marketType?: MarketType;
  financingSource?: string;
  projectReference?: string;
  publicationDate?: string;
  deadlineDate?: string;
  submissionDeadline?: string;
  launchDate?: string;
  attributionDate?: string;
  budgetMin?: number;
  budgetMax?: number;
  estimatedValue?: number;
  contractDuration?: number;
  evaluationCriteria?: EvaluationCriteria[];
  eligibilityRequirements?: string[];
  evaluationDeadline?: string;
  awardCriteria?: string;
  currentPhase?: number;
  currentStage?: string;
  tenderCategory?: TenderCategory;
  procurementType?: TenderProcurementType;
  weight?: number;
}

export interface TenderListDTO {
  id: string;
  title: string;
  status: TenderStatus;
  selectionMode: SelectionMode | null;
  marketType: MarketType | null;
  deadlineDate: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenderSummaryDTO {
  id: string;
  title: string;
  status: TenderStatus;
  deadlineDate: string | null;
  daysUntilDeadline: number | null;
  isOverdue: boolean;
  budgetRange: string;
  submissionCount: number;
  createdAt: string;
}

export interface GetAllTendersRequestDTO {
  limit?: number;
  offset?: number;
}

export interface GetTenderByIdRequestDTO {
  id: string;
}

export interface GetTenderSubmissionsRequestDTO {
  tenderId: string;
}

export interface GetTendersByStatusRequestDTO {
  status: 'draft' | 'published' | 'closed' | 'awarded';
}

export interface SearchTendersRequestDTO {
  searchTerm: string;
}

export interface GetPublishedTendersForSubmissionRequestDTO {
  limit?: number;
}

export interface GetTendersByProjectRequestDTO {
  projectId: string;
}

export interface GetTenderStatsRequestDTO {
  startDate?: string;
  endDate?: string;
}

export interface TenderValidationResultDTO {
  isValid: boolean;
  errors: string[];
}

export interface TenderDocumentDTO {
  id: string;
  tenderId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TenderSubmissionDTO {
  id: string;
  tenderId: string;
  supplierId: string;
  status: TenderSubmissionStatus | string;
  submittedAt: string;
  documents?: TenderDocumentDTO[];
}

export interface TenderDocumentWithDetails extends TenderDocumentDTO {
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

// Administrative subcategory groups for better organization
export const ADMINISTRATIVE_SUBCATEGORY_GROUPS = {
  paa: {
    label: 'PAA - Plan Annuel d\'Achats',
    subcategories: ['plan_annuel_achats', 'modele_paa', 'validation_ordonnateur', 'publication_armp']
  },
  initiation: {
    label: 'Initiation',
    subcategories: ['demande_initiation', 'procedure_proposee', 'description_besoin', 'source_financement', 'montant_alloue']
  },
  selection: {
    label: 'Sélection',
    subcategories: ['consultation_directe', 'consultation_concurrentielle', 'lettre_consultation', 'modele_soumission', 'modele_contrat', 'registre_reception_plis', 'recu_depot_plis', 'pv_ouverture_plis', 'pv_evaluation_attribution', 'selection_consultants', 'dossier_smc_sfqc_sci', 'lettre_invitation', 'devis_comparatifs', 'factures_commandes']
  },
  attribution: {
    label: 'Attribution',
    subcategories: ['lettre_notification', 'nom_attributaire', 'delai_execution', 'publication_provisoire', 'signature_contrat', 'montant_marche']
  },
  archival: {
    label: 'Archivage',
    subcategories: ['original_offres', 'pv_archivage', 'contrats_signes', 'preuves_publication', 'chemises_archivage', 'double_numerique']
  }
} as const;

