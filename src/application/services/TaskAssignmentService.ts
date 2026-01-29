/**
 * Task Assignment Service - Hexagonal Architecture
 * Business logic for managing task assignments
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { ITaskAssignmentRepository } from '@/domain/repositories/ITaskAssignmentRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { TaskAssignment as WorkspaceTaskAssignment } from '@/domain/entities/Workspace';

export interface TaskAssignment {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  assignedTo?: string;
  assignedBy?: string;
  assigneeType?: 'employee' | 'supplier';
  assigneeEmail?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskAssignmentDTO {
  id: string;
  title: string;
  description?: string;
  project_id?: string;
  assigned_to?: string;
  assigned_by?: string;
  assignee_type?: string;
  status: string;
  priority: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskAssignmentRequestDto {
  title: string;
  description?: string;
  project_id?: string;
  assigned_to?: string;
  assigned_by?: string;
  assignee_type?: string;
  priority?: string;
  due_date?: string;
}

export interface UpdateTaskAssignmentRequestDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
}

export interface TaskAssignmentFilters {
  projectId?: string;
  assignedTo?: string;
  assignedBy?: string;
  status?: string;
  priority?: string;
  assigneeType?: string;
}

// Service DTOs for data exchange
export interface CreateTaskAssignmentWithAssignerRequestDto {
  taskData: CreateTaskAssignmentRequestDto;
  assignedBy?: string;
}

export interface GetTaskAssignmentByIdRequestDto {
  id: string;
}

export interface UpdateTaskAssignmentWithIdRequestDto {
  id: string;
  updates: UpdateTaskAssignmentRequestDto;
}

export interface DeleteTaskAssignmentRequestDto {
  id: string;
}

export interface GetTaskAssignmentsWithFiltersRequestDto {
  filters?: TaskAssignmentFilters;
}

export interface GetTaskAssignmentsByProjectRequestDto {
  projectId: string;
}

export interface GetTaskAssignmentsAssignedToRequestDto {
  userId: string;
}

export interface GetTaskAssignmentsAssignedByRequestDto {
  userId: string;
}

export interface GetTaskAssignmentsDueSoonRequestDto {
  days?: number;
}

export interface SearchTaskAssignmentsRequestDto {
  searchTerm: string;
}

export interface GetTaskAssignmentsByStatusRequestDto {
  status: string;
}

export interface GetTaskAssignmentsByPriorityRequestDto {
  priority: string;
}

export interface GetTaskAssignmentsByAssigneeTypeRequestDto {
  assigneeType: string;
}

export interface TaskAssignmentStatsDto {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byAssigneeType: Record<string, number>;
  overdue: number;
  dueSoon: number;
}

export interface TaskAssignmentValidationResultDto {
  isValid: boolean;
  errors: string[];
}

export class TaskAssignmentService {
  private taskAssignmentRepository: ITaskAssignmentRepository;

  constructor() {
    this.taskAssignmentRepository = RepositoryFactory.getTaskAssignmentRepository();
  }
  /**
   * Create a new task assignment
   */
  async createTaskAssignment(request: CreateTaskAssignmentWithAssignerRequestDto): Promise<TaskAssignmentDTO> {
    try {
      if (!request.taskData.title) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Title is required');
      }

      // For now, simulate creation as task assignment repository is not available
      // TODO: Implement proper task assignment creation when repository is available
      console.warn('TaskAssignmentService.createTaskAssignment: Task assignment repository not available');
      
      const now = new Date();
      const task: TaskAssignment = {
        id: crypto.randomUUID(),
        title: request.taskData.title,
        description: request.taskData.description,
        projectId: request.taskData.project_id,
        assignedTo: request.taskData.assigned_to,
        assignedBy: request.assignedBy || request.taskData.assigned_by,
        assigneeType: request.taskData.assignee_type as 'employee' | 'supplier',
        status: 'pending',
        priority: (request.taskData.priority as 'low' | 'medium' | 'high') || 'medium',
        dueDate: request.taskData.due_date ? new Date(request.taskData.due_date) : undefined,
        createdAt: now,
        updatedAt: now
      };

      return this.toDTO(task);
    } catch (error) {
      console.error('TaskAssignmentService.createTaskAssignment failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create task assignment');
    }
  }

  /**
   * Get a task assignment by ID
   */
  async getTaskAssignmentById(request: GetTaskAssignmentByIdRequestDto): Promise<TaskAssignmentDTO | null> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Task assignment ID is required');
      }

      // For now, return mock data as task assignment repository is not available
      // TODO: Implement proper task assignment retrieval when repository is available
      console.warn('TaskAssignmentService.getTaskAssignmentById: Task assignment repository not available');
      
      return null;
    } catch (error) {
      console.error('TaskAssignmentService.getTaskAssignmentById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get task assignment by ID');
    }
  }

  /**
   * Get all task assignments
   */
  async getAllTaskAssignments(): Promise<TaskAssignmentDTO[]> {
    try {
      // For now, return mock data as task assignment repository is not available
      // TODO: Implement proper task assignment retrieval when repository is available
      console.warn('TaskAssignmentService.getAllTaskAssignments: Task assignment repository not available');
      
      return [];
    } catch (error) {
      console.error('TaskAssignmentService.getAllTaskAssignments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all task assignments');
    }
  }

  /**
   * Update a task assignment
   */
  async updateTaskAssignment(request: UpdateTaskAssignmentWithIdRequestDto): Promise<TaskAssignmentDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Task assignment ID is required');
      }
      if (!request.updates || Object.keys(request.updates).length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Update data is required');
      }

      // For now, return mock data as task assignment repository is not available
      // TODO: Implement proper task assignment update when repository is available
      console.warn('TaskAssignmentService.updateTaskAssignment: Task assignment repository not available');
      
      const now = new Date();
      const mockTask: TaskAssignment = {
        id: request.id,
        title: request.updates.title || 'Updated Task',
        description: request.updates.description,
        status: (request.updates.status as TaskAssignment['status']) || 'pending',
        priority: (request.updates.priority as TaskAssignment['priority']) || 'medium',
        dueDate: request.updates.due_date ? new Date(request.updates.due_date) : undefined,
        completedAt: request.updates.status === 'completed' ? new Date() : undefined,
        createdAt: now,
        updatedAt: now,
        projectId: undefined,
        assignedTo: undefined,
        assignedBy: undefined,
        assigneeType: undefined,
        assigneeEmail: undefined
      };
      
      return this.toDTO(mockTask);
    } catch (error) {
      console.error('TaskAssignmentService.updateTaskAssignment failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update task assignment');
    }
  }

  /**
   * Delete a task assignment
   */
  async deleteTaskAssignment(request: DeleteTaskAssignmentRequestDto): Promise<void> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Task assignment ID is required');
      }

      // For now, simulate deletion as task assignment repository is not available
      // TODO: Implement proper task assignment deletion when repository is available
      console.warn('TaskAssignmentService.deleteTaskAssignment: Task assignment repository not available');
      console.log(`Deleting task assignment: ${request.id}`);
    } catch (error) {
      console.error('TaskAssignmentService.deleteTaskAssignment failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete task assignment');
    }
  }

  /**
   * Get task assignments with filters
   */
  async getTaskAssignments(request: GetTaskAssignmentsWithFiltersRequestDto): Promise<TaskAssignmentDTO[]> {
    try {
      // For now, return mock data as task assignment repository is not available
      // TODO: Implement proper task assignment retrieval with filters when repository is available
      console.warn('TaskAssignmentService.getTaskAssignments: Task assignment repository not available');
      
      return [];
    } catch (error) {
      console.error('TaskAssignmentService.getTaskAssignments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get task assignments');
    }
  }

  /**
   * Get task assignments by project
   */
  async getTaskAssignmentsByProject(request: GetTaskAssignmentsByProjectRequestDto): Promise<TaskAssignmentDTO[]> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      return await this.getTaskAssignments({ filters: { projectId: request.projectId } });
    } catch (error) {
      console.error('TaskAssignmentService.getTaskAssignmentsByProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get task assignments by project');
    }
  }

  /**
   * Get task assignments assigned to user
   */
  async getTaskAssignmentsAssignedTo(request: GetTaskAssignmentsAssignedToRequestDto): Promise<TaskAssignmentDTO[]> {
    try {
      if (!request.userId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'User ID is required');
      }

      return await this.getTaskAssignments({ filters: { assignedTo: request.userId } });
    } catch (error) {
      console.error('TaskAssignmentService.getTaskAssignmentsAssignedTo failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get task assignments assigned to user');
    }
  }

  /**
   * Get task assignments assigned by user
   */
  async getTaskAssignmentsAssignedBy(request: GetTaskAssignmentsAssignedByRequestDto): Promise<TaskAssignmentDTO[]> {
    try {
      if (!request.userId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'User ID is required');
      }

      return await this.getTaskAssignments({ filters: { assignedBy: request.userId } });
    } catch (error) {
      console.error('TaskAssignmentService.getTaskAssignmentsAssignedBy failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get task assignments assigned by user');
    }
  }

  /**
   * Get overdue task assignments
   */
  async getOverdueTaskAssignments(): Promise<TaskAssignmentDTO[]> {
    try {
      // For now, return mock data as task assignment repository is not available
      // TODO: Implement proper overdue task assignment retrieval when repository is available
      console.warn('TaskAssignmentService.getOverdueTaskAssignments: Task assignment repository not available');
      
      return [];
    } catch (error) {
      console.error('TaskAssignmentService.getOverdueTaskAssignments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get overdue task assignments');
    }
  }

  /**
   * Get task assignments due soon
   */
  async getTaskAssignmentsDueSoon(request: GetTaskAssignmentsDueSoonRequestDto): Promise<TaskAssignmentDTO[]> {
    try {
      const days = request.days || 3;
      
      // For now, return mock data as task assignment repository is not available
      // TODO: Implement proper due soon task assignment retrieval when repository is available
      console.warn('TaskAssignmentService.getTaskAssignmentsDueSoon: Task assignment repository not available');
      
      return [];
    } catch (error) {
      console.error('TaskAssignmentService.getTaskAssignmentsDueSoon failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get task assignments due soon');
    }
  }

  /**
   * Get task assignment statistics
   */
  async getTaskAssignmentStats(): Promise<TaskAssignmentStatsDto> {
    try {
      // For now, return mock data as task assignment repository is not available
      // TODO: Implement proper task assignment statistics when repository is available
      console.warn('TaskAssignmentService.getTaskAssignmentStats: Task assignment repository not available');
      
      return {
        total: 0,
        byStatus: {},
        byPriority: {},
        byAssigneeType: {},
        overdue: 0,
        dueSoon: 0
      };
    } catch (error) {
      console.error('TaskAssignmentService.getTaskAssignmentStats failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get task assignment statistics');
    }
  }

  /**
   * Validate task assignment data
   */
  validateTaskAssignmentData(data: CreateTaskAssignmentRequestDto | UpdateTaskAssignmentRequestDto): TaskAssignmentValidationResultDto {
    const errors: string[] = [];
    if ('title' in data && !data.title) {
      errors.push('Title is required');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Search task assignments
   */
  async searchTaskAssignments(request: SearchTaskAssignmentsRequestDto): Promise<TaskAssignmentDTO[]> {
    try {
      if (!request.searchTerm) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Search term is required');
      }

      // For now, return mock data as task assignment repository is not available
      // TODO: Implement proper task assignment search when repository is available
      console.warn('TaskAssignmentService.searchTaskAssignments: Task assignment repository not available');
      
      return [];
    } catch (error) {
      console.error('TaskAssignmentService.searchTaskAssignments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to search task assignments');
    }
  }

  /**
   * Get task assignments by status
   */
  async getTaskAssignmentsByStatus(request: GetTaskAssignmentsByStatusRequestDto): Promise<TaskAssignmentDTO[]> {
    try {
      if (!request.status) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Status is required');
      }

      return await this.getTaskAssignments({ filters: { status: request.status } });
    } catch (error) {
      console.error('TaskAssignmentService.getTaskAssignmentsByStatus failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get task assignments by status');
    }
  }

  /**
   * Get task assignments by priority
   */
  async getTaskAssignmentsByPriority(request: GetTaskAssignmentsByPriorityRequestDto): Promise<TaskAssignmentDTO[]> {
    try {
      if (!request.priority) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Priority is required');
      }

      return await this.getTaskAssignments({ filters: { priority: request.priority } });
    } catch (error) {
      console.error('TaskAssignmentService.getTaskAssignmentsByPriority failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get task assignments by priority');
    }
  }

  /**
   * Get task assignments by assignee type
   */
  async getTaskAssignmentsByAssigneeType(request: GetTaskAssignmentsByAssigneeTypeRequestDto): Promise<TaskAssignmentDTO[]> {
    try {
      if (!request.assigneeType) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Assignee type is required');
      }

      return await this.getTaskAssignments({ filters: { assigneeType: request.assigneeType } });
    } catch (error) {
      console.error('TaskAssignmentService.getTaskAssignmentsByAssigneeType failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get task assignments by assignee type');
    }
  }

  /**
   * Convert entity to DTO
   */
  private toDTO(task: TaskAssignment): TaskAssignmentDTO {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      project_id: task.projectId,
      assigned_to: task.assignedTo,
      assigned_by: task.assignedBy,
      assignee_type: task.assigneeType,
      status: task.status,
      priority: task.priority,
      due_date: task.dueDate?.toISOString(),
      completed_at: task.completedAt?.toISOString(),
      created_at: task.createdAt.toISOString(),
      updated_at: task.updatedAt.toISOString()
    };
  }
}
