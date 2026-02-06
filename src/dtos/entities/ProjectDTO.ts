/**
 * Project Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */


import { ConstructionPhase } from '@/types/project';
import { BaseEntityDTO, BaseFormDTO, BaseUIState, StandardStatus, StandardPriority, LocationDTO } from '../shared';
import { PerformanceMetricsDTO } from '../transforms';
import { InsuranceCertificateDTO } from './InsuranceCertificateDTO';
import { InsurancePolicyDTO } from './InsuranceDTO';
import { MaterialDTO, MaterialFormDataDTO } from './MaterialDTO';
import { MilestoneDTO } from './MilestoneDTO';
import { NotificationDTO } from './NotificationDTO';
import { PaymentDTO } from './PaymentDTO';
import { PhaseDTO, PhaseFormDataDTO } from './PhaseDTO';
import { ProjectAnalyticsDTO } from './ProjectAnalyticsDTO';
import { RiskDTO, RiskFormDataDTO } from './RiskDTO';
import { StakeholderDTO } from './StakeholderDTO';
import { SupplierDTO } from './SupplierDTO';
import { TaskDTO, TaskFormDataDTO } from './TaskDTO';
import { TenderDTO } from './TenderDTO';
import { EmployeeDTO, EmployeeFormDataDTO } from './EmployeeDTO';
import { InspectionDTO, InspectionFormDataDTO } from './InspectionDTO';
import { DocumentDTO, DocumentFormDataDTO } from './DocumentDTO';

// Core project status types - standardized
export type ProjectStatus = StandardStatus
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
export type ProjectAlert = NotificationDTO & {
  projectId: string;
  relatedEntityId?: string;
  acknowledged?: boolean;
  resolvedAt?: string;
};

// Gantt Chart Data
export interface GanttChartData {
  phases: PhaseDTO[];
  milestones: MilestoneDTO[];
  tasks: TaskDTO[];
  criticalPath: string[];
}

// PERT Analysis
export interface PertAnalysis {
  activities: TaskDTO[];
  criticalPath: string[];
  expectedDuration: number;
  variance: number;
}

// Earned Value Management Data
export interface EvmData {
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  scheduleVariance: number;
  costVariance: number;
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
}

// Main Project DTO
export interface ProjectDTO extends BaseEntityDTO {
  // Core identification
  id: string;
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
  
  // Timeline
  startDate: string;
  endDate?: string;
  estimatedDurationDays?: number;
  
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
  mainContractor?: SupplierDTO;
  
  // Visual
  thumbnail?: string;
  
  // Construction details
  currentPhase?: ConstructionPhase;
  currentStage?: ConstructionStage;
  methodology?: "waterfall" | "agile" | "hybrid";
  
  // Classification
  category?: string;
  subCategory?: string;
  priorityLevel?: "faible" | "moyenne" | "elevee" | "tresElevee";
  riskLevel?: "faible" | "moyen" | "eleve" | "critique";
  
  // Procurement
  projectReference?: string;
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
  
  // Site utilities
  hasUtilities?: boolean;
  areaSqm?: number;
  siteDetails?: string;
  
  // Relationships (foreign keys)
  workspaceId?: string;
  createdBy?: string;
  
  // Aggregated metrics
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
  
  // Analytics
  ganttChart?: GanttChartData;
  pertAnalysis?: PertAnalysis;
  earnedValueManagement?: EvmData;
  projectAnalytics?: ProjectAnalyticsDTO;
  performanceMetrics?: PerformanceMetricsDTO;
}

// Project Summary for lists
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

// Detailed Project view with all relationships
export interface ProjectDetailDTO extends ProjectDTO {
  // Detailed relationships
  phases: PhaseDTO[];
  tasks: TaskDTO[];
  risks: RiskDTO[];
  milestones: MilestoneDTO[];
  payments: PaymentDTO[];
  materials: MaterialDTO[];
  stakeholders: StakeholderDTO[];
  insurancePolicies: InsurancePolicyDTO[];
  insuranceCertificates: InsuranceCertificateDTO[];
  alerts: ProjectAlert[];
  
  // Construction details
  plannedPhases: PhaseDTO[];
  constructionMilestones: MilestoneDTO[];
  
  // Project tenders
  tenders: TenderDTO[];
  
  // Financial details
  expenses: PaymentDTO[];
  
  // Performance data
  escalationThresholds?: {
    alert: number;
    notification: number;
    guarantee: number;
    legal: number;
  };
  
  // Resource allocation
  resourceAssignment?: any[];
  teamAllocations?: any[];
  
  // Documents (simplified - would be DocumentDTO)
  documents?: any[];
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
export interface ProjectDTO extends BaseFormDTO<ProjectDTO> {
  // Core project data
  title: string;
  description?: string;
  location?: string;
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
  phases?: PhaseFormDataDTO[];
  risks?: RiskFormDataDTO[];
  materials?: MaterialFormDataDTO[];
  stakeholders?: EmployeeFormDataDTO[];
  tasks?: TaskFormDataDTO[];
  inspections?: InspectionFormDataDTO[];
  documents?: DocumentFormDataDTO[];
  
  // Metadata
  metadata?: {
    createdById?: string;
    updatedById?: string;
    version?: number;
  };
}

// Create Project DTO
export interface CreateProjectDTO {
  title: string;
  description: string;
  location: string;
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
  methodology?: "waterfall" | "agile" | "hybrid";
  estimatedDurationDays?: number;
}

// Update Project DTO - standardized pattern  
export interface UpdateProjectDTO extends Partial<Omit<ProjectDTO, keyof BaseEntityDTO>> {
  id: string;
}

// Project UI State - for React hooks and components
export interface ProjectUIState extends BaseUIState<ProjectDTO> {
  formData: ProjectDTO;
  calculatedFields?: {
    totalCost?: number;
    completionPercentage?: number;
    daysRemaining?: number;
    riskScore?: number;
    teamUtilization?: number;
  };
  
}
// Interface for create project request
interface CreateProjectRequestDTO {
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
  // Domain collections
  payments?: {
    id: string;
    amount: number;
    date: string;
    status: string;
  }[];
  inspections?: {
    id: string;
    date: string;
    status: string;
    report: string;
  }[];
  tasks?: {
    id: string;
    title: string;
    status: string;
    dueDate: string;
  }[];
  documents?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
  materials?: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }[];
  phases?: {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  }[];
  milestones?: {
    id: string;
    title: string;
    date: string;
    status: string;
  }[];
  risks?: {
    id: string;
    title: string;
    probability: number;
    impact: number;
    mitigation: string;
  }[];
  tenders?: {
    id: string;
    title: string;
    status: string;
    deadline: string;
  }[];
  suppliers?: {
    id: string;
    name: string;
    contact: string;
  }[];
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
export type EVMMetrics = EvmData;
export type PERTAnalysis = PertAnalysis;