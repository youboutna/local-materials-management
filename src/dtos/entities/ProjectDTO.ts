/**
 * Project Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO, ContactInfoDTO, LocationDTO } from '../shared';
import { ProjectStatus } from '@/types/project';

export interface ProjectDTO extends BaseEntityDTO {
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
  coordinates?: LocationDTO;
  
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
  methodology?: string;
  launchDate?: string;
  attributionDate?: string;
  projectResponsableId?: string;
  mainContractor?: string;
  projectReference?: string;
  allowsInitialPayment?: boolean;
  initialPaymentPercentage?: number;
  currentPhase?: string;
  currentStage?: string;
  createdBy? : string//user uuid   
  // Financial and insurance attributes
  bankGuaranteeRequired?: boolean;
  bankGuaranteeAmount?: number;
  bankGuaranteePercentage?: number;
  insuranceRequired?: boolean;
  materialsBudget?: number;
  procurementLeadTime?: number;
  resourceAssignment?: any[]; // ✅ SEMANTIC: Array of ProjectResource[] from project_resources table
  receptionStatus?: string;
  closureNotes?: string;
  currency?: string;//use by default MRU
  
  // Aggregated properties from relationships
  totalSpent?: number;
  budgetUtilization?: number;
  remainingBudget?: number;
  scheduleVariance?: number;
  isOnTrack?: boolean;
  activeTeamMembers?: number;
  
  // Risk aggregations
  riskCount?: number;
  highRiskCount?: number;
  
  // Document aggregations
  documentCount?: number;
  pendingDocuments?: number;
  
  // Material aggregations
  materialCount?: number;
  totalMaterialCost?: number;
  
  // Phase aggregations
  phaseCount?: number;
  completedPhases?: number;
  activePhases?: number;
  
  // Inspection aggregations
  inspectionCount?: number;
  passedInspections?: number;
  failedInspections?: number;
  
  // Task aggregations
  taskCount?: number;
  completedTasks?: number;
  overdueTasks?: number;
  
  // Payment aggregations
  paymentCount?: number;
  paidAmount?: number;
  pendingPayments?: number;
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
  tasks: any[];
  risks: any[];
  resources: any[];
  inspections: any[];
  plannedPhases: any[];
  expenses: any[];
  alerts?: any[];
  insurancePolicies?: any[];
  methodology?: 'waterfall' | 'agile' | 'hybrid';
  ganttChart?: any;
  pertAnalysis?: any;
  earnedValueManagement?: any;
  contacts?: any[];
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
  checkScheduleLastRun?: any;
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
  coordinates?: LocationDTO;
  
  // Database schema fields
  project_reference?: string;
  start_date?: string;
  end_date?: string;
  estimated_duration_days?: number;
  currency?: string;
  status: string;
  payment_mode?: string;
  payment_frequency?: string;
  initial_advance?: number;
  retention_percentage?: number;
  priority?: string;
  project_type?: string;
  sector?: string;
  permit_number?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  area_sqm?: number | null;
  site_details?: string;
  client_name?: string;
  technical_manager_id?: string;
  supervisor_id?: string;
  workspace_id?: string;
  
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
  currentPhase?: string;
  currentStage?: string;
  
  // Additional data (for import only)
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
  
  // Financial instruments
  bankGuaranteeRequired?: boolean;
  bankGuaranteeAmount?: number;
  bankGuaranteePercentage?: number;
  insuranceRequired?: boolean;
  materialsBudget?: number;
  procurementLeadTime?: number;
  resourceAssignment?: string;
  
  // Validation & Closure fields
  receptionStatus?: string;
  closureNotes?: string;
  
  // Legacy compatibility
  estimatedBudget?: number;
  estimated_budget?: number;
}

export interface ProjectListItemDTO extends BaseEntityDTO {
  title: string;
  location: string;
  status: ProjectStatus;
  progress: number;
  budget: number;
  startDate: string;
  endDate?: string;
  thumbnail: string;
  teamSize: number;
  coordinates?: LocationDTO;
}

export interface CreateProjectDTO extends Omit<ProjectDTO, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdateProjectDTO extends Partial<CreateProjectDTO> {}

export interface CreateProjectRequestDTO {
  title: string;
  description: string;
  startDate: string; // ✅ CAMELCASE: Primary field
  endDate: string; // ✅ CAMELCASE: Primary field
  budget: number;
  address: string;
  latitude: number;
  longitude: number;
  projectManagerId: string; // ✅ CAMELCASE: Primary field
  clientId: string; // ✅ CAMELCASE: Primary field
  status: string;
  priority: string;
  estimatedDuration: number; // ✅ CAMELCASE: Primary field
  
  // Legacy snake_case for backward compatibility
  start_date?: string; // Legacy snake_case for backward compatibility
  end_date?: string; // Legacy snake_case for backward compatibility
  project_manager_id?: string; // Legacy snake_case for backward compatibility
  client_id?: string; // Legacy snake_case for backward compatibility
  estimated_duration?: number; // Legacy snake_case for backward compatibility
  
  // Champs additionnels pour compatibilité
  project_type?: string;
  sector?: string;
  permit_number?: string;
  payment_mode?: string;
  payment_frequency?: string;
  initial_advance?: number;
  retention_percentage?: number;
  currency?: string;
  client_name?: string;
  main_contractor?: string;
  technical_manager_id?: string;
  supervisor_id?: string;
  workspace_id?: string;
  
  // Legacy fields for compatibility with existing forms
  location?: string;
  progress?: number;
  thumbnail?: string;
  teamSize?: number;
  financingSource?: string;
  funding_source?: string; // Legacy snake_case for backward compatibility
  marketType?: string; // ✅ CAMELCASE: Instead of market_type
  market_type?: string; // Legacy snake_case for backward compatibility
  selectionMode?: string; // ✅ CAMELCASE: Instead of selection_mode
  selection_mode?: string; // Legacy snake_case for backward compatibility
  methodology?: string;
  geographicZone?: string; // ✅ CAMELCASE: Instead of geographic_zone
  geographic_zone?: string; // Legacy snake_case for backward compatibility
  terrainType?: string; // ✅ CAMELCASE: Instead of terrain_type
  terrain_type?: string; // Legacy snake_case for backward compatibility
  environmentalConstraints?: string; // ✅ CAMELCASE: Instead of environmental_constraints
  environmental_constraints?: string; // Legacy snake_case for backward compatibility
  areaSqm?: number; // ✅ CAMELCASE: Instead of area_sqm
  area_sqm?: number; // Legacy snake_case for backward compatibility
  currentPhase?: string; // ✅ CAMELCASE: Instead of current_phase
  current_phase?: string; // Legacy snake_case for backward compatibility
  currentStage?: string; // ✅ CAMELCASE: Instead of current_stage
  current_stage?: string; // Legacy snake_case for backward compatibility
  allowsInitialPayment?: boolean; // ✅ CAMELCASE: Instead of allows_initial_payment
  allows_initial_payment?: boolean; // Legacy snake_case for backward compatibility
  initialPaymentPercentage?: number; // ✅ CAMELCASE: Instead of initial_payment_percentage
  initial_payment_percentage?: number; // Legacy snake_case for backward compatibility
  requiresPermits?: boolean; // ✅ CAMELCASE: Instead of requires_permits
  requires_permits?: boolean; // Legacy snake_case for backward compatibility
  bankGuaranteeRequired?: boolean; // ✅ CAMELCASE: Instead of bank_guarantee_required
  bank_guarantee_required?: boolean; // Legacy snake_case for backward compatibility
  bankGuaranteeAmount?: number; // ✅ CAMELCASE: Instead of bank_guarantee_amount
  bank_guarantee_amount?: number; // Legacy snake_case for backward compatibility
  bankGuaranteePercentage?: number; // ✅ CAMELCASE: Instead of bank_guarantee_percentage
  bank_guarantee_percentage?: number; // Legacy snake_case for backward compatibility
  insuranceRequired?: boolean; // ✅ CAMELCASE: Instead of insurance_required
  insurance_required?: boolean; // Legacy snake_case for backward compatibility
  materialsBudget?: number; // ✅ CAMELCASE: Instead of materials_budget
  materials_budget?: number; // Legacy snake_case for backward compatibility
  procurementLeadTime?: number; // ✅ CAMELCASE: Instead of procurement_lead_time
  procurement_lead_time?: number; // Legacy snake_case for backward compatibility
  resourceAssignment?: any[]; // ✅ SEMANTIC: Array of ProjectResource[] from project_resources table
  resource_assignment?: string; // Legacy snake_case for backward compatibility
  receptionStatus?: string; // ✅ CAMELCASE: Instead of reception_status
  reception_status?: string; // Legacy snake_case for backward compatibility
  closureNotes?: string; // ✅ CAMELCASE: Instead of closure_notes
  closure_notes?: string; // Legacy snake_case for backward compatibility
  projectResources?: any[]; // ✅ CAMELCASE: Instead of project_resources
  project_resources?: any[]; // Legacy snake_case for backward compatibility
  
  // Additional camelCase fields for team roles
  mainContractor?: string; // ✅ CAMELCASE: Instead of main_contractor
  clientName?: string; // ✅ CAMELCASE: Instead of client_name
  projectType?: string; // ✅ CAMELCASE: Instead of project_type
  permitNumber?: string; // ✅ CAMELCASE: Instead of permit_number
  paymentFrequency?: string; // ✅ CAMELCASE: Instead of payment_frequency
  paymentMode?: string; // ✅ CAMELCASE: Instead of payment_mode
  retentionPercentage?: number; // ✅ CAMELCASE: Instead of retention_percentage
  initialAdvancePercentage?: number; // ✅ CAMELCASE: Instead of initial_advance
  hasUtilities?: boolean; // ✅ CAMELCASE: Instead of has_utilities
  engineeringConsultantId?: string; // ✅ CAMELCASE: Instead of engineering_consultant_id
  technicalManagerId?: string; // ✅ CAMELCASE: Instead of technical_manager_id
  supervisorId?: string; // ✅ CAMELCASE: Instead of supervisor_id
}
