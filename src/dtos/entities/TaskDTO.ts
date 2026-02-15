/**

 * Task Data Transfer Objects

 * Centralized and standardized for hexagonal architecture

 * Following clean code principles: camelCase only, no business logic

 */



import { BaseEntityDTO } from '../shared';



/**

 * Task status enumeration

 * Current state of task execution

 */

export enum TaskStatus {

  NOT_STARTED = 'not_started',

  IN_PROGRESS = 'in_progress',

  COMPLETED = 'completed',

  DELAYED = 'delayed',

  BLOCKED = 'blocked',

  CANCELLED = 'cancelled'

}



/**

 * Task priority enumeration

 * Priority levels for task execution

 */

export enum TaskPriority {

  LOW = 'low',

  MEDIUM = 'medium',

  HIGH = 'high',

  URGENT = 'urgent'

}



/**

 * Task type enumeration

 * Classification of task types

 */

export enum TaskType {

  DEVELOPMENT = 'development',

  DESIGN = 'design',

  TESTING = 'testing',

  DOCUMENTATION = 'documentation',

  REVIEW = 'review',

  DEPLOYMENT = 'deployment',

  MAINTENANCE = 'maintenance',

  RESEARCH = 'research'

}



/**

 * Main Task DTO

 * Core task data structure

 */

export interface TaskDTO extends BaseEntityDTO {

  // Core identification

  id: string;

  title: string;

  description?: string;

  

  // Classification

  type: TaskType;

  status: TaskStatus;

  priority: TaskPriority;

  

  // Progress tracking

  progress: number; // 0-100

  completionPercentage?: number;

  

  // Assignment

  assignedTo?: string[]; // Employee IDs only for DTO

  assigneeType?: 'individual' | 'team' | 'role';

  

  // Timeline

  startDate?: string;

  endDate?: string;

  dueDate?: string;

  completedAt?: string;

  estimatedDuration?: number; // in days

  actualDuration?: number; // in days

  

  // Dependencies

  dependsOn?: string[]; // Task IDs only for DTO

  blocks?: string[]; // Task IDs only for DTO

  

  // Financial

  estimatedCost?: number;

  actualCost?: number;

  budget?: number;

  

  // Relationships

  projectId?: string;

  phaseId?: string;

  milestoneId?: string;

  

  // Resources

  requiredSkills?: string[];

  providedResources?: string[]; // Resource IDs only for DTO

  attachments?: string[]; // Document IDs only for DTO

  

  // Quality and approval

  qualityRating?: number; // 1-5

  approvalStatus?: 'pending' | 'approved' | 'rejected';

  approvedBy?: string; // Employee ID only for DTO

  approvedAt?: string;

  

  // Form data fields (merged from TaskFormDataDTO)

  checklist?: string[];

  subtasks?: {

    id?: string;

    title: string;

    completed: boolean;

    assignedTo?: string;

  }[];

  tags?: string[];

  notes?: string;

  

  // Metadata

  assigneeName?: string;

  projectTitle?: string;

  phaseName?: string;

  milestoneTitle?: string;

  

  // System fields

  createdAt: string;

  updatedAt: string;



  // NEW: Additional database fields from task_assignments table

  assignedBy?: string;            // assigned_by

  assigneeEmail?: string;         // assignee_email

  completionToken?: string;       // completion_token

  completionUrl?: string;         // completion_url

  criticalPath?: boolean;         // critical_path

  mostLikelyEstimate?: number;    // most_likely_estimate

  optimisticEstimate?: number;    // optimistic_estimate

  pessimisticEstimate?: number;   // pessimistic_estimate

  weight?: number;                // weight

}





/**

 * Task creation request interface

 * Input for creating new tasks

 */

export interface CreateTaskDTO {

  title: string;

  description?: string;

  type: TaskType;

  priority?: TaskPriority;

  projectId?: string;

  phaseId?: string;

  milestoneId?: string;

  assignedTo?: string[]; // Employee IDs only for DTO

  assigneeType?: 'individual' | 'team' | 'role';

  startDate?: string;

  endDate?: string;

  dueDate?: string;

  estimatedDuration?: number;

  estimatedCost?: number;

  budget?: number;

  dependsOn?: string[]; // Task IDs only for DTO

  requiredSkills?: string[];

  providedResources?: string[]; // Resource IDs only for DTO

