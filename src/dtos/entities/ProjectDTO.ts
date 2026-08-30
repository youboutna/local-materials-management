// src/dtos/entities/ProjectDTO.ts
// VERSION FINALE v3.0 - ENUMS standardisés (anglais, MAJUSCULES, sans V2)

/**
 * Project Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * 
 * Règle ENUM : codes techniques en ANGLAIS MAJUSCULES
 * Les libellés sont gérés par le référentiel i18n (ENUM_LABELS)
 * Ne jamais afficher les codes techniques dans l'UI
 */
// src/dtos/entities/ProjectDTO.ts
// VERSION FINALE v3.1 - Correction export PROJECT_STATUS_LABELS

/**
 * Project Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * 
 * Règle ENUM : codes techniques en ANGLAIS MAJUSCULES
 * Les libellés sont gérés par le référentiel i18n (ENUM_LABELS)
 * Ne jamais afficher les codes techniques dans l'UI
 */

import { BaseEntityDTO, BaseFormDTO, BaseUIState, StandardPriority, StandardStatus } from '../shared';
import { PerformanceMetricsDTO } from '../transforms';
import type { ReferentialType } from '@/config/referentials';
import { ProjectResource } from '@/domain/entities/Project';
import { DocumentDTO } from './DocumentDTO';
import { InspectionDTO, InspectionStatus } from './InspectionDTO';
import { MaterialDTO } from './MaterialDTO';
import { MilestoneDTO } from './MilestoneDTO';
import { NotificationDTO } from './NotificationDTO';
import { PaymentDTO } from './PaymentDTO';
import { PhaseDTO } from './PhaseDTO';
import { ProjectAnalyticsDTO } from './ProjectAnalyticsDTO';
import { RiskDTO } from './RiskDTO';
import { StakeholderDTO } from './StakeholderDTO';
import { TaskAssignmentDTO } from './TaskAssignmentDTO';
import { TenderDTO } from './TenderDTO';
import { ENUM_LABELS, getEnumLabel, resolveAnyEnumLabel, type EnumLabel, type SupportedLang } from '@/config/referentials/i18n/enum-labels.referential';

// =============================================================================
// EXPORT DES CONSTANTES
// =============================================================================

export const DELAY_THRESHOLD = {
  WARNING: 10,
  BANK_NOTIFICATION: 20,
  GUARANTEE_TRIGGER: 30,
  LEGAL_ESCALATION: 40,
} as const;

export const DELAY_THRESHOLDS = DELAY_THRESHOLD;

export const NOTIFICATION_ROLES = {
  PROJECT_MANAGER: "project_manager",
  DIRECTOR_PROGRAMMING: "director_programming",
  DIRECTOR: "director",
  BANK_LIAISON: "bank_liaison",
  ENGINEERING_CONSULTANT: "engineering_consultant",
  CONTRACTOR: "contractor",
} as const;

// =============================================================================
// PROJECT STATUS - CODES TECHNIQUES STANDARDISÉS (ANGLAIS, MAJUSCULES, SANS V2)
// =============================================================================

/** Alerte projet minimale (vue détaillée). */
export interface ProjectAlertDTO {
  id: string;
  title: string;
  message?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  type?: string;
  createdAt?: string;
  acknowledged?: boolean;
  resolved?: boolean;
}

/** Ré-export de compatibilité : projet agrégé avec paiements. */
export type { ProjectWithPaymentsDTO as ProjectWithPayments } from './ProjectWithPaymentsDTO';

export enum ProjectStatus {
  // Initial states
  DRAFT = 'DRAFT',
  PLANNED = 'PLANNED',
  PRE_QUALIFICATION = 'PRE_QUALIFICATION',
  
  // Active states
  ON_HOLD = 'ON_HOLD',
  IN_DESIGN = 'IN_DESIGN',
  PLANNED_V2 = 'PLANNED_V2',
  AWARDED = 'AWARDED',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_CONSTRUCTION = 'UNDER_CONSTRUCTION',
  
  // Review states
  UNDER_INSPECTION = 'UNDER_INSPECTION',
  UNDER_REVIEW = 'UNDER_REVIEW',
  
  // Completion states
  COMPLETED = 'COMPLETED',
  CLOSING = 'CLOSING',
  FINISHED = 'FINISHED',
  
  // Problem states
  SUSPENDED = 'SUSPENDED',
  DELAYED = 'DELAYED',
  CANCELLED = 'CANCELLED',

