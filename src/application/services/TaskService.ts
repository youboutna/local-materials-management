/**
 * Task Service - Hexagonal Architecture
 * Business logic layer with use cases
 */

import { Task, TaskStatus, TaskPriority } from '@/domain/entities/Task';
import { ITaskRepository } from '@/domain/repositories';

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

      const updateData: Partial<Task> = {};
      if (updateDTO.title !== undefined) (updateData as any).title = updateDTO.title;
      if (updateDTO.description !== undefined) (updateData as any).description = updateDTO.description;
      if (updateDTO.status !== undefined) (updateData as any).status = updateDTO.status as TaskStatus;
      if (updateDTO.priority !== undefined) (updateData as any).priority = updateDTO.priority as TaskPriority;
      if (updateDTO.projectId !== undefined) (updateData as any).projectId = updateDTO.projectId;
      if (updateDTO.phaseId !== undefined) (updateData as any).phaseId = updateDTO.phaseId;
      if (updateDTO.assignedTo !== undefined) (updateData as any).assignedTo = updateDTO.assignedTo;
      if (updateDTO.dueDate !== undefined) (updateData as any).dueDate = updateDTO.dueDate;
      (updateData as any).updatedAt = new Date().toISOString();

      await this.taskRepository.update(id, updateData);
      
      // Create updated task for return
      const updatedTask = new Task(
        existingTask.id,
        (updateData as any).projectId ?? existingTask.projectId,
        (updateData as any).phaseId ?? existingTask.phaseId,
        existingTask.stepId,
        (updateData as any).title ?? existingTask.title,
        (updateData as any).description ?? existingTask.description,
        (updateData as any).status ?? existingTask.status,
        (updateData as any).priority ?? existingTask.priority,
        existingTask.progress,
        (updateData as any).assignedTo ?? existingTask.assignedTo,
        existingTask.assignedBy,
        existingTask.startDate,
        existingTask.endDate,
        (updateData as any).dueDate ?? existingTask.dueDate,
        existingTask.completionDate,
        existingTask.estimatedDuration,
        existingTask.actualDuration,
        existingTask.dependencies,
        existingTask.notes,
        existingTask.createdAt,
        (updateData as any).updatedAt ?? existingTask.updatedAt
      );
      
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

  async getAllTasks(filters?: Record<string, any>): Promise<TaskDTO[]> {
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

  async getProjectPhases(projectId: string): Promise<any[]> {
    return [];
  }
}
