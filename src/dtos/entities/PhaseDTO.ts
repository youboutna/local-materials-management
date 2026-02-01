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
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed';
  progress: number;
  orderIndex: number;
  tasks: PhaseTaskDTO[];
  estimatedDurationDays?: number;
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
  startDate?: string;
  endDate?: string;
  inspections?: string[]; // IDs only for DTO
  documents?: string[]; // IDs only for DTO
}

export interface PhaseTaskDTO {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed';
  progress: number;
  orderIndex: number;
  assignedTo?: string[]; // Employee IDs only for DTO
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
  estimatedDurationDays?: number;
  actualDurationDays?: number;
  startDate?: string;
  endDate?: string;
  dependencies?: string[]; // Task IDs only for DTO
  materials?: string[]; // Material IDs only for DTO
  documents?: string[]; // Document IDs only for DTO
  inspections?: string[]; // Inspection IDs only for DTO
}

export interface PhaseResourcesDTO {
  employees: string[]; // Employee IDs only for DTO
  contractors: string[]; // Supplier IDs only for DTO
  totalRequired: number;
  totalAssigned: number;
  skills: string[];
}

export interface PhaseDTO {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  projectId: string;
  startDate?: string;
  endDate?: string;
  progress: number;
  budget?: number;
  actualCost?: number;
  steps: PhaseStepDTO[];
  resources: PhaseResourcesDTO;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePhaseDTO {
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  projectId: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
}

export interface UpdatePhaseDTO {
  name?: string;
  description?: string;
  status?: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  startDate?: string;
  endDate?: string;
  progress?: number;
  budget?: number;
  actualCost?: number;
}

// Legacy compatibility types from transforms
export interface PhaseStepDTO {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed';
  progress: number;
  orderIndex: number;
  tasks: PhaseTaskDTO[];
  estimatedDurationDays?: number;
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
  startDate?: string;
  endDate?: string;
  inspections?: string[]; // IDs only for DTO
  documents?: string[]; // IDs only for DTO
}

export interface PhaseTaskDTO {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed';
  progress: number;
  orderIndex: number;
  assignedTo?: string[]; // Employee IDs only for DTO
  requiresInspection?: boolean;
  requiresEngineerApproval?: boolean;
  estimatedDurationDays?: number;
  actualDurationDays?: number;
  startDate?: string;
  endDate?: string;
  dependencies?: string[]; // Task IDs only for DTO
  materials?: string[]; // Material IDs only for DTO
  documents?: string[]; // Document IDs only for DTO
  inspections?: string[]; // Inspection IDs only for DTO
}

export interface PhaseResourcesDTO {
  employees: string[]; // Employee IDs only for DTO
  contractors: string[]; // Supplier IDs only for DTO
  totalRequired: number;
  totalAssigned: number;
  skills: string[];
}

// Legacy PhaseDTO with snake_case for backward compatibility
export interface PhaseDTOLegacy {
  id: string;
  project_id: string;
  phase_name: string;
  phase_type: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  progress?: number;
  budget?: number;
  actual_cost?: number;
  construction_phase?: string;
  construction_stage?: string;
  created_at: string;
  updated_at: string;
}