  attachments?: string[]; // Document IDs only for DTO

  tags?: string[];

  notes?: string;

}



/**

 * Task update request interface

 * Input for updating existing tasks

 */

export interface UpdateTaskDTO {

  title?: string;

  description?: string;

  type?: TaskType;

  status?: TaskStatus;

  priority?: TaskPriority;

  assignedTo?: string[]; // Employee IDs only for DTO

  assigneeType?: 'individual' | 'team' | 'role';

  progress?: number;

  endDate?: string;

  dueDate?: string;

  completedAt?: string;

  actualDuration?: number;

  actualCost?: number;

  dependsOn?: string[]; // Task IDs only for DTO

  blocks?: string[]; // Task IDs only for DTO

  requiredSkills?: string[];

  providedResources?: string[]; // Resource IDs only for DTO

  attachments?: string[]; // Document IDs only for DTO

  qualityRating?: number;

  approvedBy?: string; // Employee ID only for DTO

  approvedAt?: string;

  reviewNotes?: string;

  tags?: string[];

  notes?: string;

  

  // Metadata

  updatedBy?: string;

  changeReason?: string;

}



/**

 * Task summary interface

 * Lightweight task representation for lists

 */

export interface TaskSummaryDTO extends BaseEntityDTO {

  id: string;

  title: string;

  type: TaskType;

  status: TaskStatus;

  priority: TaskPriority;

  progress: number;

  projectId?: string;

  phaseId?: string;

  assignedTo?: string[]; // Employee IDs only for DTO

  dueDate?: string;

  isOverdue?: boolean;

  assigneeNames?: string[];

  projectTitle?: string;

  phaseName?: string;

  estimatedCost?: number;

  actualCost?: number;

}



/**

 * Task statistics interface

 * Performance metrics for task management

 */

export interface TaskStatisticsDTO {

  totalTasks: number;

  activeTasks: number;

  completedTasks: number;

  delayedTasks: number;

  blockedTasks: number;

  averageCompletionTime?: number;

  averageCost?: number;

  completionRate: number;

  overdueRate: number;

  byStatus: Record<TaskStatus, number>;

  byPriority: Record<TaskPriority, number>;

  byType: Record<TaskType, number>;

  lastUpdated?: string;

}



/**

 * Task dependency interface

 * Dependency relationships between tasks

 */

export interface TaskDependencyDTO {

  id: string;

  fromTaskId: string;

  toTaskId: string;

  dependencyType: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';

  description?: string;

  isBlocking?: boolean;

  lagDays?: number;

  createdById?: string;

  createdAt?: string;

}



/**

 * Task time tracking interface

 * Time tracking data for tasks

 */

export interface TaskTimeTrackingDTO {

  taskId: string;

  employeeId: string; // Employee ID only for DTO

  startTime: string;

  endTime?: string;

  duration?: number; // in hours

  description?: string;

  isBillable?: boolean;

  hourlyRate?: number;

  totalCost?: number;

  date: string;

}



/**

 * Task filter interface

 * Filter criteria for task queries

 */

export interface TaskFilterDTO {

  projectId?: string;

  phaseId?: string;

  assignedTo?: string;

  status?: TaskStatus;

  priority?: TaskPriority;

  type?: TaskType;

  dueDateRange?: {

    startDate?: string;

    endDate?: string;

  };

  searchQuery?: string;

  tags?: string[];

  isOverdue?: boolean;

}



/**

 * Task details interface

 * Extended task information with relationships

 */

export interface TaskDetailsDTO extends Omit<TaskDTO, 'attachments' | 'subtasks'> {

  // Extended relationships

  assigneeDetails?: Array<{

    id: string;

    name: string;

    email?: string;

    avatar?: string;

  }>;

  projectDetails?: {

    id: string;

    title: string;

    status: string;

  };

  phaseDetails?: {

    id: string;

    name: string;

    status: string;

  };

  

  // Extended data

  subtasks?: TaskDTO[];

  dependencies?: TaskDTO[];

  attachments?: Array<{

    id: string;

    name: string;

    url: string;

    type: string;

    uploadedAt: string;

  }>;

  comments?: Array<{

    id: string;

    content: string;

    author: string;

    createdAt: string;

  }>;

  timeTracking?: Array<{

    date: string;

    hours: number;

    description?: string;

  }>;

}

