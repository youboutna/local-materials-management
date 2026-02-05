/**
 * Task Assignment Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 */

import { BaseEntityDTO } from '../shared';

/**
 * Task assignment status enumeration
 * Current state of task assignment
 */
export enum TaskAssignmentStatus {
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Task assignment priority enumeration
 * Priority levels for task assignments
 */
export enum TaskAssignmentPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Task assignment type enumeration
 * Type of assignment relationship
 */
export enum TaskAssignmentType {
  INDIVIDUAL = 'individual',
  TEAM = 'team',
  REVIEWER = 'reviewer',
  APPROVER = 'approver',
  CONSULTANT = 'consultant'
}

/**
 * Main Task Assignment DTO
 * Core task assignment data structure
 */
export interface TaskAssignmentDTO extends BaseEntityDTO {
  // Core identification
  id: string;
  taskId: string;
  projectId: string;
  
  // Assignment details
  assignedTo: string; // Employee ID only for DTO
  assignedBy: string; // Employee ID only for DTO
  assigneeType: TaskAssignmentType;
  
  // Task information
  title: string;
  description?: string;
  
  // Status and priority
  status: TaskAssignmentStatus;
  priority: TaskAssignmentPriority;
  
  // Timeline
  assignedAt: string;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  
  // Progress tracking
  progress: number; // 0-100
  completionPercentage?: number;
  
  // Assignment metadata
  assignmentNotes?: string;
  acceptanceNotes?: string;
  rejectionReason?: string;
  
  // Dependencies
  dependsOn?: string[]; // Task assignment IDs only for DTO
  blocks?: string[]; // Task assignment IDs only for DTO
  
  // Resources
  requiredSkills?: string[];
  providedResources?: string[]; // Resource IDs only for DTO
  
  // Quality and approval
  qualityRating?: number; // 1-5
  approvedBy?: string; // Employee ID only for DTO
  approvedAt?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Task assignment creation request interface
 * Input for creating new task assignments
 */
export interface CreateTaskAssignmentDTO {
  taskId: string;
  projectId: string;
  assignedTo: string; // Employee ID only for DTO
  assignedBy: string; // Employee ID only for DTO
  assigneeType: TaskAssignmentType;
  title: string;
  description?: string;
  priority?: TaskAssignmentPriority;
  dueDate?: string;
  estimatedHours?: number;
  assignmentNotes?: string;
  dependsOn?: string[]; // Task assignment IDs only for DTO
  requiredSkills?: string[];
  providedResources?: string[]; // Resource IDs only for DTO
}

/**
 * Task assignment update request interface
 * Input for updating existing task assignments
 */
export interface UpdateTaskAssignmentDTO {
  status?: TaskAssignmentStatus;
  priority?: TaskAssignmentPriority;
  dueDate?: string;
  progress?: number;
  actualHours?: number;
  completionPercentage?: number;
  assignmentNotes?: string;
  acceptanceNotes?: string;
  rejectionReason?: string;
  dependsOn?: string[]; // Task assignment IDs only for DTO
  blocks?: string[]; // Task assignment IDs only for DTO
  providedResources?: string[]; // Resource IDs only for DTO
  qualityRating?: number;
  
  // Metadata
  updatedBy?: string;
  changeReason?: string;
}

/**
 * Task assignment summary interface
 * Lightweight task assignment representation for lists
 */
export interface TaskAssignmentSummaryDTO extends BaseEntityDTO {
  id: string;
  taskId: string;
  projectId: string;
  assignedTo: string; // Employee ID only for DTO
  assignedBy: string; // Employee ID only for DTO
  title: string;
  status: TaskAssignmentStatus;
  priority: TaskAssignmentPriority;
  progress: number;
  dueDate?: string;
  isOverdue?: boolean;
  assigneeName?: string;
  projectName?: string;
  taskTitle?: string;
}

/**
 * Task assignment statistics interface
 * Performance metrics for task assignments
 */
export interface TaskAssignmentStatisticsDTO {
  totalAssignments: number;
  activeAssignments: number;
  completedAssignments: number;
  overdueAssignments: number;
  averageCompletionTime?: number;
  averageQualityRating?: number;
  completionRate: number;
  overdueRate: number;
  lastUpdated?: string;
}

/**
 * Task assignment workload interface
 * Workload distribution data
 */
export interface TaskAssignmentWorkloadDTO {
  employeeId: string;
  employeeName?: string;
  totalAssignments: number;
  activeAssignments: number;
  totalEstimatedHours: number;
  totalActualHours: number;
  workloadPercentage: number;
  averageProgress: number;
  overdueCount: number;
  upcomingDeadlines: number;
  skillsUtilization?: Record<string, number>;
}

/**
 * Task assignment filters interface
 * Filter criteria for task assignment queries
 */
export interface TaskAssignmentFiltersDTO {
  projectId?: string;
  assignedTo?: string;
  assignedBy?: string;
  status?: TaskAssignmentStatus;
  priority?: TaskAssignmentPriority;
  assigneeType?: TaskAssignmentType;
  dueDateRange?: {
    startDate?: string;
    endDate?: string;
  };
  skills?: string[];
  isOverdue?: boolean;
}

/**
 * Task assignment request interfaces
 * Input interfaces for various operations
 */
export interface CreateTaskAssignmentWithAssignerRequestDTO {
  taskData: CreateTaskAssignmentDTO;
  assignedBy?: string;
}

export interface GetTaskAssignmentByIdRequestDTO {
  id: string;
}

export interface UpdateTaskAssignmentWithIdRequestDTO {
  id: string;
  updates: UpdateTaskAssignmentDTO;
}

export interface DeleteTaskAssignmentRequestDTO {
  id: string;
}

export interface GetTaskAssignmentsWithFiltersRequestDTO {
  filters?: TaskAssignmentFiltersDTO;
}

export interface GetTaskAssignmentsByProjectRequestDTO {
  projectId: string;
}

export interface GetTaskAssignmentsAssignedToRequestDTO {
  userId: string;
}

export interface GetTaskAssignmentsAssignedByRequestDTO {
  userId: string;
}

export interface GetTaskAssignmentsDueSoonRequestDTO {
  days?: number;
}

export interface SearchTaskAssignmentsRequestDTO {
  searchTerm: string;
}

export interface GetTaskAssignmentsByStatusRequestDTO {
  status: TaskAssignmentStatus;
}

export interface GetTaskAssignmentsByPriorityRequestDTO {
  priority: TaskAssignmentPriority;
}

export interface GetTaskAssignmentsByAssigneeTypeRequestDTO {
  assigneeType: TaskAssignmentType;
}

/**
 * Task assignment statistics interface
 * Aggregated statistics for task assignments
 */
export interface TaskAssignmentStatsDTO {
  total: number;
  byStatus: Record<TaskAssignmentStatus, number>;
  byPriority: Record<TaskAssignmentPriority, number>;
  byAssigneeType: Record<TaskAssignmentType, number>;
  overdue: number;
  dueSoon: number;
}

/**
 * Task assignment validation result interface
 * Validation results for task assignments
 */
export interface TaskAssignmentValidationResultDTO {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}
