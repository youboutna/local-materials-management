/**
 * Phase DTOs
 * Data transfer objects for API/UI exchanges
 * Following hexagonal architecture principles from PROMPTS.md
 * Rule #4: No DTOs in entities, proper type separation
 */

/**
 * Task within a workflow step (from referential)
 *Distinct from TaskAssignmentDTO which represents assigned tasks (task_assignments table)
 */

export interface PhaseStepDTO {
  id: string;
  name: string;
  /** Business reference used to idempotently import a phase. */
  phaseCode?: string;
  description?: string;
  status: PhaseStatus;
  progress: number;
  estimatedDurationDays?: number;
  actualDurationDays?: number;
  startDate?: string;
  endDate?: string;
  orderIndex: number;
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
  constructionPhase?: string;           // constructionPhase
  constructionStage?: string;           // constructionStage
  createdBy?: string;                   // created_by
  customPhaseData?: Record<string, unknown>;                // custom_phase_data (Json)
  humanResources?: Record<string, unknown>;                 // human_resources (Json)
  weight?: number;                      // weight
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
  sting new phases
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
  status: 'pending' | 'inProgress' | 'completed' | 'overdue';
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
export interface PhaseResourceAlloconships between phases
 */
export interface PhaseDependencyDTO {
  id: string;
  fromPhaseId: string;
  toPhaseId: string;
  dependencyType: 'finishToStart' | 'resource_sharing' | 'sequential' | 'conditional';
  description?: string;
  isBlocking?: boolean;
  minLagDays?: number;
  maxLagDays?: number;
  createdById?: string;
  createdAt?: string;
}

export interface PhaseMetricsDTO {
  totalSteps: numberphase?: string;
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
  projectId: string;
  phaseName: string;
  description: string;
  status: string;
  progress: number;
  budget: number;
  actualCost: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  phaseType?: string;
  constructionPhase?: string;
  constructionStage?: string;
}

/**
 * Form data for creating/updating phases
 */
export interface PhaseFormDTO {
  phaseName: string;
  description?: string;
  construction_phase?: string;
  construction_stage?: string;
  estimatedCost?: number;
  estimatedDurationDays?: number;
  startDate?: string;
  endDate?: string;
  orderIndex?: number;
  steps?: PhaseStepFormDTO[];
}

export interface PhaseStepFormDTO {
  name: string;
  description?: string;
  estimatedDurationDays?: number;
  orderIndex?: number;
  tasks?: PhaseTaskFormDTO[];
}

export interface PhaseTaskFormDTO {
  name: string;
  description?: string;
  estimatedDurationDays?: number;
  assignedTo?: string[];
  orderIndex?: number;
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
  edPhaseData {
  // Core PhaseData properties
  id: string;
  phase?: string;
  stage?: string;
  customPhase?: CustomPhase;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedDuration: number;s
  humanResources?: EnhancedEmployeeResource[];
  materials?: EnhancedMaterialResource[];
  suppliers?: EnhancedSupplierResource[];
  
  // Search and display metadata
  searchableText?: string; // Combined text for semantic search
  dis?: string;
  status?: string;
  type?: string;
  // Search across related entities
  employeeName?: string; // Search by employee name, not just ID
  materialName?: string; // Search by material name, not just ID
  supplierName?: string; // Search by supplier name, not jus: string[];
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
// Moved from src/components/inspections/AdvancedInspectionScheduler.tsx
export interface ProjectStep {
  id: string;
  name: string;
  orderIndex: number;
  status: string;
  progress?: number;
}

// Moved from src/components/project/EnhancedTaskManager.tsx
export interface ProjectPhase {
  id: string;
  name: string;
  phaseName?: string;
  status: string;
  constructionPhase?: string;
  constructionPhase?: string;
}

// Moved from src/components/project/EnhancedWorkflowPhaseManager.tsx
export interface Phase {
  id: string;
  phaseName: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  progress?: number | null;
  budgetAllocated?: number | null;
  actualCost?: number | null;
  documentsCount?: number;
  tasksCount?: number;
  inspectionsCount?: number;
  paymentsCount?: number;
  location?: any;
  stakeholders?: any[];
  teamDelegation?: any;
}

// Moved from src/components/project/GanttDiagramWithMilestones.tsx
export interface GanttPhase {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'planned' | 'inProgress' | 'completed';
}

// Moved from src/components/project/ProjectDetailByDTO.tsx
export interface PhaseToSave {
  projectId: string;
  phaseName: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  estimatedCost: number;
  status: string;
  progress: number;
  phaseType: string;
  constructionPhase: string;
  custom_phase_data: Record<string, unknown>;
}

// Moved from src/components/project/TeamOverview.tsx
export interface ProjectPhase {
  id: string;
  phaseName: string;
  status: string;
  constructionPhase?: string;
}

// Moved from src/components/project/WaterfallPrng;
  startDate: string;
  endDate: string;
  budget: number;
  status: 'notStarted' | 'inProgress' | 'completed' | ?: string;
  status: string;
  progress?: number;
  order?: number;
  startDate?: string;
  endDate?: string;
  milestones?: any[];
  tasks?: any[];
}

// Moved from src/components/project/hierarchy/ProjectHierarchyView.tsx
export interface Phase {
  id: string;
  title?: string;
  phaseName?: string;
  phase?: string;
  name?: string;
  description?: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  estimatedCost?: number;
  steps?: any[];
  stages?: any[];
  milestones?: any[];
}

// Moved from src/components/project/hierarchy/ProjectMatrixView.tsx
export interface Phase {
  id: string;
  title?: string;
  phaseName?: string;
  phase?: string;
  name?: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  startDate?: string;
  endDate?: string;
  milestones?: any[];
  inspections?: any[];
  payments?: any[];
}

// Moved from src/components/tenders/TenderProjectStructure.tsx
export interface Phase {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  steps?: Step[];
}

// Moved from src/components/tenders/TenderProjectStructure.tsx
export interface Step {
  id: string;
  name: string;
  status: string;
  progress: number;
  orderIndex: number;
}

// Moved from src/application/services/boq/ProjectWbsLoader.ts
export interface RawStep {
  id?: string;
  code?: string;
  name?: string;
  label?: string;
  title?: string;
  orderIndex?: number;
  order?: number;
  tasks?: RawTask[];
}

// Moved from src/application/services/ProjectCalculationService.ts
export interface PhaseCostData {
  id: string;
  name: string;
  phaseName?: string;
  status: string;
  progress?: number;
  actualCost?: number;
  projectId?: string;
  estimatedCost?: number;
  budget?: number;
  estimated_labor_cost?: number;
  estimated_material_cost?: number;
  estimated_duration_days?: number;
  startDate?: string;
  endDate?: string;
  steps?: Array<{
    id: string;
    name: string;
    status: string;
    progress?: number;
    tasks?: Array<{
      id: string;
      status: string;
      progress?: number;
      description?: string;
    }>;
    description?: string;
  }>;
}

// Moved from src/application/services/ProjectWorkflowService.ts
export interface GeneratedPhaseData {
  id: string;
  phaseCode: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  status: 'notStarted' | 'inProgress' | 'completed' | 'delayed';
  budget: number;
  progress: number;
  order: number;
  steps: GeneratedStepData[];
  milestones: GeneratedMilestoneDTO[];
}

// Moved from src/hooks/hexagonal/useProjectPhasesHex.ts
export interface ProjectPhase {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  progress: number | null;
  phaseType?: string | null;
  constructionPhase?: string | null;
  custom_phase_data?: Record<string, unknown>;
}

// Moved from src/hooks/hexagonal/useProjectPhasesHex.ts
export interface PhaseFormData {
  projectId: string;
  phaseName: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  status?: string;
  progress?: number;
  phaseType?: string;
  constructionPhase?: string;
  custom_phase_data?: Record<string, unknown>;
}

// Moved from src/application/services/GanttPertDataService.ts
export interface GanttPhaseData {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'planned' | 'inProgress' | 'completed';
}

// Moved from src/application/services/ReferentialService.ts
export interface ProjectPhaseDTO {
  projectId: string;
  name: string;
  description: string;
  phaseNumber: number;
  startDate: string | null;
  endDate: string | null;
  status: 'notStarted' | 'inProgress' | 'completed' | 'onHold';
  phases: {
    referentialCode: string;
    phaseId: string;
    steps: Array<{
      stepId: string;
      name: string;
      description?: string;
      orderIndex: number;
      tasks: Array<{
        taskId: string;
        name: string;
        description?: string;
        orderIndex: number;
        estimated_duration_days?: number;
      }>;
    }>;
  };
}

// Moved from src/utils/dataNormalizer.ts
export type NormalizedStep = {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  startDate?: string | null;
  endDate?: string | null;
  position?: number;
  rawData?: Record<string, unknown>;
}

// Moved from src/utils/reportCalculations.ts
export interface PhaseTimeline {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  status: 'planned' | 'inProgress' | 'completed';
}

// Moved from src/hooks/hexagonal/usePhasesHex.ts
export interface CreatePhaseData {
  phaseName: string;
  description: string;
  constructionPhase?: string;
  constructionStage?: string;
  startDate?: string;
  endDate?: string;
  estimatedCost?: number;
  estimatedDuration?: number;
}

// Moved from src/hooks/hexagonal/usePhasesHex.ts
export interface UpdatePhaseData {
  phaseName?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  estimatedCost?: number;
  status?: string;
  progress?: number;
}

// Moved from src/utils/projectDataCalculations.ts
export interface PhaseCostData {
  id: string;
  name: string;
  phaseName?: string;
  status: string;
  progress?: number;
  actualCost?: number;
  projectId?: string;
  estimatedCost?: number;
  budget?: number;
  estimated_labor_cost?: number;
  estimated_material_cost?: number;
  estimated_duration_days?: number;
  startDate?: string;
  endDate?: string;
  steps?: Array<{
    id: string;
    name: string;
    status: string;
    progress?: number;
    tasks?: Array<{
      id: string;
      status: string;
      progress?: number;
      description?: string;
    }>;
    description?: string;
  }>;
}

// Moved from src/application/services/WorkflowService.ts
export interface PhaseProgress {
  phaseCode: string;
  phaseLabel: string;
  totalStages: number;
  completedStages: number;
  in_progress_stages: number;
  pendingStages: number;
  progressPercentage: number;
  stages: StageProgress[];
}

// Moved from src/application/services/WorkflowService.ts
export interface StageProgress {
  stageCode: string;
  stageLabel: string;
  status: 'pending' | 'inProgress' | 'completed' | 'blocked';
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  tasks: WorkflowTask[];
}