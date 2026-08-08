/**
 * TaskAssignment Data Transfer Objects — SOURCE UNIQUE
 * Fusion définitive Task + TaskAssignment sur la table `task_assignments`.
 * `assignedTo` est TOUJOURS un tableau d'UUID côté DTO/entité.
 * camelCase uniquement, aucune logique métier (hors normalisation de vocabulaire).
 */

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  /** Statut d'affichage uniquement — normalisé en `in_progress` avant persistance. */
  BLOCKED = 'blocked',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  /** Alias de vocabulaire UI — équivalent à URGENT. */
  CRITICAL = 'urgent',
}

export type AssigneeType = 'supplier' | 'employee' | 'user' | 'external';

/** Type de tâche (classification métier facultative). */
export enum TaskType {
  GENERAL = 'general',
  INSPECTION = 'inspection',
  DOCUMENT = 'document',
  PAYMENT = 'payment',
  MATERIAL = 'material',
  STUDY = 'study',
  EXECUTION = 'execution',
}

export interface TaskAssignmentDTO {
  id: string;
  title: string;
  /** Alias de compatibilité de `title` (lecture seule côté UI/rapports). */
  name?: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  assignedTo: string[];
  /** Alias de compatibilité : premier assigné. */
  assigneeId?: string;
  assignedBy?: string;
  assigneeType?: AssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  status: TaskStatus | string;
  priority: TaskPriority | string;
  progress: number;
  type?: TaskType | string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  completedAt?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  estimatedCost?: number;
  actualCost?: number;
  dependencies?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}


