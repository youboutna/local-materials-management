/**
 * Phase DTOs
 * Data transfer objects for API/UI exchanges
 * Following hexagonal architecture principles from PROMPTS.md
 * Rule #4: No DTOs in entities, proper type separation
 */

import type { BaseEntityDTO } from './BaseEntityDTO';

/**
 * Task within a workflow step (from referential)
 *Distinct from TaskAssignmentDTO which represents assigned tasks (task_assignments table)
 */
export interface PhaseTaskDTO {
  id: string;
  name: string;
  phaseCode?: string;
  description?: string;
  status: PhaseStatus;
  progress: number;
  estimated_duration_days?: number;
  actual_duration_days?: number;
  start_date?: string;
  end_date?: string;
  assigned_to?: string[];
  dependencies?: string[];
  weight?: number;
  order_index: number;
}

export interface PhaseStepDTO {
  id: string;
  name: string;
  /** Business reference used to idempotently import a phase. */
  phaseCode?: string;
  description?: string;
  status: PhaseStatus;
  progress: number;
  estimated_duration_days?: number;
  actual_duration_days?: number;
  start_date?: string;
  end_date?: string;
  order_index: number;
  tasks: PhaseTaskDTO[];
}

/**
 * Phase status enumeration
 * Current state of phase execution
 */
export enum PhaseStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
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
  orderIndex?: number; // Order from referential
  
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
  /** Milestones hydratés (workflow projet / import) */
  milestones?: Array<import('./MilestoneDTO').MilestoneDTO>;
  /** Tâches hydratées (workflow projet / import) — tolérant aux alias legacy */
  tasks?: Array<Record<string, unknown> & { title?: string; name?: string }>;
  /** Lignes DQE rattachées à la phase */
  dqeLines?: Array<import('../boq/BoqLineDTO').BoqLineDTO>;
  /** Référence métier idempotente (import) */
  phaseCode?: string;
  /** Clé externe stable utilisée pour les réimports idempotents. */
  externalRef?: string;

  
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

  // NEW: Additional database fields from project_phases table
  constructionPhase?: string;           // construction_phase
  constructionStage?: string;           // construction_stage
  createdBy?: string;                   // created_by
  customPhaseData?: Record<string, unknown>;                // custom_phase_data (Json)
  humanResources?: Record<string, unknown>;                 // human_resources (Json)
  weight?: number;                      // weight
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
  completionDate?: string;
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

/**
 * Form data for creating/updating phases
 */
export interface PhaseFormDTO {
  phase_name: string;
  description?: string;
  construction_phase?: string;
  construction_stage?: string;
  estimated_cost?: number;
  estimated_duration_days?: number;
  start_date?: string;
  end_date?: string;
  order_index?: number;
  steps?: PhaseStepFormDTO[];
}

export interface PhaseStepFormDTO {
  name: string;
  description?: string;
  estimated_duration_days?: number;
  order_index?: number;
  tasks?: PhaseTaskFormDTO[];
}

export interface PhaseTaskFormDTO {
  name: string;
  description?: string;
  estimated_duration_days?: number;
  assigned_to?: string[];
  order_index?: number;
}

// Enhanced resource types for UI display with semantic search support
export interface EnhancedEmployeeResource {
  id: string;
  employeeId: string;
  name: string;
  position?: string;
  department?: string;
  email?: string;
  phone?: string;
  quantity: number;
  role?: string;
  isActive?: boolean;
}

export interface EnhancedMaterialResource {
  id: string;
  materialId: string;
  name: string;
  description?: string;
  category?: string;
  unit: string;
  pricePerUnit?: number;
  availableQuantity?: number;
  quantity: number;
  sku?: string;
  isActive?: boolean;
}

export interface EnhancedSupplierResource {
  id: string;
  supplierId: string;
  name: string;
  contact?: {
    name: string;
    email: string;
    phone?: string;
    role?: string;
  };
  category?: string;
  status?: string;
  rating?: {
    quality: number;
    delivery: number;
    price: number;
    communication: number;
    overall: number;
  };
  isActive?: boolean;
}

// Enhanced PhaseData for UI with enriched resources
export interface EnhancedPhaseData {
  // Core PhaseData properties
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
  location: string;
  notes?: string;
  
  // Enhanced resources with full details from other entities
  humanResources?: EnhancedEmployeeResource[];
  materials?: EnhancedMaterialResource[];
  suppliers?: EnhancedSupplierResource[];
  
  // Search and display metadata
  searchableText?: string; // Combined text for semantic search
  displayInfo?: {
    employeeNames: string[];
    materialNames: string[];
    supplierNames: string[];
    locationText: string;
    fullDescription: string;
  };
}

// Phase search input for semantic search across entities
export interface PhaseSearchInput {
  query?: string;
  status?: string;
  type?: string;
  // Search across related entities
  employeeName?: string; // Search by employee name, not just ID
  materialName?: string; // Search by material name, not just ID
  supplierName?: string; // Search by supplier name, not just ID
  location?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
  budgetRange?: {
    min?: number;
    max?: number;
  };
}

// Phase search result with semantic matching
export interface PhaseSearchResult {
  phase: EnhancedPhaseData;
  relevanceScore: number;
  matchedFields: string[];
  highlights: {
    employeeNames?: string[];
    materialNames?: string[];
    supplierNames?: string[];
    description?: string[];
    location?: string[];
  };
}

// Resource enrichment for data transformation
export interface ResourceEnrichment {
  employeeIds: string[];
  materialIds: string[];
  supplierIds: string[];
}

export interface EnrichedResources {
  employees: EnhancedEmployeeResource[];
  materials: EnhancedMaterialResource[];
  suppliers: EnhancedSupplierResource[];
}
