// Data Transfer Objects for UI components
import { ProjectStatus, ConstructionPhase, ConstructionStage, Task, ProjectRisk, ProjectResource, Inspection, Alert, InsurancePolicy, GanttChartData, PERTAnalysis, EVMData, ProjectContact, CheckScheduleLastRun } from '@/types/project';

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
  escalationThresholds?: {
    alert: number;
    notification: number;
    guarantee: number;
    legal: number;
  };
  checkScheduleLastRun?: CheckScheduleLastRun;
}

export interface ProjectFormDTO {
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