  // Alias historiques (français) — même code technique que les membres anglais.
  EN_ATTENTE = 'ON_HOLD',
  EN_CONCEPTION = 'IN_DESIGN',
  PLANIFIE = 'PLANNED',
  ATTRIBUE = 'AWARDED',
  EN_COURS = 'IN_PROGRESS',
  EN_CONSTRUCTION = 'UNDER_CONSTRUCTION',
  EN_INSPECTION = 'UNDER_INSPECTION',
  EN_REVIEW = 'UNDER_REVIEW',
  TERMINE = 'COMPLETED',
  EN_CLOTURE = 'CLOSING',
  SUSPENDU = 'SUSPENDED',
  EN_RETARD = 'DELAYED',
  ANNULE = 'CANCELLED',
  /** @deprecated alias historique — utiliser IN_PROGRESS. */
  EN_COURS_LEGACY = 'IN_PROGRESS',
}

// =============================================================================
// MAPPING DES ANCIENS CODES VERS LES NOUVEAUX (pour migration)
// =============================================================================

export const LEGACY_STATUS_MAPPING: Record<string, ProjectStatus> = {
  // Anciens codes français
  'en cours': ProjectStatus.IN_PROGRESS,
  'en_cours': ProjectStatus.IN_PROGRESS,
  'en_cours_v2': ProjectStatus.IN_PROGRESS,
  'termine': ProjectStatus.COMPLETED,
  'terminé': ProjectStatus.COMPLETED,
  'termine_v2': ProjectStatus.COMPLETED,
  'en attente': ProjectStatus.ON_HOLD,
  'en_attente': ProjectStatus.ON_HOLD,
  'suspendu': ProjectStatus.SUSPENDED,
  'suspendu_v2': ProjectStatus.SUSPENDED,
  'annule': ProjectStatus.CANCELLED,
  'annulé': ProjectStatus.CANCELLED,
  'annule_v2': ProjectStatus.CANCELLED,
  'attribue': ProjectStatus.AWARDED,
  'attribué': ProjectStatus.AWARDED,
  'attribue_v2': ProjectStatus.AWARDED,
  'planifie': ProjectStatus.PLANNED,
  'planifié': ProjectStatus.PLANNED,
  'planifie_v2': ProjectStatus.PLANNED_V2,
  'en inspection': ProjectStatus.UNDER_INSPECTION,
  'en_inspection': ProjectStatus.UNDER_INSPECTION,
  'en_inspection_v2': ProjectStatus.UNDER_INSPECTION,
  'en construction': ProjectStatus.UNDER_CONSTRUCTION,
  'en_construction': ProjectStatus.UNDER_CONSTRUCTION,
  'en_construction_v2': ProjectStatus.UNDER_CONSTRUCTION,
  'en conception': ProjectStatus.IN_DESIGN,
  'en_conception': ProjectStatus.IN_DESIGN,
  'en_cloture': ProjectStatus.CLOSING,
  'en_cloture_v2': ProjectStatus.CLOSING,
  'en retard': ProjectStatus.DELAYED,
  'en_retard': ProjectStatus.DELAYED,
  'en_retard_v2': ProjectStatus.DELAYED,
  'completed': ProjectStatus.COMPLETED,
  'draft': ProjectStatus.DRAFT,
  'pending': ProjectStatus.ON_HOLD,
  'cancelled': ProjectStatus.CANCELLED,
  // Anciens codes legacy
  'enCours': ProjectStatus.IN_PROGRESS,
  'termine_legacy': ProjectStatus.COMPLETED,
  'enAttente': ProjectStatus.ON_HOLD,
  'enInspection': ProjectStatus.UNDER_INSPECTION,
  'suspendu_legacy': ProjectStatus.SUSPENDED,
  'annule_legacy': ProjectStatus.CANCELLED,
  'attribue_legacy': ProjectStatus.AWARDED,
  'planifie_legacy': ProjectStatus.PLANNED,
  'preQualification': ProjectStatus.PRE_QUALIFICATION,
  'enConception': ProjectStatus.IN_DESIGN,
  'enConstruction': ProjectStatus.UNDER_CONSTRUCTION,
  'enCloture': ProjectStatus.CLOSING,
  'enRetard': ProjectStatus.DELAYED,
};

// =============================================================================
// FONCTION DE NORMALISATION
// =============================================================================

export function normalizeProjectStatus(status?: string): ProjectStatus {
  if (!status) return ProjectStatus.DRAFT;
  
  const normalized = status.trim();
  const upper = normalized.toUpperCase();
  
  // Vérifier si c'est déjà un code valide
  const validCodes = Object.values(ProjectStatus) as string[];
  if (validCodes.includes(upper)) {
    return upper as ProjectStatus;
  }
  
  // Sinon, utiliser le mapping legacy
  const mapped = LEGACY_STATUS_MAPPING[normalized.toLowerCase()];
  if (mapped) return mapped;
  
  // Dernier recours : essayer via resolveAnyEnumLabel
  const resolved = resolveAnyEnumLabel(status);
  if (resolved) {
    const found = Object.values(ProjectStatus).find(s => {
      const label = getProjectStatusLabel(s);
      return label.toLowerCase() === resolved.toLowerCase();
    });
    if (found) return found;
  }
  
  return ProjectStatus.DRAFT;
}

