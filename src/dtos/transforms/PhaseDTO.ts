/**
 * Phase DTOs
 * Data transfer objects for API/UI exchanges
 * NOT domain entities - just data structures
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
  projectId: string;
  phaseName: string;
  phaseType: 'preparation' | 'execution' | 'completion' | 'validation';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed';
  progress: number;
  startDate?: string;
  endDate?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  budget?: number;
  actualCost?: number;
  steps?: PhaseStepDTO[];
  resources?: PhaseResourcesDTO;
  milestones?: string[]; // Milestone IDs only for DTO
  materials?: string[]; // Material IDs only for DTO
  inspections?: string[]; // Inspection IDs only for DTO
  documents?: string[]; // Document IDs only for DTO
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePhaseRequestDTO {
  projectId: string;
  phaseName: string;
  phaseType: 'preparation' | 'execution' | 'completion' | 'validation';
  estimatedDuration?: number;
  budget?: number;
  steps?: PhaseStepDTO[];
}

export interface UpdatePhaseRequestDTO {
  phaseName?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed';
  progress?: number;
  startDate?: string;
  endDate?: string;
  actualDuration?: number;
  actualCost?: number;
  steps?: PhaseStepDTO[];
}
