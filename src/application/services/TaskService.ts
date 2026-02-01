/**
 * Task Service - Hexagonal Architecture
 * Business logic layer with use cases
 */

import { Task } from '@/domain/entities/Task';
import { TaskStatus, TaskPriority } from '@/domain/types';
import { ITaskRepository } from '@/domain/repositories';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface TaskDTO {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  projectId?: string;
  phaseId?: string | null;
  assignedTo?: string[];
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  projectId?: string;
  phaseId?: string;
  assignedTo?: string[];
  dueDate?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  projectId?: string;
  phaseId?: string;
  assignedTo?: string[];
  dueDate?: string;
}

// Types pour les méthodes étendues
export interface TaskAssignmentDTO {
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

export interface CreateTaskAssignmentRequestDto {
  title: string;
  description?: string;
  projectId?: string;
  assignedTo?: string;
  assignedBy?: string;
  assigneeType?: 'employee' | 'supplier';
  assigneeEmail?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export class TaskServiceError extends Error {
  constructor(
    message: string,
    public code: string = 'TASK_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

export class ValidationError extends TaskServiceError {
  constructor(message: string, public fieldErrors: Record<string, string[]>) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class TaskService {
  constructor(private taskRepository: ITaskRepository) {}

  private toDTO(task: Task): TaskDTO {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      projectId: task.projectId,
      phaseId: task.phaseId,
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }

  async createTask(createDTO: CreateTaskDTO): Promise<TaskDTO> {
    try {
      if (!createDTO.title || createDTO.title.trim() === '') {
        throw new ValidationError('Task title is required', { title: ['Title is required'] });
      }

      const task = Task.create({
        id: crypto.randomUUID(),
        projectId: createDTO.projectId || '',
        title: createDTO.title,
        description: createDTO.description,
        priority: (createDTO.priority as TaskPriority) || 'medium',
        assignedTo: createDTO.assignedTo || [],
        dueDate: createDTO.dueDate
      });

      await this.taskRepository.save(task);
      return this.toDTO(task);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new TaskServiceError(
        `Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATE_TASK_ERROR',
        error
      );
    }
  }

  async updateTask(id: string, updateDTO: UpdateTaskDTO): Promise<TaskDTO> {
    try {
      const existingTask = await this.taskRepository.findById(id);
      if (!existingTask) {
        throw new TaskServiceError('Task not found', 'TASK_NOT_FOUND');
      }

      // Create updated task using immutable pattern
      const updatedTask = existingTask.withStatus((updateDTO.status as TaskStatus) ?? existingTask.status)
        .withProgress(existingTask.progress);
      
      // Return DTO after update
      return this.toDTO(updatedTask);
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new TaskServiceError(
        `Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_TASK_ERROR',
        error
      );
    }
  }

  async getTaskById(id: string): Promise<TaskDTO | null> {
    try {
      const task = await this.taskRepository.findById(id);
      if (!task) return null;
      return this.toDTO(task);
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_TASK_ERROR',
        error
      );
    }
  }

  async getAllTasks(filters?: Record<string, unknown>): Promise<TaskDTO[]> {
    try {
      const tasks = await this.taskRepository.findAll();
      return tasks.map(task => this.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_TASKS_ERROR',
        error
      );
    }
  }

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

  async getProjectTasks(projectId: string): Promise<TaskDTO[]> {
    try {
      const tasks = await this.taskRepository.findByProjectId(projectId);
      return tasks.map(task => this.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get project tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_PROJECT_TASKS_ERROR',
        error
      );
    }
  }

  async getTasksByPhase(phaseId: string): Promise<TaskDTO[]> {
    try {
      const tasks = await this.taskRepository.findByPhaseId(phaseId);
      return tasks.map(task => this.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get tasks by phase: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_TASKS_BY_PHASE_ERROR',
        error
      );
    }
  }

  async getTasksByStatus(status: string): Promise<TaskDTO[]> {
    try {
      const tasks = await this.taskRepository.findByStatus(status as TaskStatus);
      return tasks.map(task => this.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get tasks by status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_TASKS_BY_STATUS_ERROR',
        error
      );
    }
  }

  async getTasksByAssignee(assigneeId: string): Promise<TaskDTO[]> {
    try {
      const tasks = await this.taskRepository.findByAssignee(assigneeId);
      return tasks.map(task => this.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get tasks by assignee: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_TASKS_BY_ASSIGNEE_ERROR',
        error
      );
    }
  }

  async getOverdueTasks(): Promise<TaskDTO[]> {
    try {
      const tasks = await this.taskRepository.findOverdue();
      return tasks.map(task => this.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get overdue tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_OVERDUE_TASKS_ERROR',
        error
      );
    }
  }

  async getUpcomingTasks(days: number): Promise<TaskDTO[]> {
    try {
      const today = new Date();
      const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
      
      const tasks = await this.taskRepository.findDueBetween(
        today.toISOString(),
        futureDate.toISOString()
      );
      
      return tasks.map(task => this.toDTO(task));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get upcoming tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_UPCOMING_TASKS_ERROR',
        error
      );
    }
  }

  // ========================================
  // MÉTHODES ÉTENDUES - Remplacement des services spécialisés
  // ========================================

  /**
   * WORKFLOW ASSIGNMENT (remplace TaskAssignmentService)
   * Assigner une tâche à une personne
   */
  async assignTask(request: CreateTaskAssignmentRequestDto): Promise<TaskAssignmentDTO> {
    try {
      // Valider la demande
      this.validateAssignmentRequest(request);

      // TODO: Implémenter avec TaskAssignmentRepository quand disponible
      // Pour l'instant, créer une tâche avec assignation
      const taskDTO: CreateTaskDTO = {
        title: request.title,
        description: request.description,
        projectId: request.projectId,
        assignedTo: request.assignedTo ? [request.assignedTo] : [],
        priority: request.priority || 'medium',
        dueDate: request.dueDate
      };

      const createdTask = await this.createTask(taskDTO);

      // Transformer en TaskAssignmentDTO
      const assignment: TaskAssignmentDTO = {
        id: createdTask.id,
        title: createdTask.title || '',
        description: createdTask.description || '',
        projectId: createdTask.projectId || '',
        assignedTo: request.assignedTo || undefined,
        assignedBy: request.assignedBy,
        assigneeType: request.assigneeType || 'employee',
        assigneeEmail: request.assigneeEmail,
        status: 'pending',
        priority: (request.priority as TaskAssignmentDTO['priority']) || 'medium',
        dueDate: request.dueDate ? new Date(request.dueDate) : undefined,
        createdAt: new Date(createdTask.createdAt),
        updatedAt: new Date(createdTask.updatedAt)
      };

      console.log(`Task assigned: ${request.title} to ${request.assignedTo}`);
      return assignment;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new TaskServiceError(
        `Failed to assign task: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ASSIGN_TASK_ERROR',
        error
      );
    }
  }

  /**
   * Obtenir les tâches assignées à un utilisateur
   */
  async getAssignedTasks(assigneeId: string): Promise<TaskAssignmentDTO[]> {
    try {
      const tasks = await this.getTasksByAssignee(assigneeId);
      
      // Transformer en TaskAssignmentDTO
      return tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || undefined,
        projectId: task.projectId,
        assignedTo: assigneeId,
        assigneeType: 'employee' as const,
        status: task.status as TaskAssignmentDTO['status'],
        priority: task.priority as TaskAssignmentDTO['priority'],
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt)
      }));
    } catch (error) {
      throw new TaskServiceError(
        `Failed to get assigned tasks: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GET_ASSIGNED_TASKS_ERROR',
        error
      );
    }
  }

  /**
   * Mettre à jour le statut d'une assignation
   */
  async updateAssignmentStatus(assignmentId: string, status: TaskAssignmentDTO['status'], performedBy: string): Promise<TaskAssignmentDTO> {
    try {
      // Mettre à jour la tâche
      const updateData: UpdateTaskDTO = {
        status: status
      };

      await this.updateTask(assignmentId, updateData);

      // Récupérer la tâche mise à jour
      const updatedTask = await this.getTaskById(assignmentId);
      if (!updatedTask) {
        throw new TaskServiceError('Task not found after update', 'NOT_FOUND');
      }

      // Transformer en TaskAssignmentDTO
      const assignment: TaskAssignmentDTO = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description || '',
        projectId: updatedTask.projectId,
        assignedTo: updatedTask.assignedTo?.[0] || undefined,
        assignedBy: performedBy,
        assigneeType: 'employee',
        status: status,
        priority: updatedTask.priority as TaskAssignmentDTO['priority'],
        dueDate: updatedTask.dueDate ? new Date(updatedTask.dueDate) : undefined,
        completedAt: status === 'completed' ? new Date() : undefined,
        createdAt: new Date(updatedTask.createdAt),
        updatedAt: new Date()
      };

      console.log(`Assignment ${assignmentId} status updated to: ${status}`);
      return assignment;
    } catch (error) {
      if (error instanceof TaskServiceError) throw error;
      throw new TaskServiceError(
        `Failed to update assignment status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_ASSIGNMENT_STATUS_ERROR',
        error
      );
    }
  }

  // ========================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ========================================

  private validateAssignmentRequest(request: CreateTaskAssignmentRequestDto): void {
    const errors: Record<string, string[]> = {};

    if (!request.title || request.title.trim().length === 0) {
      errors.title = ['Title is required'];
    }

    if (!request.assignedTo) {
      errors.assignedTo = ['Assignee is required'];
    }

    if (!request.assignedBy) {
      errors.assignedBy = ['Assigned by is required'];
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Assignment validation failed', errors);
    }
  }

  async getProjectPhases(projectId: string): Promise<TaskDTO[]> {
    return [];
  }
}
