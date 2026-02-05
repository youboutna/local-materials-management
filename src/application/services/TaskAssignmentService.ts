/**
 * Task Assignment Service - Hexagonal Architecture
 * Business logic for managing task assignments
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { ITaskAssignmentRepository } from '@/domain/repositories/ITaskAssignmentRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { TaskAssignment as WorkspaceTaskAssignment } from '@/domain/entities/Workspace';
import { TaskAssignmentTransformer } from '@/dtos/transforms/TaskAssignmentTransformer';

import {
  TaskAssignmentDTO,
  TaskAssignmentFiltersDTO,
  CreateTaskAssignmentWithAssignerRequestDTO,
  GetTaskAssignmentByIdRequestDTO,
  UpdateTaskAssignmentWithIdRequestDTO,
  DeleteTaskAssignmentRequestDTO,
  GetTaskAssignmentsWithFiltersRequestDTO,
  GetTaskAssignmentsByProjectRequestDTO,
  GetTaskAssignmentsAssignedToRequestDTO,
  GetTaskAssignmentsAssignedByRequestDTO,
  GetTaskAssignmentsDueSoonRequestDTO,
  SearchTaskAssignmentsRequestDTO,
  GetTaskAssignmentsByStatusRequestDTO,
  GetTaskAssignmentsByPriorityRequestDTO,
  GetTaskAssignmentsByAssigneeTypeRequestDTO,
  TaskAssignmentStatsDTO,
  TaskAssignmentValidationResultDTO
} from '@/dtos/entities/TaskAssignmentDTO';

export class TaskAssignmentService {
  private taskAssignmentRepository: ITaskAssignmentRepository;

  constructor() {
    this.taskAssignmentRepository = RepositoryFactory.getTaskAssignmentRepository();
  }

  private toDTO(task: WorkspaceTaskAssignment): TaskAssignmentDTO {
    return TaskAssignmentTransformer.toDTO(task);
  }

  /**
   * Create a new task assignment
   */
  async createTaskAssignment(request: CreateTaskAssignmentWithAssignerRequestDTO): Promise<TaskAssignmentDTO> {
    try {
      if (!request.taskData.title) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Title is required');
      }

      const entity = new WorkspaceTaskAssignment(
        crypto.randomUUID(),
        request.taskData.title,
        request.taskData.description,
        request.taskData.projectId,
        request.taskData.assignedTo,
        request.assignedBy || request.taskData.assignedBy,
        (request.taskData.assigneeType as unknown) as 'supplier' | 'employee' | 'user' | undefined,
        'pending',
        (request.taskData.priority || 'medium') as 'low' | 'medium' | 'high' | 'urgent' | undefined,
        request.taskData.dueDate ? new Date(request.taskData.dueDate) : undefined,
        new Date(),
        new Date()
      );

      const created = await this.taskAssignmentRepository.create(entity);
      return this.toDTO(created);
    } catch (error) {
      console.error('TaskAssignmentService.createTaskAssignment failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create task assignment');
    }
  }

  /**
   * Get a task assignment by ID
   */
  async getTaskAssignmentById(request: GetTaskAssignmentByIdRequestDTO): Promise<TaskAssignmentDTO | null> {
    try {
      const task = await this.taskAssignmentRepository.findById(request.id);
      return task ? this.toDTO(task) : null;
    } catch (error) {
      console.error('TaskAssignmentService.getTaskAssignmentById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get task assignment');
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
  async updateTaskAssignment(request: UpdateTaskAssignmentWithIdRequestDTO): Promise<TaskAssignmentDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Task assignment ID is required');
      }
      if (!request.updates || Object.keys(request.updates).length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Update data is required');
      }

      const updates: Partial<WorkspaceTaskAssignment> = {
        ...request.updates,
        status: (request.updates.status || 'pending') as 'pending' | 'in_progress' | 'completed' | 'cancelled',
        priority: request.updates.priority as 'low' | 'medium' | 'high' | 'urgent' | undefined,
        dueDate: request.updates.dueDate,
        updatedAt: new Date()
      };

      const updated = await this.taskAssignmentRepository.update(request.id, updates);
      return this.toDTO(updated);
    } catch (error) {
      console.error('TaskAssignmentService.updateTaskAssignment failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update task assignment');
    }
  }

  /**
   * Delete a task assignment
   */
  async deleteTaskAssignment(request: DeleteTaskAssignmentRequestDTO): Promise<void> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Task assignment ID is required');
      }
      
      await this.taskAssignmentRepository.delete(request.id);
    } catch (error) {
      console.error('TaskAssignmentService.deleteTaskAssignment failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete task assignment');
    }
  }

  /**
   * Get task assignments with filters
   */
  async getTaskAssignments(request: GetTaskAssignmentsWithFiltersRequestDTO): Promise<TaskAssignmentDTO[]> {
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
  async getTaskAssignmentsByProject(request: GetTaskAssignmentsByProjectRequestDTO): Promise<TaskAssignmentDTO[]> {
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
  async getTaskAssignmentsAssignedTo(request: GetTaskAssignmentsAssignedToRequestDTO): Promise<TaskAssignmentDTO[]> {
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
  async getTaskAssignmentsAssignedBy(request: GetTaskAssignmentsAssignedByRequestDTO): Promise<TaskAssignmentDTO[]> {
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
      const tasks = await this.taskAssignmentRepository.findOverdue();
      return tasks.map(this.toDTO);
    } catch (error) {
      console.error('TaskAssignmentService.getOverdueTaskAssignments failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get overdue task assignments');
    }
  }

  /**
   * Get task assignments due soon
   */
  async getTaskAssignmentsDueSoon(request: GetTaskAssignmentsDueSoonRequestDTO): Promise<TaskAssignmentDTO[]> {
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
  async getTaskAssignmentStats(): Promise<TaskAssignmentStatsDTO> {
    try {
      // For now, return mock data as task assignment repository is not available
      // TODO: Implement proper task assignment statistics when repository is available
      console.warn('TaskAssignmentService.getTaskAssignmentStats: Task assignment repository not available');
      
      return {
        total: 0,
        byStatus: { pending: 0, in_progress: 0, completed: 0, cancelled: 0, accepted: 0, assigned: 0, rejected: 0 } as any,
        byPriority: { low: 0, medium: 0, high: 0, urgent: 0 } as any,
        byAssigneeType: { individual: 0, team: 0, consultant: 0, reviewer: 0, approver: 0 } as any,
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
  validateTaskAssignmentData(data: Record<string, unknown>): TaskAssignmentValidationResultDTO {
    const errors: string[] = [];
    if ('title' in data && !data.title) {
      errors.push('Title is required');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Search task assignments
   */
  async searchTaskAssignments(request: SearchTaskAssignmentsRequestDTO): Promise<TaskAssignmentDTO[]> {
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
  async getTaskAssignmentsByStatus(request: GetTaskAssignmentsByStatusRequestDTO): Promise<TaskAssignmentDTO[]> {
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
  async getTaskAssignmentsByPriority(request: GetTaskAssignmentsByPriorityRequestDTO): Promise<TaskAssignmentDTO[]> {
    try {
      if (!request.priority) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Priority is required');
      }

      const tasks = await this.taskAssignmentRepository.findByPriority(request.priority);
      return tasks.map(this.toDTO);
    } catch (error) {
      console.error('TaskAssignmentService.getTaskAssignmentsByPriority failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get task assignments by priority');
    }
  }

  /**
   * Get task assignments by assignee type
   */
  async getTaskAssignmentsByAssigneeType(request: GetTaskAssignmentsByAssigneeTypeRequestDTO): Promise<TaskAssignmentDTO[]> {
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
}
