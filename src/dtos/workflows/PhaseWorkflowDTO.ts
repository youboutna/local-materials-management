/**
 * Phase Workflow Data Transfer Objects
 * Centralized workflow-specific DTOs for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 */

import { BaseEntityDTO } from '../shared';
import { ProjectDTO } from '../entities/ProjectDTO';
import { TaskDTO } from '../entities/TaskDTO';
import { PhaseDTO } from '../entities/PhaseDTO';

/**
 * Phase step enumeration
 * Defines the sequential steps in phase workflow
 */
export enum PhaseWorkflowStep {
  PLANNING = 'planning',
  EXECUTION = 'execution',
  REVIEW = 'review',
  COMPLETION = 'completion'
}

/**
 * Phase step interface
 * Individual step within a phase workflow
 */
export interface PhaseStepDTO {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed';
  progress: number;
  orderIndex: number;
  assignedTo?: string[]; // Task/Employee IDs only for DTO
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
  
  // Step metadata
  estimatedCost?: number;
  actualCost?: number;
  completionCriteria?: string[];
  deliverables?: string[];
}

/**
 * Phase resources interface
 * Resource allocation for phase execution
 */
export interface PhaseResourcesDTO {
  employees: string[]; // Employee IDs only for DTO
  contractors: string[]; // Supplier IDs only for DTO
  totalRequired: number;
  totalAssigned: number;
  skills: string[];
}

/**
 * Phase workflow interface
 * Complete workflow state for phase operations
 */
export interface PhaseWorkflowDTO extends BaseEntityDTO {
  // Form data integration
  formData?: ProjectDTO;
  phaseId: string;
  workflowType: string;
  
  // Workflow metadata
  currentStep: PhaseWorkflowStep;
  status: 'draft' | 'in_progress' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  
  // Progress tracking
  totalSteps: number;
  completedSteps: number;
  progressPercentage: number;
  
  // Phase data
  phase?: PhaseDTO;
  
  // Workflow steps
  steps: PhaseStepDTO[];
  
  // Resources
  resources: PhaseResourcesDTO;
  
  // Tasks
  tasks: TaskDTO[];
  
  // Dependencies
  dependencies?: string[]; // Task IDs only for DTO
  materials?: string[]; // Material IDs only for DTO
  documents?: string[]; // Document IDs only for DTO
  inspections?: string[]; // Inspection IDs only for DTO
  
  // Workflow-specific fields
  originalData?: Record<string, unknown>;
  modifiedFields?: string[];
  changeReason?: string;
  
  // Approval workflow
  approverId?: string;
  approvedAt?: string;
  approvalComments?: string;
  
  // Validation
  validationErrors?: string[];
  validationWarnings?: string[];
  
  // Metadata
  createdBy?: string;
  updatedBy?: string;
  version?: number;
}

/**
 * Phase creation request interface
 * Input for creating new phases
 */
export interface CreatePhaseRequestDTO {
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  projectId: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  estimatedCost?: number;
  
  // Resources
  resources: {
    employees?: string[];
    contractors?: string[];
    skills?: string[];
  };
  
  // Tasks
  tasks?: {
    name: string;
    description?: string;
    estimatedDuration?: number;
    dependencies?: string[];
  }[];
  
  // Metadata
  createdBy?: string;
}

/**
 * Phase update request interface
 * Input for updating existing phases
 */
export interface UpdatePhaseRequestDTO {
  name?: string;
  description?: string;
  status?: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  endDate?: string;
  progress?: number;
  actualCost?: number;
  
  // Resources
  resources?: {
    employees?: string[];
    contractors?: string[];
    skills?: string[];
  };
  
  // Tasks
  tasks?: {
    name?: string;
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed';
    progress?: number;
  }[];
  
  // Metadata
  updatedBy?: string;
  changeReason?: string;
}

/**
 * Phase statistics interface
 * Performance metrics for phase operations
 */
export interface PhaseStatisticsDTO {
  phaseId: string;
  totalPhases: number;
  activePhases: number;
  completedPhases: number;
  averageCompletionTime?: number;
  successRate: number;
  lastUpdated?: string;
}

/**
 * Phase notification interface
 * Notifications for phase events
 */
export interface PhaseNotificationDTO extends BaseEntityDTO {
  phaseId: string;
  type: 'phaseCreated' | 'phaseStarted' | 'phaseCompleted' | 'phaseDelayed' | 'phaseCancelled';
  title: string;
  message: string;
  isRead: boolean;
  actionRequired?: boolean;
  actionUrl?: string;
  scheduledFor?: string;
}