// =============================================================================
// LIBELLÉS DES STATUTS - DEPUIS ENUM_LABELS
// =============================================================================

/**
 * Récupère le libellé d'un statut dans la langue demandée
 */
export function getProjectStatusLabel(status: ProjectStatus | string, lang: SupportedLang = 'fr'): string {
  const code = typeof status === 'string' ? status : status;
  const label = getEnumLabel('ProjectStatus', code, lang);
  if (label !== code) return label;
  return String(status);
}

/**
 * Récupère les options de statut pour un Select (avec libellés)
 */
export function getProjectStatusOptions(lang: SupportedLang = 'fr'): Array<{ value: ProjectStatus; label: string }> {
  return Object.values(ProjectStatus).map(value => ({
    value: value,
    label: getProjectStatusLabel(value, lang)
  }));
}

// =============================================================================
// EXPORT PROJECT_STATUS_LABELS - POUR COMPATIBILITÉ AVEC LES IMPORTS EXISTANTS
// =============================================================================

/**
 * Objet de mapping statut -> libellé (en français par défaut)
 * Utilisé par les composants qui attendent un objet Record<ProjectStatus, string>
 * Compatible avec l'ancien code
 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = Object.values(ProjectStatus).reduce(
  (acc, status) => {
    acc[status] = getProjectStatusLabel(status, 'fr');
    return acc;
  },
  {} as Record<ProjectStatus, string>
);

/**
 * Version multi-langue de PROJECT_STATUS_LABELS
 * Si nécessaire, on peut aussi exporter un objet par langue
 */
export const PROJECT_STATUS_LABELS_I18N: Record<SupportedLang, Record<ProjectStatus, string>> = {
  fr: Object.values(ProjectStatus).reduce((acc, status) => {
    acc[status] = getProjectStatusLabel(status, 'fr');
    return acc;
  }, {} as Record<ProjectStatus, string>),
  ar: Object.values(ProjectStatus).reduce((acc, status) => {
    acc[status] = getProjectStatusLabel(status, 'ar');
    return acc;
  }, {} as Record<ProjectStatus, string>),
  en: Object.values(ProjectStatus).reduce((acc, status) => {
    acc[status] = getProjectStatusLabel(status, 'en');
    return acc;
  }, {} as Record<ProjectStatus, string>),
};

// =============================================================================
// PROJECT STATUS CATEGORIES
// =============================================================================

export const PROJECT_STATUS_CATEGORIES = {
  INITIAL: [ProjectStatus.DRAFT, ProjectStatus.PLANNED, ProjectStatus.PRE_QUALIFICATION],
  ACTIVE: [
    ProjectStatus.ON_HOLD,
    ProjectStatus.IN_DESIGN,
    ProjectStatus.PLANNED_V2,
    ProjectStatus.AWARDED,
    ProjectStatus.IN_PROGRESS,
    ProjectStatus.UNDER_CONSTRUCTION
  ],
  REVIEW: [ProjectStatus.UNDER_INSPECTION, ProjectStatus.UNDER_REVIEW],
  COMPLETED: [ProjectStatus.COMPLETED, ProjectStatus.CLOSING, ProjectStatus.FINISHED],
  PROBLEM: [ProjectStatus.SUSPENDED, ProjectStatus.DELAYED, ProjectStatus.CANCELLED]
} as const;

// =============================================================================
// PROJECT STATUS TRANSITIONS
// =============================================================================

