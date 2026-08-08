// Phase DTOs for project workflow phases, steps, and tasks
// These map to project_phases table with custom_phase_data JSON column

export type PhaseStatus = 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

/**
 * Task within a workflow step (from referential)
 *Distinct from TaskAssignmentDTO which represents assigned tasks (task_assignments table)
 */
export interface PhaseTaskDTO {
  id: string;
  name: string;
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

/**
 * Step within a phase (from referential)
 */
export interface PhaseStepDTO {
  id: string;
  name: string;
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
 * Project phase with nested steps and tasks
 * Maps to project_phases table with custom_phase_data
 */
export interface PhaseDTO {
  id: string;
  projectId: string;
  phaseName: string;
  constructionPhase?: string;
  constructionStage?: string;
  description?: string;
  status: PhaseStatus;
  progress: number;
  estimatedCost?: number;
  actualCost?: number;
  estimatedDurationDays?: number;
  actualDurationDays?: number;
  startDate?: string;
  endDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  orderIndex: number;
  dependencies?: string[];
  steps: PhaseStepDTO[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Summary DTO for phase list views (without nested data)
 */
export interface PhaseSummaryDTO {
  id: string;
  projectId: string;
  phaseName: string;
  status: PhaseStatus;
  progress: number;
  stepsCount: number;
  tasksCount: number;
  completedTasks: number;
  startDate?: string;
  endDate?: string;
  orderIndex: number;
}

/**
 * Form data for creating/updating phases
 */
export interface PhaseFormDTO {
  phaseName: string;
  description?: string;
  constructionPhase?: string;
  constructionStage?: string;
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
