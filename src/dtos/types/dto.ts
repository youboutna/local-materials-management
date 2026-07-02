// Data Transfer Objects for UI components
import { Alert, CheckScheduleLastRun, ConstructionPhase, ConstructionStage, EVMData, GanttChartData, Inspection, InsurancePolicy, PERTAnalysis, ProjectContact, ProjectResource, ProjectRisk, ProjectStatus, Task } from '@/dtos/types/project';

// Re-export phase DTOs for convenience
export * from './phase-dto';
export interface ProjectDTO {
  id: string;
  title: string;
  description: string;
  location: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  endDate?: string;
  thumbnail: string;
  teamSize: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // Localization fields
  localisation?: any[];
  forme?: string;
  adresse?: string | any;
  // Location-specific fields
  geographicZone?: string;
  terrainType?: string;
  environmentalConstraints?: string;
  hasUtilities?: boolean;
  requiresPermits?: boolean;
  
  // Classification
  category?: string;
  subCategory?: string;
  priorityLevel?: 'Faible' | 'Moyenne' | 'Élevée' | 'Très élevée';
  riskLevel?: 'Faible' | 'Moyen' | 'Élevé' | 'Critique';
  environmentalImpact?: 'Nul' | 'Faible' | 'Modéré' | 'Élevé';
  sustainabilityScore?: number;
  
  financingSource?: string;
  marketType?: string;
  selectionMode?: string;
  launchDate?: string;
  attributionDate?: string;
  projectResponsableId?: string;
  mainContractor?: string;
  projectReference?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  currentPhase?: ConstructionPhase;
  currentStage?: ConstructionStage;
}

export interface ProjectSummaryDTO extends ProjectDTO {
  tasksCount: number;
  risksCount: number;
  inspectionsCount: number;
  paymentsCount: number;
  phasesCount: number;
  lastActivity?: string;
}

export interface ProjectDetailDTO extends ProjectDTO {
  tasks: Task[];
  risks: ProjectRisk[];
  resources: ProjectResource[];
  inspections: Inspection[];
  plannedPhases: any[];
  expenses: any[];
  alerts?: Alert[];
  insurancePolicies?: InsurancePolicy[];
  methodology?: 'waterfall' | 'agile' | 'hybrid';
  ganttChart?: GanttChartData;
  pertAnalysis?: PERTAnalysis;
  earnedValueManagement?: EVMData;
  contacts?: ProjectContact[];
  constructionMilestones?: any[];
  milestones?: any[];
  documents?: any[];
  stakeholders?: any[];
  escalationThresholds?: {
  alert: number;
  notification: number;
  guarantee: number;
  legal: number;
  };
  checkScheduleLastRun?: CheckScheduleLastRun;
}

export interface ProjectFormDTO {
  id?: string;
  title: string;
  description: string;
  location: string;
  budget: number;
  startDate: string;
  endDate?: string;
  teamSize: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // Location-specific fields
  geographicZone?: string;
  terrainType?: string;
  environmentalConstraints?: string;
  hasUtilities?: boolean;
  requiresPermits?: boolean;
  
  // Classification
  category?: string;
  subCategory?: string;
  priorityLevel?: 'Faible' | 'Moyenne' | 'Élevée' | 'Très élevée';
  riskLevel?: 'Faible' | 'Moyen' | 'Élevé' | 'Critique';
  environmentalImpact?: 'Nul' | 'Faible' | 'Modéré' | 'Élevé';
  sustainabilityScore?: number;
  
  financingSource?: string;
  marketType?: string;
  selectionMode?: string;
  launchDate?: string;
  attributionDate?: string;
  projectResponsableId?: string;
  mainContractor?: string;
  projectReference?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  
  // Additional data (for import only)
  status?: string;
  progress?: number;
  thumbnail?: string;
  milestones?: any[];
  documents?: any[];
  stakeholders?: any[];
  inspections?: any[];
  risks?: any[];
  tasks?: any[];
  payments?: any[];
  phases?: any[];
  plannedPhases?: any[];
  constructionMilestones?: any[];
  expenses?: any[];
  resources?: any[];
}

export interface TaskDTO {
  id: string;
  name: string;
  description: string;
  assignedTo: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  actualDuration?: number;
  costEstimate: number;
  actualCost?: number;
}

export interface InspectionDTO {
  id: string;
  project_id: string;
  inspector: string;
  date: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending';
  progress_at_inspection: number;
  comments?: string;
  phase_id?: string;
  documents?: string[];
  issues?: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved';
    deadline?: string;
    assignedTo?: string;
  }>;
}

export interface PaymentDTO {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  progress_at_payment: number;
  transaction_id: string;
  contractor_name: string;
  contractor_contact: string;
  bank_name?: string;
  account_number?: string;
  check_number?: string;
  mobile_number?: string;
  mobile_operator?: string;
  receiver_name?: string;
}

export interface RiskDTO {
  id: string;
  title: string;
  description: string;
  probability: number;
  impact: number;
  mitigationPlan: string;
  status: 'identified' | 'monitored' | 'mitigated' | 'resolved';
}

export interface ProjectListItemDTO {
  id: string;
  title: string;
  location: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  endDate?: string;
  thumbnail: string;
  teamSize: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}