export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.DRAFT]: [ProjectStatus.PLANNED, ProjectStatus.CANCELLED],
  [ProjectStatus.PLANNED]: [ProjectStatus.PRE_QUALIFICATION, ProjectStatus.ON_HOLD, ProjectStatus.CANCELLED],
  [ProjectStatus.PRE_QUALIFICATION]: [ProjectStatus.AWARDED, ProjectStatus.ON_HOLD, ProjectStatus.CANCELLED],
  [ProjectStatus.ON_HOLD]: [ProjectStatus.IN_DESIGN, ProjectStatus.PLANNED_V2, ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
  [ProjectStatus.IN_DESIGN]: [ProjectStatus.PLANNED_V2, ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
  [ProjectStatus.PLANNED_V2]: [ProjectStatus.AWARDED, ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
  [ProjectStatus.AWARDED]: [ProjectStatus.IN_PROGRESS, ProjectStatus.UNDER_CONSTRUCTION, ProjectStatus.CANCELLED],
  [ProjectStatus.IN_PROGRESS]: [ProjectStatus.UNDER_CONSTRUCTION, ProjectStatus.UNDER_INSPECTION, ProjectStatus.SUSPENDED, ProjectStatus.DELAYED, ProjectStatus.CANCELLED],
  [ProjectStatus.UNDER_CONSTRUCTION]: [ProjectStatus.UNDER_INSPECTION, ProjectStatus.UNDER_REVIEW, ProjectStatus.SUSPENDED, ProjectStatus.DELAYED, ProjectStatus.CANCELLED],
  [ProjectStatus.UNDER_INSPECTION]: [ProjectStatus.UNDER_REVIEW, ProjectStatus.COMPLETED, ProjectStatus.CLOSING, ProjectStatus.SUSPENDED, ProjectStatus.DELAYED],
  [ProjectStatus.UNDER_REVIEW]: [ProjectStatus.COMPLETED, ProjectStatus.CLOSING, ProjectStatus.SUSPENDED, ProjectStatus.DELAYED],
  [ProjectStatus.COMPLETED]: [ProjectStatus.CLOSING, ProjectStatus.FINISHED],
  [ProjectStatus.CLOSING]: [ProjectStatus.FINISHED],
  [ProjectStatus.FINISHED]: [],
  [ProjectStatus.SUSPENDED]: [ProjectStatus.IN_PROGRESS, ProjectStatus.DELAYED, ProjectStatus.CANCELLED],
  [ProjectStatus.DELAYED]: [ProjectStatus.IN_PROGRESS, ProjectStatus.SUSPENDED, ProjectStatus.CANCELLED],
  [ProjectStatus.CANCELLED]: [],
};

// =============================================================================
// NORMALISATION DES PRIORITÉS
// =============================================================================

export function normalizePriority(priority?: string): string | undefined {
  if (!priority) return undefined;
  const normalized = priority.toLowerCase().trim();
  const mapping: Record<string, string> = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high',
    'critical': 'critical',
    'haute': 'high',
    'elevee': 'high',
    'élevée': 'high',
    'moyenne': 'medium',
    'basse': 'low',
    'faible': 'low',
  };
  return mapping[normalized] || undefined;
}

// =============================================================================
// PROJECT TYPES
// =============================================================================

export type ProjectPriority = StandardPriority;

export enum ProjectType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  RENOVATION = 'RENOVATION',
  MAINTENANCE = 'MAINTENANCE'
}

// =============================================================================
// PROJECT TYPE LABELS - DEPUIS ENUM_LABELS
// =============================================================================

export function getProjectTypeLabel(type: ProjectType | string, lang: SupportedLang = 'fr'): string {
  const code = typeof type === 'string' ? type : type;
  return getEnumLabel('ProjectType', code, lang);
}

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = Object.values(ProjectType).reduce(
  (acc, type) => {
    acc[type] = getProjectTypeLabel(type, 'fr');
    return acc;
  },
  {} as Record<ProjectType, string>
);

// =============================================================================
// AUTRES TYPES
// =============================================================================

export type ConstructionStage =
  | "PLANNING_DESIGN"
  | "PERMITS_APPROVALS"
  | "SITE_CLEARING"
  | "EXCAVATION"
  | "FOUNDATION_WORK"
  | "STRUCTURAL_FRAMING"
  | "ROOFING"
  | "ELECTRICAL_PLUMBING"
  | "INTERIOR_FINISHING"
  | "EXTERIOR_FINISHING"
  | "FINAL_INSPECTION"
  | "HANDOVER_COMPLETE";

export type ConstructionPhase =
  | "PRE_CONSTRUCTION"
  | "SITE_PREPARATION"
  | "FOUNDATION"
  | "STRUCTURE"
  | "EXTERIOR"
  | "INTERIOR"
  | "MECHANICAL"
  | "ELECTRICAL"
  | "PLUMBING"
  | "FINISHING"
  | "POST_CONSTRUCTION"
  | "HANDOVER";

// =============================================================================
// PROJECT LOCATION DATA
// =============================================================================

export interface ProjectLocationData {
  address?: string;
  latitude?: number;
  longitude?: number;
  regionCode?: string;
  cityCode?: string;
  locationData?: any;
  validatedAt?: string;
  validationSource?: string;
  confidence?: number;
}

// =============================================================================
// RESOURCE ALLOCATION DTOS
// =============================================================================

export interface ResourceAssignmentDTO {
  id: string;
  resourceId: string;
  resourceType: 'employee' | 'equipment' | 'material';
  projectId: string;
  assignedTo: string;
  startDate: string;
  endDate?: string;
  quantity?: number;
  cost?: number;
}

