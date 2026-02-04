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
  estimatedCost?: number;
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
