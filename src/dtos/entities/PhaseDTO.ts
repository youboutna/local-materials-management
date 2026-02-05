/**
 * Phase DTOs
 * Data transfer objects for API/UI exchanges
 * Following hexagonal architecture principles from PROMPTS.md
 * Rule #4: No DTOs in entities, proper type separation
 */

export interface PhaseStepDTO {
  id: string;
  name: string;
  description: string;
}

/**
 * Phase status enumeration
 * Current state of phase execution
 */
export enum PhaseStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled'
}

/**
 * Phase priority enumeration
 * Priority levels for phase execution
 */
export enum PhasePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Phase type enumeration
 * Classification of phase types
 */
export enum PhaseType {
  FOUNDATION = 'foundation',
  STRUCTURAL = 'structural',
  EXCAVATION = 'excavation',
  DEMOLITION = 'demolition',
  FINISHING = 'finishing',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  HVAC = 'hvac',
  ROOFING = 'roofing',
  EXTERIOR = 'exterior',
  INTERIOR = 'interior',
  LANDSCAPING = 'landscaping'
}

/**
 * Main Phase DTO
 * Core phase data structure with merged form data
 */
export interface PhaseDTO extends BaseEntityDTO {
  // Core identification
  id: string;
  name: string;
  description?: string;
  
  // Classification
  type: PhaseType;
  status: PhaseStatus;
  priority: PhasePriority;
  
  // Progress tracking
  progress: number; // 0-100
  completionPercentage?: number;
  
  // Timeline
  startDate?: string;
  endDate?: string;
  estimatedDuration?: number; // in days
  actualDuration?: number; // in days
  
  // Financial
  budget?: number;
  estimatedCost?: number;
  actualCost?: number;
  
  // Dependencies
  dependencies?: string[]; // Phase IDs only for DTO
  milestones?: string[]; // Milestone IDs only for DTO
  
  // Resources
  assignedTo?: string[]; // Employee IDs only for DTO
  resources?: {
    employees?: string[]; // Employee IDs only for DTO
    equipment?: string[]; // Equipment IDs only for DTO
    materials?: string[]; // Material IDs only for DTO
  };
  
  // Requirements
  requiresInspection?: boolean;
  
  // Form data fields (merged from PhaseFormDataDTO)
  steps?: PhaseStepDTO[];
  deliverables?: string[];
  acceptanceCriteria?: string[];
  notes?: string;
  requiresEngineerApproval?: boolean;
  
