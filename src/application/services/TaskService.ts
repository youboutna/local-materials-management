/**
 * Task Service - Hexagonal Architecture
 * Business logic layer with use cases and transformer integration
 * Clean separation between domain logic and infrastructure
 */

import { Task } from '@/domain/entities';
import { ITaskRepository } from '@/domain/repositories';
import { TaskDTO, CreateTaskDTO, UpdateTaskDTO } from '@/types/task-dto';
import { EntityToDTOMapper } from '@/dtos/transforms';

/**
 * Custom error class for task operations
 */
export class TaskServiceError extends Error {
  constructor(
    message: string,
    public code: string = 'TASK_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

/**
 * Validation error class
 */
export class ValidationError extends TaskServiceError {
  constructor(message: string, public fieldErrors: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/**
 * Task Service - Use Cases Implementation
 * Encapsulates business logic and coordinates between repository and UI
 */
export class TaskService {
  constructor(
    private taskRepository: ITaskRepository,
    private transformer: EntityToDTOMapper<Task, TaskDTO>
  ) {}

  // ============= CRUD Use Cases =============

  /**
   * Create a new task with validation
   */
  async createTask(createDTO: CreateTaskDTO): Promise<TaskDTO> {
    try {
      // Validation avec le transformer
      const validation = this.transformer.validate(createDTO);
      
      if (!validation.isValid) {
        throw new ValidationError(
          'Task validation failed',
          validation.fieldErrors || {}
        );
      }

      // Création via repository
      const task = await this.taskRepository.create(createDTO as Partial<Task>);
      
      // Transformation pour l'UI
      return this.transformer.toDTO(task);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new TaskServiceError(
        `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_TASK_ERROR',
        error
      );
    }
  }

  /**
   * Update an existing task with validation
   */
  async updateTask(id: string, updateDTO: UpdateTaskDTO): Promise<TaskDTO> {
    try {
      // Validation avec le transformer
      const validation = this.transformer.validate(updateDTO);
      
      if (!validation.isValid) {
        throw new ValidationError(
          'Task validation failed',
          validation.fieldErrors || {}
        );
      }

      // Mise à jour via repository
      const task = await this.taskRepository.update(id, updateDTO as Partial<Task>);
      
      // Transformation pour l'UI
      return this.transformer.toDTO(task);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new TaskServiceError(
        `Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_TASK_ERROR',
        error
      );
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<TaskDTO | null> {
    try {
      const task = await this.taskRepository.findById(id);
      
      if (!task) {
        return null;
      }

      return this.transformer.toDTO(task);
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_TASK_ERROR',
        error
      );
    }
  }

  /**
   * Get all tasks with optional filters
   */
  async getAllTasks(filters?: Record<string, any>): Promise<TaskDTO[]> {
    try {
      const tasks = await this.taskRepository.findAll(filters);
      return tasks.map(task => this.transformer.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_TASKS_ERROR',
        error
      );
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<void> {
    try {
      await this.taskRepository.delete(id);
    } catch (error) {
      throw new TaskServiceError(
        `Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETE_TASK_ERROR',
        error
      );
    }
  }

  // ============= Task-Specific Use Cases =============

  /**
   * Get tasks by project ID
   */
  async getProjectTasks(projectId: string): Promise<TaskDTO[]> {
    try {
      const tasks = await this.taskRepository.findAll({ project_id: projectId });
      return tasks.map(task => this.transformer.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get project tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PROJECT_TASKS_ERROR',
        error
      );
    }
  }

  /**
   * Get tasks by status
   */
  async getTasksByStatus(status: string): Promise<TaskDTO[]> {
    try {
      const tasks = await this.taskRepository.findAll({ status });
      return tasks.map(task => this.transformer.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get tasks by status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_TASKS_BY_STATUS_ERROR',
        error
      );
    }
  }

  /**
   * Get tasks by assignee
   */
  async getTasksByAssignee(assigneeId: string): Promise<TaskDTO[]> {
    try {
      const tasks = await this.taskRepository.findAll({ assigned_to: assigneeId });
      return tasks.map(task => this.transformer.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get tasks by assignee: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_TASKS_BY_ASSIGNEE_ERROR',
        error
      );
    }
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<TaskDTO[]> {
    try {
      const tasks = await this.taskRepository.findAll();
      const today = new Date();
      
      const overdueTasks = tasks.filter(task => {
        if (task.dueDate && task.status !== 'completed') {
          return new Date(task.dueDate) < today;
        }
        return false;
      });
      
      return overdueTasks.map(task => this.transformer.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get overdue tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_OVERDUE_TASKS_ERROR',
        error
      );
    }
  }

  /**
   * Get upcoming tasks
   */
  async getUpcomingTasks(days: number): Promise<TaskDTO[]> {
    try {
      const tasks = await this.taskRepository.findAll();
      const today = new Date();
      const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
      
      const upcomingTasks = tasks.filter(task => {
        if (task.dueDate && task.status !== 'completed') {
          const dueDate = new Date(task.dueDate);
          return dueDate >= today && dueDate <= futureDate;
        }
        return false;
      });
      
      return upcomingTasks.map(task => this.transformer.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get upcoming tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_UPCOMING_TASKS_ERROR',
        error
      );
    }
  }

  /**
   * Get project phases for tasks
   */
  async getProjectPhases(projectId: string): Promise<any[]> {
    try {
      // This would typically use a different repository for phases
      // For now, return empty array as placeholder
      return [];
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get project phases: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PROJECT_PHASES_ERROR',
        error
      );
    }
  }
}