export interface TeamAllocationDTO {
  id: string;
  teamId: string;
  projectId: string;
  role: string;
  members: string[];
  capacity: number;
  allocated: number;
  startDate: string;
  endDate?: string;
}

// =============================================================================
// GANTT CHART, PERT, EVM
// =============================================================================

export interface ProjectGanttChartData {
  phases: PhaseDTO[];
  milestones: MilestoneDTO[];
  tasks: TaskAssignmentDTO[];
  criticalPath: string[];
}

export interface ProjectPertAnalysis {
  activities?: TaskAssignmentDTO[];
  criticalPath?: string[];
  expectedDuration: number;
  variance: number;
  optimisticEstimate?: number;
  mostLikelyEstimate?: number;
  pessimisticEstimate?: number;
  standardDeviation?: number;
}

export interface ProjectEvmData {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  budgetAtCompletion?: number;
  estimateAtCompletion?: number;
  estimateToComplete?: number;
  varianceAtCompletion?: number;
}

// =============================================================================
// MAIN PROJECT DTO
// =============================================================================

export interface ProjectDTO extends BaseEntityDTO {
  id: string;
  externalRef?: string;
  organizationId?: string;
  title: string;
  description: string;
  status: ProjectStatus;
  progress: number;
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  geographicZone?: string;
  terrainType?: string;
  coordinates?: { latitude: number; longitude: number };
  interventionZones?: import('./InterventionZoneDTO').InterventionZoneDTO[];
  interventionZone?: import('./InterventionZoneDTO').InterventionZoneDTO;
  startDate: string;
  endDate?: string;
  estimatedDurationDays?: number;
  attributionDate?: string;
  launchDate?: string;
  completionDate?: string;
  budget: number;
  currency: string;
  totalSpent?: number;
  remainingBudget?: number;
  budgetUtilization?: number;
  teamSize: number;
  projectManagerId?: string;
  technicalManagerId?: string;
  supervisorId?: string;
  clientId?: string;
  mainContractor?: string;
  engineeringConsultant?: string;
  clientName?: string;
  donorOrganization?: string;
  sector?: string;
  priority?: string;
  areaSqm?: number;
  thumbnail?: string;
  currentPhase?: string;
  currentStage?: ConstructionStage;
  methodology?: "waterfall" | "agile" | "hybrid";
  category?: string;
  subCategory?: string;
  priorityLevel?: "faible" | "moyenne" | "elevee" | "tresElevee";
  riskLevel?: "faible" | "moyen" | "eleve" | "critique";
  projectReference?: string;
  referentialCode?: ReferentialType;
  selectionMode?: string;
  financingSource?: string;
  marketType?: string;
  requiresPermits?: boolean;
  permitNumber?: string;
  environmentalImpact?: "nul" | "faible" | "modere" | "eleve";
  environmentalConstraints?: string;
  insuranceRequired?: boolean;
  bankGuaranteeRequired?: boolean;
  bankGuaranteeAmount?: number;
  bankGuaranteePercentage?: number;
  checkScheduleLastRun?: Record<string, unknown>;
  closureNotes?: string;
  hasUtilities?: boolean;
  siteDetails?: string;
  clientOrganization?: string;
  projectType?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  initialAdvancePercentage?: number;
  retentionPercentage?: number;
  paymentFrequency?: string;
  paymentMode?: string;
  paymentWorkflowConfig?: Record<string, unknown>;
  materialsBudget?: number;
  procurementLeadTime?: number;
  resourceAssignment?: ProjectResource[];
  estimatedDays?: number;
  requiresConsultantValidation?: boolean;
  requiresMinistryApproval?: boolean;
  projectReferenceNumber?: string;
  projectOrder?: string;
  projectResponsableId?: string;
  forme?: string;
  fundingSource?: string;
  localisation?: Record<string, unknown>;
  receptionStatus?: string;
  taskCount?: number;
  completedTasks?: number;
  overdueTasks?: number;
  riskCount?: number;
  highRiskCount?: number;
  inspectionCount?: number;
  passedInspections?: number;
  failedInspections?: number;
  paymentCount?: number;
  paidAmount?: number;
  pendingPayments?: number;
  phaseCount?: number;
  completedPhases?: number;
  activePhases?: number;
  isOnTrack?: boolean;
  scheduleVariance?: number;
  activeTeamMembers?: number;
  ganttChart?: ProjectGanttChartData;
  pertAnalysis?: ProjectPertAnalysis;
  earnedValueManagement?: ProjectEvmData;
  projectAnalytics?: ProjectAnalyticsDTO;
  performanceMetrics?: PerformanceMetricsDTO;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// PROJECT SUMMARY, DETAIL, LIST, FORM, UI STATE, CREATE, UPDATE, REQUEST DTOS
// =============================================================================

// Project Summary for lists - Utilise TaskAssignmentDTO
export interface ProjectSummaryDTO extends ProjectDTO {
  // Summary-specific counts
  tasksCount: number;
  risksCount: number;
  inspectionsCount: number;
  paymentsCount: number;
  phasesCount: number;
  
