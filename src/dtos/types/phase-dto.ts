// Phase DTOs for project workflow phases, steps, and tasks
// These map to project_phases table with custom_phase_data JSON column
//
// Canonical definitions now live in src/dtos/entities/PhaseDTO.ts (R014).
// This module is kept as a compatibility re-export.
import type { PhaseTaskDTO, PhaseStepDTO, PhaseDTO, PhaseStatusValue } from '../entities/PhaseDTO';

export type PhaseStatus = PhaseStatusValue;
export type { PhaseTaskDTO, PhaseStepDTO, PhaseDTO };

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