  // Location
  location?: {
    address?: string;
    city?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Project relationship
  projectId: string;
  
  // Metadata
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Base entity interface for DTO extensions
export interface BaseEntityDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Phase form data DTO for UI
export interface PhaseFormDataDTO {
  name: string;
  description?: string;
  type?: PhaseType;
  status?: PhaseStatus;
  priority?: PhasePriority;
  startDate?: string;
  endDate?: string;
  budget?: number;
  estimatedCost?: number;
  steps?: PhaseStepDTO[];
}

/**
 * Phase creation request interface
 * Input for creating new phases
 */
export interface CreatePhaseDTO {
  name: string;
  description?: string;
  type: PhaseType;
  priority?: PhasePriority;
  projectId: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  estimatedCost?: number;
  dependencies?: string[];
  milestones?: string[];
  assignedTo?: string[]; // Employee IDs only for DTO
  resources?: {
    employees?: string[]; // Employee IDs only for DTO
    equipment?: string[]; // Equipment IDs only for DTO
    materials?: string[]; // Material IDs only for DTO
  };
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
  location?: {
    address?: string;
    city?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  tags?: string[];
  notes?: string;
  documents?: string[]; // Document IDs only for DTO
  inspections?: string[]; // Inspection IDs only for DTO
}

/**
 * Phase update request interface
 * Input for updating existing phases
 */
export interface UpdatePhaseDTO {
  name?: string;
  description?: string;
  status?: PhaseStatus;
  endDate?: string;
  progress?: number;
  actualCost?: number;
  
  // Resources
  assignedTo?: string[]; // Employee IDs only for DTO
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
  
  // Dependencies
  dependencies?: string[]; // Phase IDs only for DTO
  materials?: string[]; // Material IDs only for DTO
  documents?: string[]; // Document IDs only for DTO
  inspections?: string[]; // Inspection IDs only for DTO
  
  // Metadata
  updatedBy?: string;
  changeReason?: string;
}

/**
 * Phase summary interface
 * Lightweight phase representation for lists
 */
export interface PhaseSummaryDTO extends BaseEntityDTO {
  id: string;
  name: string;
  status: PhaseStatus;
  progress: number;
  projectId: string;
  startDate?: string;
  endDate?: string;
  orderIndex: number;
  taskCount?: number;
  completedTasks?: number;
  budgetUtilization?: number;
  isOnTrack?: boolean;
  priority?: PhasePriority;
  lastActivity?: string;
}

/**
 * Phase statistics interface
 * Performance metrics for phase operations
 */
export interface PhaseStatisticsDTO {
  totalPhases: number;
  activePhases: number;
  completedPhases: number;
  averageCompletionTime?: number;
  successRate: number;
  totalBudget?: number;
  totalActualCost?: number;
  budgetVariance?: number;
  lastUpdated?: string;
}

/**
 * Phase milestone interface
 * Key milestones within phase
 */
export interface PhaseMilestoneDTO {
  id: string;
  phaseId: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  targetDate?: string;
  completedDate?: string;
  progress?: number;
  deliverables?: string[];
  dependencies?: string[]; // Phase IDs only for DTO
}

/**
 * Phase resource allocation interface
 * Resource management for phases
 */
export interface PhaseResourceAllocationDTO {
  phaseId: string;
  resourceId: string;
  resourceType: 'employee' | 'contractor' | 'equipment' | 'material';
  allocationPercentage: number;
  allocatedAt?: string;
  allocatedBy?: string;
  startDate?: string;
  endDate?: string;
  cost?: number;
}

/**
 * Phase dependency interface
 * Dependency relationships between phases
 */
export interface PhaseDependencyDTO {
  id: string;
  fromPhaseId: string;
  toPhaseId: string;
  dependencyType: 'finish_to_start' | 'resource_sharing' | 'sequential' | 'conditional';
  description?: string;
  isBlocking?: boolean;
  minLagDays?: number;
  maxLagDays?: number;
  createdById?: string;
  createdAt?: string;
}

export interface PhaseMetricsDTO {
  totalSteps: number;
  completedSteps: number;
  totalTasks: number;
  completedTasks: number;
  overallProgress: number;
  estimatedCompletionDate?: string;
  budgetUtilization: number;
  onTimeDelivery: number;
}

// Legacy interfaces for backward compatibility
export interface PhaseData {
  id: string;
  phase?: string;
  stage?: string;
  customPhase?: CustomPhase;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  budget: number;
  actualCost: number;
  progress: number;
  materials: Array<{ materialId: string; quantity: number; name?: string }>;
  humanResources: Array<{ roleId: string; quantity: number; role?: string }>;
  suppliers: Array<{ supplierId: string; name?: string; contact?: string }>;
  location: string;
  notes?: string;
}

export interface CustomPhase {
  id: string;
  name: string;
  number: number;
  customStages: Array<{
    id: string;
    name: string;
    order: number;
  }>;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  materials?: Array<{ materialId: string; quantity: number; name?: string }>;
  humanResources?: Array<{ roleId: string; quantity: number; role?: string }>;
  suppliers?: Array<{ supplierId: string; name?: string; contact?: string }>;
  location?: string;
  status: 'planned' | 'active' | 'completed' | 'paused';
  progress: number;
}

export interface PhaseDTOLegacy {
  id: string;
  project_id: string;
  phase_name: string;
  description: string;
  status: string;
  progress: number;
  budget: number;
  actual_cost: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  phase_type?: string;
  construction_phase?: string;
  construction_stage?: string;
}