  // Quick status
  lastActivity?: string;
  overallHealth?: "healthy" | "warning" | "critical";
  
  // Next milestone preview
  nextMilestone?: MilestoneDTO;
  latestUpdate?: string;
}

// Detailed Project view with all relationships - Utilise TaskAssignmentDTO
export interface ProjectDetailDTO extends ProjectDTO {
  // Detailed relationships
  phases: PhaseDTO[];
  tasks: TaskAssignmentDTO[];
  risks: RiskDTO[];
  milestones: MilestoneDTO[];
  payments: PaymentDTO[];
  materials: MaterialDTO[];
  stakeholders: StakeholderDTO[];
  alerts: ProjectAlertDTO[];
  inspections: InspectionDTO[];
  
  // Insurance related collections
  insurancePolicies?: {
    id: string;
    policyNumber: string;
    provider: string;
    coverage: number;
    expiryDate: string;
  }[];
  insuranceCertificates?: {
    id: string;
    certificateNumber: string;
    issueDate: string;
    expiryDate: string;
    coverage: number;
  }[];
  
  // Construction details
  plannedPhases: PhaseDTO[]; // Alias for phases to match UI expectations
  constructionMilestones: MilestoneDTO[];
  
  // Project tenders
  tenders: TenderDTO[];
  
  // Financial details
  expenses: PaymentDTO[]; // Alias for payments to match UI expectations
  
  // Resource allocation
  resources?: ProjectResource[];

  /** Contacts projet (stockés en JSON dans btp.projects.contacts) */
  contacts?: Array<{
    id: string;
    projectId?: string;
    name: string;
    role: string;
    email?: string;
    phone?: string;
    company?: string;
    isPrimary?: boolean;
  }>;

  
  // Performance data
  escalationThresholds?: {
    alert: number;
    notification: number;
    guarantee: number;
    legal: number;
  };
  
  // Team allocation
  teamAllocations?: TeamAllocationDTO[];
  
  // Documents
  documents?: DocumentDTO[];
  
  // Bank guarantees
  bankGuarantees?: any[];
}

// Project List Item for compact views
export interface ProjectListItemDTO extends BaseEntityDTO {
  title: string;
  location: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  endDate?: string;
  thumbnail?: string;
  teamSize: number;
  
  // Quick indicators
  priorityLevel?: "faible" | "moyenne" | "elevee" | "tresElevee";
  riskLevel?: "faible" | "moyen" | "eleve" | "critique";
  isFlagged?: boolean;
  
  // Count previews
  taskCount?: number;
  overdueTaskCount?: number;
  riskCount?: number;
}

// Project Form Data DTO - extends BaseFormDTO for UI state management
export interface ProjectFormDataDTO extends BaseFormDTO<ProjectDTO> {
  // Core project data
  title: string;
  description?: string;
  location?: string;
  status?: ProjectStatus;
  budget?: number;
  startDate?: string;
  endDate?: string;
  
  // Form-specific fields
  projectManagerId?: string;
  clientId?: string;
  teamSize?: number;
  currency?: string;
  category?: string;
  subCategory?: string;
  priorityLevel?: "faible" | "moyenne" | "elevee" | "tresElevee";
  riskLevel?: "faible" | "moyen" | "eleve" | "critique";
  methodology?: "waterfall" | "agile" | "hybrid";
  
  // Additional fields
  address?: string;
  latitude?: number;
  longitude?: number;
  geographicZone?: string;
  terrainType?: string;
  estimatedDurationDays?: number;
  projectReference?: string;
  selectionMode?: string;
  financingSource?: string;
  marketType?: string;
  launchDate?: string;
  attributionDate?: string;
  mainContractor?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  thumbnail?: string;
  workspaceId?: string;
  createdBy?: string;

  // WORKFLOW STEP TRACKING - Added for EnhancedProjectEditForm compatibility
  currentStep?: number;
  completedSteps?: number[];
  stepValidation?: Record<number, boolean>;
  workflowState?: {
    isDirty?: boolean;
    isValid?: boolean;
    lastSaved?: string;
    totalSteps?: number;
  };

