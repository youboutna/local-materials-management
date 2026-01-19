/**
 * Task Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO, ContactInfoDTO } from '../shared';

export interface TaskDTO extends BaseEntityDTO {
  title: string;
  description: string;
  assignedTo: string[];
  status: 'not_started' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  startDate: string;
  endDate: string;
  estimatedDuration: number;
  actualDuration?: number;
  costEstimate: number;
  actualCost?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  projectId?: string;
  phaseId?: string;
  assigneeName?: string;
  projectTitle?: string;
  dueDate?: string;
  completedAt?: string;
}

export interface TaskAssignmentDTO extends BaseEntityDTO {
  title: string;
  description?: string;
  assignedTo?: string;
  assignedBy?: string;
  status: string;
  priority: string;
  dueDate?: string;
  completionDate?: string;
  notes?: string;
  projectId: string;
}

export interface TaskSummaryDTO {
  id: string;
  title: string;
  status: string;
  progress: number;
  assigneeName?: string;
  dueDate?: string;
  isOverdue: boolean;
  daysOverdue?: number;
  priority: string;
}

export interface TaskDetailsDTO extends TaskDTO {
  assigneeDetails?: ContactInfoDTO;
  projectDetails?: {
    id: string;
    title: string;
    status: string;
  };
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

export interface CreateTaskDTO extends Omit<TaskDTO, 'id' | 'createdAt' | 'updatedAt'> {}

export interface UpdateTaskDTO extends Partial<CreateTaskDTO> {}

export interface TaskFilterDTO {
  projectId?: string;
  assignedTo?: string;
  status?: string;
  priority?: string;
  dueDateRange?: {
    start: string;
    end: string;
  };
  searchQuery?: string;
}
