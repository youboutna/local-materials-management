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
  estimated_duration_days?: number;
  actual_duration_days?: number;
  start_date?: string;
  end_date?: string;
  assigned_to?: string[];
  dependencies?: string[];
  weight?: number;
  order_index: number;
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
  estimated_duration_days?: number;
  actual_duration_days?: number;
  start_date?: string;
  end_date?: string;
  order_index: number;
  tasks: PhaseTaskDTO[];
}

/**
 * Project phase with nested steps and tasks
 * Maps to project_phases table with custom_phase_data
 */
export interface PhaseDTO {
  id: string;
  project_id: string;
  phase_name: string;
  construction_phase?: string;
  construction_stage?: string;
  description?: string;
  status: PhaseStatus;
  progress: number;
  estimated_cost?: number;
  actual_cost?: number;
  estimated_duration_days?: number;
  actual_duration_days?: number;
  start_date?: string;
  end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  order_index: number;
  dependencies?: string[];
  steps: PhaseStepDTO[];
  created_at: string;
  updated_at: string;
}

/**
 * Summary DTO for phase list views (without nested data)
 */
export interface PhaseSummaryDTO {
  id: string;
  project_id: string;
  phase_name: string;
  status: PhaseStatus;
  progress: number;
  steps_count: number;
  tasks_count: number;
  completed_tasks: number;
  start_date?: string;
  end_date?: string;
  order_index: number;
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