  // STEP-SPECIFIC DATA COLLECTIONS - Added for form workflow
  stakeholdersData?: StakeholderDTO[];
  locationData?: ProjectLocationData;
  phasesData?: PhaseDTO[];
  risksData?: RiskDTO[];
  complianceData?: Record<string, unknown>;
  validationData?: Record<string, unknown>;
}

// Project UI State for form management
export interface ProjectUIState {
  // Core project data
  formData: ProjectFormDataDTO;
  
  // Additional UI-specific fields
  startDate?: string;
  endDate?: string;
  budget?: number;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  projectType?: ProjectType;
  estimatedDuration?: number;
  actualDuration?: number;
  progress?: number;
  
  // Client information
  client?: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  
  // Team information
  team?: {
    teamLead?: string;
    members?: string[];
  };
  
  // Collections for form management
  phases?: PhaseDTO[];
  risks?: RiskDTO[];
  materials?: MaterialDTO[];
  stakeholders?: StakeholderDTO[];
  tasks?: TaskAssignmentDTO[];
  inspections?: InspectionDTO[];
  documents?: DocumentDTO[];
  
  // Metadata
  metadata?: {
    createdById?: string;
    updatedById?: string;
    version?: number;
  };
}

// Create Project DTO - Utilise TaskAssignmentDTO
export interface CreateProjectDTO {
  title: string;
  description: string;
  location: string;
  /**
   * Zones d'intervention (multi-polygones/rectangles/cercles bénéficiaires).
   * Persistées dans `projects.localisation` (jsonb v3) — voir `InterventionZoneDTO`.
   */
  interventionZones?: import('./InterventionZoneDTO').InterventionZoneDTO[];
  /** @deprecated alias mono-zone → pointe vers `interventionZones[0]`. */
  interventionZone?: import('./InterventionZoneDTO').InterventionZoneDTO;
  status: ProjectStatus;
  budget: number;
  startDate: string;
  endDate?: string;

  // Optional creation fields
  thumbnail?: string;
  teamSize?: number;
  currency?: string;

  // Project details
  address?: string;
  latitude?: number;
  longitude?: number;
  geographicZone?: string;
  terrainType?: string;

  // Classification
  category?: string;
  subCategory?: string;
  priorityLevel?: "faible" | "moyenne" | "elevee" | "tresElevee";
  riskLevel?: "faible" | "moyen" | "eleve" | "critique";

  // Organization
  projectManagerId?: string;
  clientId?: string;
  workspaceId?: string;
  createdBy?: string;

  // Additional setup
  projectReference?: string;
  referentialCode?: ReferentialType;
  methodology?: "waterfall" | "agile" | "hybrid";
  estimatedDurationDays?: number;

  // Extended fields for backward compatibility
  financingSource?: string;
  marketType?: string;
  selectionMode?: string;
  launchDate?: string;
  attributionDate?: string;
  mainContractor?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;

  // Construction and workflow
  currentStage?: ConstructionStage;
  currentPhase?: string;
  paymentFrequency?: string;
  paymentMode?: string;
  retentionPercentage?: number;
  initialAdvancePercentage?: number;
  completionDate?: string;
  estimatedDays?: number;
  /** Données relationnelles importées avec le projet. */
  phases?: PhaseDTO[];
  milestones?: MilestoneDTO[];
  tasks?: TaskAssignmentDTO[];
  dqeLines?: import('@/dtos/boq/BoqLineDTO').BoqLineDTO[];
  stakeholders?: import('./ProjectStakeholderDTO').CreateProjectStakeholderDTO[];
  budgetSources?: Array<Record<string, unknown>>;
  organizationId?: string;
  externalRef?: string;
  requiresConsultantValidation?: boolean;
  requiresMinistryApproval?: boolean;
  requiresPermits?: boolean;
  permitNumber?: string;
  hasUtilities?: boolean;
  areaSqm?: number;
  siteDetails?: string;

  // Insurance and financial
  insuranceRequired?: boolean;
  bankGuaranteeRequired?: boolean;
  bankGuaranteeAmount?: number;
  bankGuaranteePercentage?: number;
  checkScheduleLastRun?: Record<string, unknown>;

  // Organization details
  clientOrganization?: string;
  donorOrganization?: string;
  sector?: string;
  projectType?: string;
  priority?: string;

  // Procurement and materials
  materialsBudget?: number;
  procurementLeadTime?: number;
  resourceAssignment?: ProjectResource[];

  // References and details
  projectReferenceNumber?: string;
  projectOrder?: string;
  projectResponsableId?: string;
  forme?: string;
  fundingSource?: string;
  localisation?: Record<string, unknown>;
  receptionStatus?: string;
  environmentalConstraints?: string;
  closureNotes?: string;

  // Workflow configuration
  paymentWorkflowConfig?: Record<string, unknown>;

