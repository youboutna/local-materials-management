/**
 * Phase Workflow Data Transfer Objects
 * Centralized workflow-specific DTOs for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 * 
 * ✅ Évite les dépendances cycliques en utilisant TaskAssignmentDTO
 * ✅ Utilise les DTOs de l'architecture hexagonale
 * ✅ Pas d'imports croisés entre DTOs
 */

import { BaseEntityDTO } from '../shared';
import { PhaseDTO } from '../entities/PhaseDTO';
import { TaskAssignmentDTO } from '../entities/TaskAssignmentDTO';

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
 * Utilise TaskAssignmentDTO pour les tâches
 */
export interface PhaseWorkflowDTO extends BaseEntityDTO {
  // Form data integration
  formData?: {
    id: string;
    title: string;
    description?: string;
    status?: string;
    projectId?: string;
  };
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
  
  // Tasks - Utilise TaskAssignmentDTO
  tasks: TaskAssignmentDTO[];
  
  // Dependencies - IDs des tâches
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
 * Utilise TaskAssignmentDTO pour les tâches
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
  
  // Tasks - Utilise TaskAssignmentDTO
  tasks?: {
    name: string;
    description?: string;
    estimatedDuration?: number;
    dependencies?: string[];
    priority?: string;
    assigneeId?: string;
  }[];
  
  // Metadata
  createdBy?: string;
}

/**
 * Phase update request interface
 * Input for updating existing phases
 * Utilise TaskAssignmentDTO pour les tâches
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
  
  // Tasks - Utilise TaskAssignmentDTO
  tasks?: {
    id?: string;
    name?: string;
    description?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'delayed';
    progress?: number;
    assigneeId?: string;
    priority?: string;
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
  
  // Statistiques des tâches
  totalTasks?: number;
  completedTasks?: number;
  tasksCompletionRate?: number;
  overdueTasks?: number;
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
  
  // Tâche associée
  taskId?: string;
}

/**
 * Phase task statistics interface
 * Statistiques des tâches par phase
 */
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

/**
 * Phase progress DTO
 * Suivi de l'avancement d'une phase
 */
export interface PhaseProgressDTO {
  phaseId: string;
  phaseName: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed' | 'blocked';
  startDate?: string;
  endDate?: string;
  remainingDays?: number;
  totalTasks: number;
  completedTasks: number;
  tasksCompletionRate: number;
  lastUpdated: string;
}

/**
 * Phase timeline event DTO
 * Événements de la timeline d'une phase
 */
export interface PhaseTimelineEventDTO {
  id: string;
  phaseId: string;
  eventType: 'task_created' | 'task_completed' | 'task_blocked' | 'phase_started' | 'phase_completed' | 'milestone_reached';
  title: string;
  description?: string;
  date: string;
  userId?: string;
  userName?: string;
  metadata?: Record<string, unknown>;
}