export interface CreateTaskAssignmentDTO {
  id?: string;
  title: string;
  /** Alias de compatibilité de `title`. */
  name?: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  assignedTo?: string | string[];
  /** Alias de compatibilité : assigné unique. */
  assigneeId?: string;
  assignedBy?: string;
  assigneeType?: AssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  progress?: number;
  type?: TaskType | string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  estimatedDuration?: number;
  estimatedCost?: number;
  dependencies?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateTaskAssignmentDTO {
  title?: string;
  /** Alias de compatibilité de `title`. */
  name?: string;
  description?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  progress?: number;
  type?: TaskType | string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  completedAt?: string;
  assignedTo?: string | string[];
  /** Alias de compatibilité : assigné unique. */
  assigneeId?: string;
  assignedBy?: string;
  assigneeType?: AssigneeType;
  assigneeName?: string;
  assigneeEmail?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  estimatedCost?: number;
  actualCost?: number;
  dependencies?: string[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

/** Filtres de recherche. */
export interface TaskAssignmentFiltersDTO {
  searchTerm?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  projectId?: string;
  phaseId?: string;
}

/** Statistiques agrégées. */
export interface TaskAssignmentStatsDTO {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdue: number;
  dueSoon: number;
  completionRate: number;
}

/** Normalise toute forme d'assignation vers un tableau d'UUID. */
export function normalizeAssignedTo(assignedTo?: string | string[] | null): string[] {
  if (!assignedTo) return [];
  if (Array.isArray(assignedTo)) return assignedTo.filter((a) => !!a);
  if (typeof assignedTo === 'string' && assignedTo.startsWith('{')) {
    return assignedTo.slice(1, -1).split(',').filter((s) => s.length > 0);
  }
  return [assignedTo];
}

/** Normalise un statut (FR/EN, accentué) vers le statut DB autorisé. */
export function normalizeTaskStatus(status?: string | null, progress?: number): TaskStatus {
  const key = (status ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  const map: Record<string, TaskStatus> = {
    termine: TaskStatus.COMPLETED,
    terminee: TaskStatus.COMPLETED,
    completed: TaskStatus.COMPLETED,
    done: TaskStatus.COMPLETED,
    en_cours: TaskStatus.IN_PROGRESS,
    in_progress: TaskStatus.IN_PROGRESS,
    started: TaskStatus.IN_PROGRESS,
    en_attente: TaskStatus.PENDING,
    planifie: TaskStatus.PENDING,
    planifiee: TaskStatus.PENDING,
    pending: TaskStatus.PENDING,
    not_started: TaskStatus.PENDING,
    todo: TaskStatus.PENDING,
    assigned: TaskStatus.PENDING,
    accepted: TaskStatus.IN_PROGRESS,
    delayed: TaskStatus.IN_PROGRESS,
    en_retard: TaskStatus.IN_PROGRESS,
    bloque: TaskStatus.IN_PROGRESS,
    bloquee: TaskStatus.IN_PROGRESS,
    blocked: TaskStatus.IN_PROGRESS,
    annule: TaskStatus.CANCELLED,
    annulee: TaskStatus.CANCELLED,
    cancelled: TaskStatus.CANCELLED,
    canceled: TaskStatus.CANCELLED,
    rejected: TaskStatus.CANCELLED,
  };
  if (map[key]) return map[key];
  if (progress != null) {
    if (progress >= 100) return TaskStatus.COMPLETED;
    if (progress > 0) return TaskStatus.IN_PROGRESS;
  }
  return TaskStatus.PENDING;
}

/** Normalise une priorité (FR/EN) vers la priorité DB autorisée. */
export function normalizeTaskPriority(priority?: string | null): TaskPriority {
  const key = (priority ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  const map: Record<string, TaskPriority> = {
    basse: TaskPriority.LOW,
    faible: TaskPriority.LOW,
    low: TaskPriority.LOW,
    moyen: TaskPriority.MEDIUM,
    moyenne: TaskPriority.MEDIUM,
    normale: TaskPriority.MEDIUM,
    medium: TaskPriority.MEDIUM,
    normal: TaskPriority.MEDIUM,
    haute: TaskPriority.HIGH,
    elevee: TaskPriority.HIGH,
    high: TaskPriority.HIGH,
    urgente: TaskPriority.URGENT,
    urgent: TaskPriority.URGENT,
    critique: TaskPriority.URGENT,
    critical: TaskPriority.URGENT,
  };
  return map[key] ?? TaskPriority.MEDIUM;
}

// ============= Request DTOs (façade service) =============

/** Champs tolérés en entrée UI (compat héritée). */
export interface TaskAssignmentInputDTO extends CreateTaskAssignmentDTO {
  taskId?: string;
  assignmentNotes?: string;
}

export interface CreateTaskAssignmentRequestDTO {
  taskData: TaskAssignmentInputDTO;
  assignedBy?: string;
}

export interface UpdateTaskAssignmentRequestDTO {
  id: string;
  updates: UpdateTaskAssignmentDTO & { assignmentNotes?: string };
}

export interface DeleteTaskAssignmentRequestDTO {
  id: string;
}

export interface GetTaskAssignmentByIdRequestDTO {
  id: string;
}

export interface GetTaskAssignmentsRequestDTO {
  filters?: TaskAssignmentFiltersDTO;
}

export interface TaskAssignmentValidationResultDTO {
  isValid: boolean;
  errors: string[];
}
// Moved from src/components/project/EnhancedTaskManager.tsx
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'inProgress' | 'completed';
  dueDate?: string;
}

// Moved from src/components/project/EnhancedTaskManager.tsx
export interface TaskAssignmentExtended {
  id: string;
  title: string | null;
  description: string | null;
  projectId: string | null;
  phaseId: string | null;
  assignedTo: string | null;
  assignedBy: string | null;
  dueDate: string | null;
  priority: string | null;
  status: string | null;
  completionDate: string | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  // Enhanced fields
  estimatedDuration: number | null;
  actualDuration: number | null;
  startDate: string | null;
  endDate: string | null;
  progress: number | null;
  weight: number | null;
  costEstimate: number | null;
  actualCost: number | null;
  optimisticEstimate: number | null;
  pessimisticEstimate: number | null;
  most_likely_estimate: number | null;
  criticalPath: boolean | null;
}

// Moved from src/components/project/EnhancedTaskManager.tsx
export interface TaskDependency {
  id: string;
  taskId: string;
  depends_on_task_id: string;
  dependencyType: string | null;
  lagDays: number | null;
}

// Moved from src/components/project/EnhancedTaskManager.tsx
export interface TaskFormData {
  title: string;
  description: string;
  phaseId: string;
  assignedTo: string;
  dueDate: string;
  priority: string;
  status: string;
  notes: string;
  estimatedDuration: string;
  startDate: string;
  endDate: string;
  weight: string;
  costEstimate: string;
  optimisticEstimate: string;
  pessimisticEstimate: string;
  most_likely_estimate: string;
  criticalPath: boolean;
  applyToAllPhases: boolean;
  selectedPhases?: string[];
}

// Moved from src/components/project/PhaseStepTaskManager.tsx
export interface PhaseStepTask {
  phaseId: string;
  phaseName: string;
  phaseCode: string;
  status: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  stepId?: string;
  stepName?: string;
  stepCode?: string;
  taskId?: string;
  taskName?: string;
  taskDescription?: string;
  assignedTo?: string[];
}

// Moved from src/components/project/WaterfallGanttChart.tsx
export interface GanttTaskDTO {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  phase: string;
  dependencies?: string[];
  assignedTo?: string;
  budget?: number;
  status: 'notStarted' | 'inProgress' | 'completed' | 'delayed';
  procurementStep?: number;
}

// Moved from src/components/suppliers/TaskCompletion.tsx
export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate?: string;
  completionDate?: string;
  notes?: string; // Added missing notes property
  projects?: {
    title: string;
    location: string;
  };
}

// Moved from src/components/tenders/EnhancedTenderEstimator.tsx
export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'inProgress' | 'completed' | 'skipped';
  progress: number;
}

// Moved from src/hooks/hexagonal/index.ts
export interface ProjectTaskFormData {
  title: string;
  description?: string;
  phaseId?: string;
  assignedTo?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  estimatedHours?: number;
  status?: 'pending' | 'inProgress' | 'completed' | 'cancelled';
}

// Moved from src/hooks/hexagonal/index.ts
export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'inProgress' | 'done';
  phaseId?: string;
  assignedTo?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Moved from src/hooks/hexagonal/useWorkspacesHex.ts
export interface UseWorkspacesHexResult {
  workspaces: Array<{
    id: string;
    name: string;
    location: string;
    status: string;
    contactManager?: string;
    contactPhone?: string;
    facilities?: string[];
    description?: string;
    capacity?: number;
    createdAt?: string;
    updatedAt?: string;
  }>;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createWorkspace: (data: CreateWorkspaceDTO) => void;
  updateWorkspace: { mutate: (params: { id: string; data: UpdateWorkspaceDTO }) => void; isPending: boolean };
  deleteWorkspace: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

// Moved from src/hooks/hexagonal/useWorkspacesHex.ts
export interface CreateWorkspaceDTO {
  name: string;
  location: string;
  status?: string;
  contactManager?: string;
  contactPhone?: string;
  facilities?: string[];
  description?: string;
  capacity?: number;
}

// Moved from src/hooks/hexagonal/useWorkspacesHex.ts
export interface UpdateWorkspaceDTO {
  name?: string;
  location?: string;
  status?: string;
  contactManager?: string;
  contactPhone?: string;
  facilities?: string[];
  description?: string;
  capacity?: number;
}

// Moved from src/application/services/boq/ProjectWbsLoader.ts
export interface RawTask {
  id?: string;
  code?: string;
  name?: string;
  label?: string;
  title?: string;
  orderIndex?: number;
  order?: number;
}

// Moved from src/application/services/ProjectWorkflowService.ts
export interface GeneratedTaskData {
  id: string;
  taskCode: string;
  name: string;
  description?: string;
  estimatedDurationDays: number;
  requiresInspection: boolean;
  requiresEngineerApproval: boolean;
  status: 'notStarted' | 'inProgress' | 'completed';
}

// Moved from src/application/services/ProjectImportExportService.ts
export interface ProjectImportTask {
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  progress?: number;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  dueDate?: string;
  /** Référence la phase locale (`phase.id` ou `phase.code`) quand la tâche est au niveau projet. */
  phaseId?: string;
  assignedTo?: string | string[];
  assigneeName?: string;
  assigneeEmail?: string;
  AssignedEmail?: string;
  assignedName?: string;
  assignedID?: string;
}

// Moved from src/hooks/useWorkspaces.ts
export interface WorkspaceData {
  name: string;
  location: string;
  status?: string;
  contactManager?: string;
  contactPhone?: string;
  facilities?: string[];
}
// Moved from src/dtos/entities/AdvancedTenderEstimateDTO.ts (reconciled)
export interface WorkflowTransitionDTO {
  fromStatus: TenderEstimateStatus;
  toStatus: TenderEstimateStatus;
  isAvailable: boolean;
  requirements: string[];
  restrictions: string[];
  estimatedProcessingTime: number; // in hours
}

// Moved from src/dtos/entities/AdvancedTenderEstimateDTO.ts (reconciled)
export interface WorkflowHistoryDTO {
  id: string;
  action: string;
  fromStatus?: TenderEstimateStatus;
  toStatus?: TenderEstimateStatus;
  performedBy: string;
  performedAt: string;
  notes?: string;
  metadata?: Record<string, any>;
}

// Moved from src/dtos/entities/AdvancedTenderEstimateDTO.ts (reconciled)
export interface WorkflowActionDTO {
  actionType: 'submit' | 'review' | 'approve' | 'reject' | 'cancel' | 'resubmit';
  description: string;
  isAvailable: boolean;
  requirements: string[];
  estimatedTime: number;
}

// Moved from src/dtos/entities/EmployeeDTO.ts (reconciled)
export interface EmployeeProjectAssignmentDTO {
  id: string;
  employeeId: string;
  projectId: string;
  role: string;
  startDate?: string;
  endDate?: string;
  allocationPercentage?: number; // 0-100
  isPrimary?: boolean;
  hourlyRate?: number;
  budget?: number;
  actualCost?: number;
  performanceRating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Moved from src/dtos/entities/HierarchyMappingDTO.ts (reconciled)
export interface HierarchyAssignmentDTO {
  employeeId: string;
  positionId: string;
  hierarchyId: string;
  organizationName: string;
  assignmentDate: string;
  assignedBy: string;
  notes?: string;
}

// Moved from src/dtos/entities/InspectionPermissionDTO.ts (reconciled)
export interface InspectorAssignmentDTO {
  inspectorId: string;
  inspectionId: string;
  assignmentDate: string;
  assignedBy: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  notes?: string;
  estimatedDuration?: number;
  actualDuration?: number;
}

// Moved from src/dtos/entities/PhaseDTO.ts (reconciled)
export interface PhaseTaskDTO {
  id: string;
  name: string;
  phaseCode?: string;
  description?: string;
  status: PhaseStatus;
  progress: number;
  estimatedDurationDays?: number;
  actualDurationDays?: number;
  startDate?: string;
  endDate?: string;
  assignedTo?: string[];
  dependencies?: string[];
  weight?: number;
  orderIndex: number;
}

// Moved from src/dtos/entities/PhaseDTO.ts (reconciled)
export interface PhaseTaskFormDTO {
  name: string;
  description?: string;
  estimatedDurationDays?: number;
  assignedTo?: string[];
  orderIndex?: number;
}

// Moved from src/dtos/entities/PhaseTaskDTO.ts (reconciled)
export interface CreatePhaseTaskDTO {
  title: string;
  description?: string;
  assignedTo?: string;
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  progress?: number;
  dueDate?: string;
  startDate?: string;
  endDate?: string;
  phaseId: string;
  projectId?: string;
  notes?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  assigneeType?: string;
}

// Moved from src/dtos/entities/PhaseTaskDTO.ts (reconciled)
export interface PhaseTaskFormData {
  title: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
  startDate?: string;
  assignedTo?: string;
  assigneeName?: string;
  assigneeEmail?: string;
  assigneeType?: string;
  notes?: string;
}

// Moved from src/dtos/entities/ProjectAggregateDTO.ts (reconciled)
export interface GanttTask {
  id: string;
  text: string;
  startDate: string;
  duration: number;
  progress: number;
  parent?: string;
  color?: string;
}

// Moved from src/dtos/entities/ProjectAggregateDTO.ts (reconciled)
export interface TaskAssignment {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  assignedTo?: string;
  assignedBy?: string;
  status: "pending" | "inProgress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate?: Date;
  completionDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Moved from src/dtos/entities/ProjectDTO.ts (reconciled)
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

// Moved from src/dtos/entities/ProjectReportDTO.ts (reconciled)
export interface TaskAssignment {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  assignedTo: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled';
  dueDate?: string;
  completionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Moved from src/dtos/entities/ProjectReportDTO.ts (reconciled)
export interface WorkflowStepDTO {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  orderIndex: number;
  status: 'pending' | 'inProgress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate?: string;
  completionDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Moved from src/dtos/entities/ProjectReportDTO.ts (reconciled)
export interface WorkflowPhase {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  stages: WorkflowStage[];
  createdAt: string;
  updatedAt: string;
}

// Moved from src/dtos/entities/ProjectReportDTO.ts (reconciled)
export interface WorkflowStage {
  id: string;
  phaseId: string;
  name: string;
  description?: string;
  orderIndex: number;
  steps: WorkflowStepDTO[];
  createdAt: string;
  updatedAt: string;
}

// Moved from src/dtos/entities/ReceptionDTO.ts (reconciled)
export interface ReceptionWorkflowDTO {
  projectId: string;
  currentStep: number;
  totalSteps: number;
  steps: ReceptionWorkflowStepDTO[];
  status: 'notStarted' | 'inProgress' | 'pendingReview' | 'approved' | 'rejected';
  lastUpdated: string;
}

// Moved from src/dtos/entities/ReceptionDTO.ts (reconciled)
export interface ReceptionWorkflowStepDTO {
  step: number;
  name: string;
  title: string;
  description: string;
  status: 'pending' | 'inProgress' | 'completed' | 'skipped';
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
}

// Moved from src/dtos/entities/ReportDTO.ts (reconciled)
export interface PhaseTaskDTO {
  id: string;
  name: string;
  description?: string;
  status: string;
  progress: number;
  startDate?: string;
  endDate?: string;
  assignedTo?: string;
  estimatedHours?: number;
  actualHours?: number;
  
  dependencies?: string[];
  deliverables?: string[];
  qualityScore?: number;
}

// Moved from src/dtos/entities/WorkflowDTO.ts (reconciled)
export interface WorkflowStatusDTO {
  isProcessing: boolean;
  lastEvent: WorkflowEvent | null;
  canProceed: boolean;
  nextAction: string;
  metrics: {
    pendingPayment: number;
  };
}

// Moved from src/dtos/entities/WorkflowDTO.ts (reconciled)
export interface WorkflowMetricsDTO {
  progress: number;
  verifiedMilestones: number;
  totalMilestones: number;
  pendingPayment: number;
  blockedIssues: string[];
}

// Moved from src/dtos/entities/WorkflowDTO.ts (reconciled)
export interface WorkflowStateDTO {
  id: string;
  projectId: string;
  currentPhase: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  progress: number;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
}

// Moved from src/dtos/entities/WorkspaceDTO.ts (reconciled)
export interface WorkspaceDTO {
  id: string;
  workspaceId: string;
  workspaceCode: string;
  name: string;
  location: {
    code: string;
    name: string;
    nameAr: string;
    type: 'region' | 'city' | 'port' | 'university';
    parentCode?: string;
    population?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  description?: string;
  capacity?: number;
  contact?: {
    manager: string;
    phone: string;
  };
  facilities?: string[];
  status?: 'active' | 'inactive' | 'closed';
  createdAt?: string;
  updatedAt?: string;
}

// Moved from src/dtos/entities/WorkspaceDTO.ts (reconciled)
export interface CreateWorkspaceRequestDTO {
  workspaceId: string;
  workspaceCode: string;
  name: string;
  location: {
    code: string;
    name: string;
    nameAr: string;
    type: 'region' | 'city' | 'port' | 'university';
    parentCode?: string;
    population?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  description?: string;
  capacity?: number;
  contact?: {
    manager: string;
    phone: string;
  };
  facilities?: string[];
  status?: 'active' | 'inactive' | 'closed';
}

// Moved from src/dtos/entities/WorkspaceDTO.ts (reconciled)
export interface UpdateWorkspaceRequestDTO {
  workspaceId?: string;
  workspaceCode?: string;
  name?: string;
  location?: {
    code: string;
    name: string;
    nameAr: string;
    type: 'region' | 'city' | 'port' | 'university';
    parentCode?: string;
    population?: number;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  description?: string;
  capacity?: number;
  contact?: {
    manager: string;
    phone: string;
  };
  facilities?: string[];
  status?: 'active' | 'inactive' | 'closed';
}

// Moved from src/dtos/workflows/PhaseWorkflowDTO.ts (reconciled)
export interface PhaseTaskStatsDTO {
  phaseId: string;
  phaseName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  completionRate: number;
  averageProgress: number;
}

// Moved from src/dtos/workflows/ProjectWorkflowDTOs.ts (reconciled)
export interface ProjectWorkflowData {
  projectId?: string;
  currentStep: number;
  isDraft: boolean;
  isComplete: boolean;
  projectData: ProjectDTO;
  relatedData?: StepRelatedDataDTO;
  metadata: WorkflowMetadataDTO;
}

// Moved from src/dtos/workflows/ProjectWorkflowDTOs.ts (reconciled)
export interface WorkflowMetadataDTO {
  lastSavedAt: string;
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  stepName?: string;
}

// Moved from src/dtos/workflows/ProjectWorkflowDTOs.ts (reconciled)
export interface WorkflowTransition {
  fromStep: string;
  toStep: string;
  condition: string;
  action?: string;
}

// Moved from src/dtos/workflows/ProjectWorkflowDTOs.ts (reconciled)
export interface WorkflowState {
  currentStep: string;
  completedSteps: string[];
  availableTransitions: WorkflowTransition[];
  validation: ValidationResult;
}

// Moved from src/dtos/workflows/ProjectWorkflowDTOs.ts (reconciled)
export interface WorkflowSessionDTO {
  sessionId: string;
  workflowId: string;
  templateId: string;
  userId?: string;
  startTime: string;
  lastActivityTime: string;
  currentState: WorkflowState;
  completedSteps: string[];
  skippedSteps: string[];
  auditLog: WorkflowAuditLogDTO[];
  metrics: WorkflowMetricsDTO;
  isActive: boolean;
  expiresAt?: string;
}

// Moved from src/dtos/workflows/ProjectWorkflowDTOs.ts (reconciled)
export interface WorkflowAuditLogDTO {
  id: string;
  workflowId: string;
  action: 'stepCompleted' | 'stepSkipped' | 'dataSaved' | 'workflowCompleted' | 'errorOccurred';
  stepNumber?: number;
  details: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
}

// Moved from src/dtos/workflows/ProjectWorkflowDTOs.ts (reconciled)
export interface WorkflowMetricsDTO {
  totalSteps: number;
  completedSteps: number;
  averageTimePerStep: number; // in minutes
  totalElapsedTime: number; // in minutes
  validationErrors: number;
  saveOperations: number;
  userInteractions: number;
  completionRate: number;
  abandonmentRate?: number;
}