  /** Avancement initial (import de données existantes). */
  progress?: number;
  /** Bureau d'études / maître d'œuvre. */
  engineeringConsultant?: string;
  /** Nom du client (libellé libre). */
  clientName?: string;
}

// Update Project DTO - standardized pattern  
export interface UpdateProjectDTO extends Partial<Omit<ProjectDTO, keyof BaseEntityDTO>> {
  id: string;
}


// Interface for create project request - Utilise TaskAssignmentDTO
export interface CreateProjectRequestDTO {
  title: string;
  description?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  location?: string;
  teamSize?: number;
  thumbnail?: string;
  createdBy?: string;
  latitude?: number;
  longitude?: number;
  financingSource?: string;
  mainContractor?: string;
  currency?: string;
  clientOrganization?: string;
  donorOrganization?: string;
  sector?: string;
  projectType?: string;
  priority?: string;
  geographicZone?: string;
  terrainType?: string;
  environmentalConstraints?: string;
  areaSqm?: number;
  projectReferenceNumber?: string;
  referentialCode?: ReferentialType;
  projectOrder?: string;
  clientId?: string;
  currentPhase?: string;
  currentStage?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  paymentFrequency?: string;
  paymentMode?: string;
  retentionPercentage?: number;
  initialAdvancePercentage?: number;
  completionDate?: string;
  estimatedDays?: number;
  launchDate?: string;
  attributionDate?: string;
  requiresConsultantValidation?: boolean;
  requiresMinistryApproval?: boolean;
  requiresPermits?: boolean;
  permitNumber?: string;
  hasUtilities?: boolean;
  // Domain objects - following hexagonal principles
  engineeringConsultant?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  technicalManager?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  projectResponsable?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  supervisor?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  // Domain collections - using proper DTO types following hexagonal architecture
  phases?: PhaseDTO[];
  tasks?: TaskAssignmentDTO[];
  risks?: RiskDTO[];
  milestones?: MilestoneDTO[];
  payments?: PaymentDTO[];
  materials?: MaterialDTO[];
  inspections?: InspectionDTO[];
  stakeholders?: StakeholderDTO[];
  employees?: {
    id: string;
    name: string;
    role: string;
  }[];
  projectReference?: string;
}

// ============= TYPE ALIASES FOR BACKWARD COMPATIBILITY =============
// These types are re-exported from ProjectDTO for compatibility with legacy imports
export type ProjectFormDTO = ProjectDTO;
export type ProjectData = ProjectDTO;
export type ProjectEVMMetrics = ProjectEvmData;


// =============================================================================
// EXPORT POUR COMPATIBILITÉ (DEPRECATED)
// =============================================================================

/** @deprecated Utiliser ProjectStatus.IN_PROGRESS à la place */
export const EN_COURS = ProjectStatus.IN_PROGRESS;
/** @deprecated Utiliser ProjectStatus.COMPLETED à la place */
export const TERMINE = ProjectStatus.COMPLETED;
/** @deprecated Utiliser ProjectStatus.ON_HOLD à la place */
export const EN_ATTENTE = ProjectStatus.ON_HOLD;
/** @deprecated Utiliser ProjectStatus.UNDER_INSPECTION à la place */
export const EN_INSPECTION = ProjectStatus.UNDER_INSPECTION;
/** @deprecated Utiliser ProjectStatus.SUSPENDED à la place */
export const SUSPENDU = ProjectStatus.SUSPENDED;
/** @deprecated Utiliser ProjectStatus.CANCELLED à la place */
export const ANNULE = ProjectStatus.CANCELLED;
/** @deprecated Utiliser ProjectStatus.AWARDED à la place */
export const ATTRIBUE = ProjectStatus.AWARDED;
/** @deprecated Utiliser ProjectStatus.PLANNED à la place */
export const PLANIFIE = ProjectStatus.PLANNED;
/** @deprecated Utiliser ProjectStatus.PRE_QUALIFICATION à la place */
export const PRE_QUALIFICATION = ProjectStatus.PRE_QUALIFICATION;
/** @deprecated Utiliser ProjectStatus.IN_DESIGN à la place */
export const EN_CONCEPTION = ProjectStatus.IN_DESIGN;
/** @deprecated Utiliser ProjectStatus.UNDER_CONSTRUCTION à la place */
export const EN_CONSTRUCTION = ProjectStatus.UNDER_CONSTRUCTION;
/** @deprecated Utiliser ProjectStatus.CLOSING à la place */
export const EN_CLOTURE = ProjectStatus.CLOSING;
/** @deprecated Utiliser ProjectStatus.DELAYED à la place */
export const EN_RETARD = ProjectStatus.DELAYED;