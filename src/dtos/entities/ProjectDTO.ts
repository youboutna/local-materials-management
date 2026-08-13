/**
 * Project Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO, BaseFormDTO, BaseUIState, StandardPriority, StandardStatus } from '../shared';
import { PerformanceMetricsDTO } from '../transforms';

// Import location types
import { AutoFillLocationData } from '@/hooks/hexagonal/useLocationAutoFill';

// Import ProjectResource for resource assignments
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

// Project Location Data Interface - Enhanced location handling
export interface ProjectLocationData {
  address?: string;
  latitude?: number;
  longitude?: number;
  regionCode?: string;
  cityCode?: string;
  locationData?: AutoFillLocationData;
  // Additional metadata
  validatedAt?: string;
  validationSource?: string;
  confidence?: number;
}

// Construction phase types
export type ConstructionPhase =
  | "pre_construction"
  | "site_preparation"
  | "foundation"
  | "structure"
  | "exterior"
  | "interior"
  | "mechanical"
  | "electrical"
  | "plumbing"
  | "finishing"
  | "post_construction"
  | "handover";

// Core project status types - standardized and comprehensive
export enum ProjectStatus {
  // Initial states
  DRAFT = 'draft',
  PLANNED = 'planned',
  PRE_QUALIFICATION = 'pre_qualification',
  
  // Active states
  EN_ATTENTE = 'en_attente',
  EN_CONCEPTION = 'en_conception',
  PLANIFIE = 'planifie_v2',
  ATTRIBUE = 'attribue_v2',
  EN_COURS = 'en_cours_v2',
  EN_CONSTRUCTION = 'en_construction_v2',
  
  // Review states
  EN_INSPECTION = 'en_inspection_v2',
  EN_REVIEW = 'en_review',
  
  // Completion states
  TERMINE = 'termine_v2',
  EN_CLOTURE = 'en_cloture_v2',
  COMPLETED = 'completed',
  
  // Problem states
  SUSPENDU = 'suspendu_v2',
  EN_RETARD = 'en_retard_v2',
  ANNULE = 'annule_v2',
  CANCELLED = 'cancelled',
  
  // Legacy compatibility (exact same values as before)
  EN_COURS_LEGACY = 'enCours',
  TERMINE_LEGACY = 'termine',
  EN_ATTENTE_LEGACY = 'enAttente',
  EN_INSPECTION_LEGACY = 'enInspection',
  SUSPENDU_LEGACY = 'suspendu',
  ANNULE_LEGACY = 'annule',
  ATTRIBUE_LEGACY = 'attribue',
  PLANIFIE_LEGACY = 'planifie',
  PRE_QUALIFICATION_LEGACY = 'preQualification',
  EN_CONCEPTION_LEGACY = 'enConception',
  EN_CONSTRUCTION_LEGACY = 'enConstruction',
  EN_CLOTURE_LEGACY = 'enCloture',
  EN_RETARD_LEGACY = 'enRetard'
}

// Legacy type for backward compatibility
type LegacyProjectStatus = StandardStatus
  | "enCours"
  | "termine"
  | "enAttente"
  | "enInspection"
  | "suspendu"
  | "annule"
  | "attribue"
  | "planifie"
  | "preQualification"
  | "enConception"
  | "enConstruction"
  | "enCloture"
  | "enRetard";

// Unified project status type for new development
export type ProjectStatusType = ProjectStatus;

// Project status labels for UI display (Rule #4: Centralized DTOs)
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.DRAFT]: 'Brouillon',
  [ProjectStatus.PLANNED]: 'Planifié',
  [ProjectStatus.PRE_QUALIFICATION]: 'Pré-qualification',
  [ProjectStatus.EN_ATTENTE]: 'En attente',
  [ProjectStatus.EN_CONCEPTION]: 'En conception',
  [ProjectStatus.PLANIFIE]: 'Planifié',
  [ProjectStatus.ATTRIBUE]: 'Attribué',
  [ProjectStatus.EN_COURS]: 'En cours',
  [ProjectStatus.EN_CONSTRUCTION]: 'En construction',
  [ProjectStatus.EN_INSPECTION]: 'En inspection',
  [ProjectStatus.EN_REVIEW]: 'En révision',
  [ProjectStatus.TERMINE]: 'Terminé',
  [ProjectStatus.EN_CLOTURE]: 'En clôture',
  [ProjectStatus.COMPLETED]: 'Complété',
  [ProjectStatus.SUSPENDU]: 'Suspendu',
  [ProjectStatus.EN_RETARD]: 'En retard',
  [ProjectStatus.ANNULE]: 'Annulé',
  [ProjectStatus.CANCELLED]: 'Annulé',
  // Legacy labels for backward compatibility
  [ProjectStatus.EN_COURS_LEGACY]: 'En cours',
  [ProjectStatus.TERMINE_LEGACY]: 'Terminé',
  [ProjectStatus.EN_ATTENTE_LEGACY]: 'En attente',
  [ProjectStatus.EN_INSPECTION_LEGACY]: 'En inspection',
  [ProjectStatus.SUSPENDU_LEGACY]: 'Suspendu',
  [ProjectStatus.ANNULE_LEGACY]: 'Annulé',
  [ProjectStatus.ATTRIBUE_LEGACY]: 'Attribué',
  [ProjectStatus.PLANIFIE_LEGACY]: 'Planifié',
  [ProjectStatus.PRE_QUALIFICATION_LEGACY]: 'Pré-qualification',
  [ProjectStatus.EN_CONCEPTION_LEGACY]: 'En conception',
  [ProjectStatus.EN_CONSTRUCTION_LEGACY]: 'En construction',
  [ProjectStatus.EN_CLOTURE_LEGACY]: 'En clôture',
  [ProjectStatus.EN_RETARD_LEGACY]: 'En retard'
};

// Project status categories for business logic
export const PROJECT_STATUS_CATEGORIES = {
  INITIAL: [ProjectStatus.DRAFT, ProjectStatus.PLANNED, ProjectStatus.PRE_QUALIFICATION],
  ACTIVE: [ProjectStatus.EN_ATTENTE, ProjectStatus.EN_CONCEPTION, ProjectStatus.PLANIFIE, ProjectStatus.ATTRIBUE, ProjectStatus.EN_COURS, ProjectStatus.EN_CONSTRUCTION],
  REVIEW: [ProjectStatus.EN_INSPECTION, ProjectStatus.EN_REVIEW],
  COMPLETED: [ProjectStatus.TERMINE, ProjectStatus.EN_CLOTURE, ProjectStatus.COMPLETED],
  PROBLEM: [ProjectStatus.SUSPENDU, ProjectStatus.EN_RETARD, ProjectStatus.ANNULE, ProjectStatus.CANCELLED]
} as const;

// Project status transitions (allowed state changes)
export const PROJECT_STATUS_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  [ProjectStatus.DRAFT]: [ProjectStatus.PLANNED, ProjectStatus.CANCELLED],
  [ProjectStatus.PLANNED]: [ProjectStatus.PRE_QUALIFICATION, ProjectStatus.EN_ATTENTE, ProjectStatus.CANCELLED],
  [ProjectStatus.PRE_QUALIFICATION]: [ProjectStatus.ATTRIBUE, ProjectStatus.EN_ATTENTE, ProjectStatus.ANNULE],
  [ProjectStatus.EN_ATTENTE]: [ProjectStatus.EN_CONCEPTION, ProjectStatus.PLANIFIE, ProjectStatus.EN_COURS, ProjectStatus.ANNULE],
  [ProjectStatus.EN_CONCEPTION]: [ProjectStatus.PLANIFIE, ProjectStatus.EN_COURS, ProjectStatus.ANNULE],
  [ProjectStatus.PLANIFIE]: [ProjectStatus.ATTRIBUE, ProjectStatus.EN_COURS, ProjectStatus.ANNULE],
  [ProjectStatus.ATTRIBUE]: [ProjectStatus.EN_COURS, ProjectStatus.EN_CONSTRUCTION, ProjectStatus.ANNULE],
  [ProjectStatus.EN_COURS]: [ProjectStatus.EN_CONSTRUCTION, ProjectStatus.EN_INSPECTION, ProjectStatus.SUSPENDU, ProjectStatus.EN_RETARD, ProjectStatus.ANNULE],
  [ProjectStatus.EN_CONSTRUCTION]: [ProjectStatus.EN_INSPECTION, ProjectStatus.EN_REVIEW, ProjectStatus.SUSPENDU, ProjectStatus.EN_RETARD, ProjectStatus.ANNULE],
  [ProjectStatus.EN_INSPECTION]: [ProjectStatus.EN_REVIEW, ProjectStatus.TERMINE, ProjectStatus.EN_CLOTURE, ProjectStatus.SUSPENDU, ProjectStatus.EN_RETARD],
  [ProjectStatus.EN_REVIEW]: [ProjectStatus.TERMINE, ProjectStatus.EN_CLOTURE, ProjectStatus.SUSPENDU, ProjectStatus.EN_RETARD],
  [ProjectStatus.TERMINE]: [ProjectStatus.EN_CLOTURE, ProjectStatus.COMPLETED],
  [ProjectStatus.EN_CLOTURE]: [ProjectStatus.COMPLETED],
  [ProjectStatus.COMPLETED]: [],
  [ProjectStatus.SUSPENDU]: [ProjectStatus.EN_COURS, ProjectStatus.EN_RETARD, ProjectStatus.ANNULE],
  [ProjectStatus.EN_RETARD]: [ProjectStatus.EN_COURS, ProjectStatus.SUSPENDU, ProjectStatus.ANNULE],
  [ProjectStatus.ANNULE]: [],
  [ProjectStatus.CANCELLED]: [],
  // Legacy transitions
  [ProjectStatus.EN_COURS_LEGACY]: [ProjectStatus.TERMINE_LEGACY, ProjectStatus.SUSPENDU_LEGACY, ProjectStatus.ANNULE_LEGACY],
  [ProjectStatus.TERMINE_LEGACY]: [ProjectStatus.EN_CLOTURE_LEGACY],
  [ProjectStatus.EN_ATTENTE_LEGACY]: [ProjectStatus.EN_COURS_LEGACY, ProjectStatus.ANNULE_LEGACY],
  [ProjectStatus.EN_INSPECTION_LEGACY]: [ProjectStatus.TERMINE_LEGACY, ProjectStatus.SUSPENDU_LEGACY],
  [ProjectStatus.SUSPENDU_LEGACY]: [ProjectStatus.EN_COURS_LEGACY, ProjectStatus.ANNULE_LEGACY],
  [ProjectStatus.ANNULE_LEGACY]: [],
  [ProjectStatus.ATTRIBUE_LEGACY]: [ProjectStatus.EN_COURS_LEGACY],
  [ProjectStatus.PLANIFIE_LEGACY]: [ProjectStatus.EN_COURS_LEGACY],
  [ProjectStatus.PRE_QUALIFICATION_LEGACY]: [ProjectStatus.ATTRIBUE_LEGACY],
  [ProjectStatus.EN_CONCEPTION_LEGACY]: [ProjectStatus.EN_COURS_LEGACY],
  [ProjectStatus.EN_CONSTRUCTION_LEGACY]: [ProjectStatus.EN_INSPECTION_LEGACY],
  [ProjectStatus.EN_CLOTURE_LEGACY]: [ProjectStatus.TERMINE_LEGACY],
  [ProjectStatus.EN_RETARD_LEGACY]: [ProjectStatus.EN_COURS_LEGACY, ProjectStatus.SUSPENDU_LEGACY]
};

// Role-based notification recipients
export const NOTIFICATION_ROLES = {
  PROJECT_MANAGER: "project_manager",
  DIRECTOR_PROGRAMMING: "director_programming",
  DIRECTOR: "director",
  BANK_LIAISON: "bank_liaison",
  ENGINEERING_CONSULTANT: "engineering_consultant",
  CONTRACTOR: "contractor",
};

// Delay thresholds for escalation
export const DELAY_THRESHOLDS = {
  WARNING: 10, // 10% delay triggers warning
  BANK_NOTIFICATION: 20, // 20% delay triggers bank notification
  GUARANTEE_TRIGGER: 30, // 30% delay triggers guarantee clause
  LEGAL_ESCALATION: 40, // 40% delay triggers legal team
};

// Project priority types - standardized
export type ProjectPriority = StandardPriority;

// Project type enumeration
export enum ProjectType {
  RESIDENTIAL = 'residential',
  COMMERCIAL = 'commercial',
  INDUSTRIAL = 'industrial',
  INFRASTRUCTURE = 'infrastructure',
  RENOVATION = 'renovation',
  MAINTENANCE = 'maintenance'
}

// Construction stages
export type ConstructionStage =
  | "planningDesign"
  | "permitsApprovals"
  | "siteClearing"
  | "excavation"
  | "foundationWork"
  | "structuralFraming"
  | "roofing"
  | "electricalPlumbing"
  | "interiorFinishing"
  | "exteriorFinishing"
  | "finalInspection"
  | "handoverComplete";

// Project Alert type (using NotificationDTO for notifications)
export type Alert = NotificationDTO & {
  projectId: string;
  relatedEntityId?: string;
  acknowledged?: boolean;
  resolvedAt?: string;
};

// Resource allocation DTOs
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

// Gantt Chart Data - Utilise TaskAssignmentDTO
export interface ProjectGanttChartData {
  phases: PhaseDTO[];
  milestones: MilestoneDTO[];
  tasks: TaskAssignmentDTO[];
  criticalPath: string[];
}

// PERT Analysis - Utilise TaskAssignmentDTO
export interface ProjectPertAnalysis {
  activities?: TaskAssignmentDTO[];
  criticalPath?: string[];
  expectedDuration: number;
  variance: number;
  // Additional PERT fields
  optimisticEstimate?: number;
  mostLikelyEstimate?: number;
  pessimisticEstimate?: number;
  standardDeviation?: number;
}

// Earned Value Management Data
export interface ProjectEvmData {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  // Extended EVM fields
  budgetAtCompletion?: number;
  estimateAtCompletion?: number;
  estimateToComplete?: number;
  varianceAtCompletion?: number;
}

// Main Project DTO - Utilise TaskAssignmentDTO
export interface ProjectDTO extends BaseEntityDTO {
  // Core identification
  id: string;
  externalRef?: string;
  organizationId?: string;
  title: string;
  description: string;
  
  // Status and progress
  status: ProjectStatus;
  progress: number;
  
  // Location
  location: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  geographicZone?: string;
  terrainType?: string;
  // Backward compatibility - coordinates object
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  /**
   * Zones d'intervention géographiques (polygones/rectangles/cercles, multi-zones).
   * Stockées dans projects.localisation (jsonb v2 — { version: 2, zones: [...] }).
   * Voir InterventionZoneDTO.
   */
  interventionZones?: import('./InterventionZoneDTO').InterventionZoneDTO[];
  /** @deprecated alias mono-zone — pointe vers `interventionZones[0]`. */
  interventionZone?: import('./InterventionZoneDTO').InterventionZoneDTO;
  
  
  // Timeline
  startDate: string;
  endDate?: string;
  estimatedDurationDays?: number;
  attributionDate?: string;
  
  // Financials
  budget: number;
  currency: string;
  totalSpent?: number;
  remainingBudget?: number;
  budgetUtilization?: number;
  
  // Team and organization
  teamSize: number;
  projectManagerId?: string;
  technicalManagerId?: string;
  supervisorId?: string;
  clientId?: string;
  mainContractor?: string; // Simplified to string for DTO
  
  // Visual
  thumbnail?: string;
  
  // Construction details
  currentPhase?: string; // Simplified to string
  currentStage?: ConstructionStage;
  methodology?: "waterfall" | "agile" | "hybrid";
  
  // Classification and procurement
  category?: string;
  subCategory?: string;
  priorityLevel?: "faible" | "moyenne" | "elevee" | "tresElevee";
  riskLevel?: "faible" | "moyen" | "eleve" | "critique";
  projectReference?: string;
  /** Référentiel métier actif pour générer phases, jalons, tâches, WBS et parsing BOQ. */
  referentialCode?: ReferentialType;
  selectionMode?: string;
  financingSource?: string;
  marketType?: string;
  
  // Permits and compliance
  requiresPermits?: boolean;
  permitNumber?: string;
  environmentalImpact?: "nul" | "faible" | "modere" | "eleve";
  environmentalConstraints?: string;
  
  // Insurance and guarantees
  insuranceRequired?: boolean;
  bankGuaranteeRequired?: boolean;
  bankGuaranteeAmount?: number;
  bankGuaranteePercentage?: number;
  checkScheduleLastRun?: Record<string, unknown>;
  closureNotes?: string;
  completionDate?: string;
  
  // Site utilities
  hasUtilities?: boolean;
  areaSqm?: number;
  siteDetails?: string;
  
  // Organization and stakeholders
  clientOrganization?: string;
  donorOrganization?: string;
  sector?: string;
  projectType?: string;
  priority?: string;
  
  // Financial and payment settings
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  initialAdvancePercentage?: number;
  retentionPercentage?: number;
  paymentFrequency?: string;
  paymentMode?: string;
  paymentWorkflowConfig?: Record<string, unknown>;
  
  // Procurement and materials
  materialsBudget?: number;
  procurementLeadTime?: number;
  resourceAssignment?: ProjectResource[];
  
  // Timeline and scheduling
  estimatedDays?: number;
  launchDate?: string;
  
  // Validation and approval
  requiresConsultantValidation?: boolean;
  requiresMinistryApproval?: boolean;
  
  // Project references and details
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
  
  // Performance tracking
  isOnTrack?: boolean;
  scheduleVariance?: number;
  activeTeamMembers?: number;
  
  // Analytics - Utilise TaskAssignmentDTO
  ganttChart?: ProjectGanttChartData;
  pertAnalysis?: ProjectPertAnalysis;
  earnedValueManagement?: ProjectEvmData;
  projectAnalytics?: ProjectAnalyticsDTO;
  performanceMetrics?: PerformanceMetricsDTO;
}

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
  alerts: Alert[];
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
}

// Update Project DTO - standardized pattern  
export interface UpdateProjectDTO extends Partial<Omit<ProjectDTO, keyof BaseEntityDTO>> {
  id: string;
}

// Project UI State - for React hooks and components
export interface ProjectUIState extends BaseUIState<ProjectDTO> {
  calculatedFields?: {
    totalCost?: number;
    completionPercentage?: number;
    daysRemaining?: number;
    riskScore?: number;
    teamUtilization?: number;
  };
  
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
export type ProjectPERTAnalysis = ProjectPertAnalysis;

// Inspection status for workflow components - imported from InspectionDTO.ts

// Project with payments for workflow inspection
export interface ProjectWithPayments extends ProjectDTO {
  inspections?: Array<{
    id: string;
    date: string;
    status: InspectionStatus;
    inspector?: string;
    progress_at_inspection?: number;
    comments?: string;
  }>;
  payments?: PaymentDTO[];
}