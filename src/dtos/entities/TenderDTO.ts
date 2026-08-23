/**
 * Tender DTO - Data Transfer Object for Tender Entity
 * Following hexagonal architecture principles
 */

import { BaseEntityDTO } from './BaseEntityDTO';
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
    fileUrl?: string | null;
    fileName?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
  } | null;
}

export const TENDER_DOCUMENT_LABELS = {
  // Administrative
  lettreSoumission: 'Lettre de soumission',
  pouvoirSignature: 'Pouvoir de signature',
  acteGroupement: 'Acte de groupement',
  attestationImpot: 'Attestation d\'impôt',
  attestationCnss: 'Attestation CNSS',
  attestationNonFaillite: 'Attestation non faillite',
  renseignementSoumissionnaire: 'Renseignement sur le soumissionnaire',
  
  // Technical
  preuvesCapacitesTechniques: 'Preuves de capacités techniques (projets similaires)',
  experienceGeneraleMarche: 'Expérience générale dans l\'objet du marché',
  methodologie: 'Méthodologie',
  personnelCle: 'Personnel clé',
  planningTravaux: 'Planning travaux',
  calendrierLivraison: 'Calendrier de livraison',
  conformiteTechniques: 'Conformité techniques',
  
  // Financial
  preuvesCapacitesFinancieres: 'Preuves de capacités financières',
  chiffreAffairesAnnuel: 'Chiffre d\'affaires annuel moyen des activités',
  devisQuantitatifEstimatif: 'Devis quantitatif estimatif',
  garantieBancaire: 'Garantie bancaire',
  garantieSoumission: 'Garantie de soumission pour la période',

  // Planification (PAA)
  planAnnuelAchats: 'Plan Annuel d\'Achats (PAA)',
  modelePaa: 'Modèle de Plan Annuel des Achats',
  validationOrdonnateur: 'Validation par l\'Ordonnateur',
  publicationArmp: 'Publication sur le site ARMP',

  // Initiation
  demandeInitiation: 'Demande d\'Initiation d\'une Procédure',
  descriptionBesoin: 'Description détaillée du besoin',
  sourceFinancement: 'Source de financement',
  montantAlloue: 'Montant alloué',
  procedureProposee: 'Procédure proposée',

  // Sélection
  consultationDirecte: 'Consultation Directe (≤ 600 000 MRU)',
  devisComparatifs: 'Devis comparatifs (3 minimum)',
  facturesCommandes: 'Factures et bons de commande',
  consultationConcurrentielle: 'Consultation Concurrentielle',
  lettreConsultation: 'Lettre de consultation (Pièce N°1)',
  modeleSoumission: 'Modèle de soumission (Pièce N°2)',
  ddqe: 'Devis Descriptif Quantitatif Estimatif - DDQE (Pièce N°3)',
  modeleContrat: 'Modèle de contrat (Pièce N°4)',
  registreReceptionPlis: 'Registre de Réception des Plis',
  recuDepotPlis: 'Reçu de Dépôt de Plis',
  pvOuverturePlis: 'Procès-Verbal d\'Ouverture des Plis',
  pvEvaluationAttribution: 'PV d\'Évaluation et Proposition d\'Attribution',
  selectionConsultants: 'Sélection de Consultants',
  dossierSmcSfqcSci: 'Dossier Type pour SMC/SFQC/SCI',
  lettreInvitation: 'Lettre d\'invitation (Pièce N°1)',
  termesReference: 'Termes de Référence - TdR (Pièce N°3)',
  pvEvaluationTechnique: 'PV d\'évaluation technique et financière',

  // Attribution
  lettreNotification: 'Lettre de Notification d\'Attribution',
  nomAttributaire: 'Nom de l\'attributaire',
  montantMarche: 'Montant du marché',
  delaiExecution: 'Délai d\'exécution',
  publicationProvisoire: 'Publication provisoire (2 jours pour recours)',
  signatureContrat: 'Signature du contrat',

  // Archivage
  originalOffres: 'Original des offres',
  pvArchivage: 'PV d\'ouverture et d\'évaluation',
  contratsSignes: 'Contrats signés',
  preuvesPublication: 'Preuves de publication',
  chemisesArchivage: 'Chemises ou boîtes d\'archivage étiquetées',
  doubleNumerique: 'Double numérique recommandé'
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

