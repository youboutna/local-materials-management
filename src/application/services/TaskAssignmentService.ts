import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { ITaskAssignmentRepository } from '@/domain/repositories/ITaskAssignmentRepository';
import { TaskAssignment } from '@/domain/entities/Workspace';
import { 
  TaskAssignmentDTO, 
  CreateTaskAssignmentRequestDto, 
  UpdateTaskAssignmentRequestDto,
  TaskAssignmentFilters
} from '@/dtos/transforms/shared';
import { TaskAssignmentDomainTransformer } from '@/dtos/transforms/TaskAssignmentDomainTransformer';
import { NotificationService } from './NotificationService';

export class TaskAssignmentService {
  private taskAssignmentRepository: ITaskAssignmentRepository;
  private taskAssignmentTransformer: TaskAssignmentDomainTransformer;

  constructor() {
    this.taskAssignmentRepository = RepositoryFactory.getTaskAssignmentRepository();
    this.taskAssignmentTransformer = new TaskAssignmentDomainTransformer();
  }

  /**
   * Create a new task assignment
   * @param taskData The task assignment data
   * @param assignedBy The user ID creating the task
   * @returns The created task assignment DTO
   */
  async createTaskAssignment(
    taskData: CreateTaskAssignmentRequestDto, 
    assignedBy?: string
  ): Promise<TaskAssignmentDTO> {
    try {
      // Validate data
      const validation = this.taskAssignmentTransformer.validate(taskData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const entity = this.taskAssignmentTransformer.fromCreateDtoToEntity(taskData);
      const taskWithAssignedBy = {
        ...entity,
        assignedBy: assignedBy || entity.assignedBy
      };
      
      const createdTask = await this.taskAssignmentRepository.create(taskWithAssignedBy);
      const taskDTO = this.taskAssignmentTransformer.toDTO(createdTask);

      // Send notification to assigned user
      if (createdTask.assignedTo) {
        try {
          await NotificationService.createNotification({
            recipient_id: createdTask.assignedTo,
            title: '📋 Nouvelle tâche assignée',
            message: `Une nouvelle tâche "${createdTask.title}" vous a été assignée${createdTask.priority === 'high' ? ' (Priorité élevée)' : ''}.`,
            type: 'task_assignment',
            related_id: createdTask.id,
            metadata: {
              task_id: createdTask.id,
              project_id: createdTask.projectId,
              priority: createdTask.priority,
              due_date: createdTask.dueDate?.toISOString(),
              assignee_type: createdTask.assigneeType,
            }
          });

          // Send supplier notification if applicable
          if (createdTask.assigneeType === 'supplier' && createdTask.assigneeEmail) {
            await NotificationService.createSupplierNotification({
              supplier_id: createdTask.assignedTo,
              notification_type: 'task_assignment',
              email: createdTask.assigneeEmail,
              metadata: {
                task_id: createdTask.id,
                title: createdTask.title,
                priority: createdTask.priority,
                due_date: createdTask.dueDate?.toISOString(),
              }
            });
          }
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
          // Don't throw error for notification failure
        }
      }

      return taskDTO;
    } catch (error) {
      console.error('Error creating task assignment:', error);
      throw new Error(`Failed to create task assignment: ${error.message}`);
    }
  }

  /**
   * Get a task assignment by ID
   * @param id The task assignment ID
   * @returns The task assignment DTO or null
   */
  async getTaskAssignmentById(id: string): Promise<TaskAssignmentDTO | null> {
    try {
      const task = await this.taskAssignmentRepository.findById(id);
      return task ? this.taskAssignmentTransformer.toDTO(task) : null;
    } catch (error) {
      console.error('Error fetching task assignment:', error);
      throw new Error(`Failed to fetch task assignment: ${error.message}`);
    }
  }

  /**
   * Get all task assignments
   * @returns Array of task assignment DTOs
   */
  async getAllTaskAssignments(): Promise<TaskAssignmentDTO[]> {
    try {
      const tasks = await this.taskAssignmentRepository.findAll();
      return tasks.map(task => this.taskAssignmentTransformer.toDTO(task));
    } catch (error) {
      console.error('Error fetching task assignments:', error);
      throw new Error(`Failed to fetch task assignments: ${error.message}`);
    }
  }

  /**
   * Update a task assignment
   * @param id The task assignment ID
   * @param updates The updates to apply
   * @returns The updated task assignment DTO
   */
  async updateTaskAssignment(id: string, updates: UpdateTaskAssignmentRequestDto): Promise<TaskAssignmentDTO> {
    try {
      // Validate data
      const validation = this.taskAssignmentTransformer.validate(updates);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const entityUpdates = this.taskAssignmentTransformer.fromUpdateDtoToEntity(updates);
      const updatedTask = await this.taskAssignmentRepository.update(id, entityUpdates);
      const taskDTO = this.taskAssignmentTransformer.toDTO(updatedTask);

      // Send notification if status changed to completed
      if (updates.status === 'completed' && updatedTask.assignedTo) {
        try {
          await NotificationService.createNotification({
            recipient_id: updatedTask.assignedTo,
            title: '✅ Tâche terminée',
            message: `La tâche "${updatedTask.title}" a été marquée comme terminée.`,
            type: 'task_update',
            related_id: id,
            metadata: { task_id: id, status: 'completed' }
          });
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
          // Don't throw error for notification failure
        }
      }

      return taskDTO;
    } catch (error) {
      console.error('Error updating task assignment:', error);
      throw new Error(`Failed to update task assignment: ${error.message}`);
    }
  }

  /**
   * Delete a task assignment
   * @param id The task assignment ID
   */
  async deleteTaskAssignment(id: string): Promise<void> {
    try {
      await this.taskAssignmentRepository.delete(id);
    } catch (error) {
      console.error('Error deleting task assignment:', error);
      throw new Error(`Failed to delete task assignment: ${error.message}`);
    }
  }

  /**
   * Get task assignments with filters
   * @param filters The filters to apply
   * @returns Array of filtered task assignment DTOs
   */
  async getTaskAssignments(filters?: TaskAssignmentFilters): Promise<TaskAssignmentDTO[]> {
    try {
      if (!filters || Object.keys(filters).length === 0) {
        return this.getAllTaskAssignments();
      }

      const tasks = await this.taskAssignmentRepository.findWithFilters(filters);
      return tasks.map(task => this.taskAssignmentTransformer.toDTO(task));
    } catch (error) {
      console.error('Error fetching filtered task assignments:', error);
      throw new Error(`Failed to fetch filtered task assignments: ${error.message}`);
    }
  }

  /**
   * Get task assignments by project
   * @param projectId The project ID
   * @returns Array of task assignment DTOs
   */
  async getTaskAssignmentsByProject(projectId: string): Promise<TaskAssignmentDTO[]> {
    try {
      const tasks = await this.taskAssignmentRepository.findByProjectId(projectId);
      return tasks.map(task => this.taskAssignmentTransformer.toDTO(task));
    } catch (error) {
      console.error('Error fetching task assignments by project:', error);
      throw new Error(`Failed to fetch task assignments by project: ${error.message}`);
    }
  }

  /**
   * Get task assignments assigned to user
   * @param userId The user ID
   * @returns Array of task assignment DTOs
   */
  async getTaskAssignmentsAssignedTo(userId: string): Promise<TaskAssignmentDTO[]> {
    try {
      const tasks = await this.taskAssignmentRepository.findByAssignedTo(userId);
      return tasks.map(task => this.taskAssignmentTransformer.toDTO(task));
    } catch (error) {
      console.error('Error fetching task assignments assigned to user:', error);
      throw new Error(`Failed to fetch task assignments assigned to user: ${error.message}`);
    }
  }

  /**
   * Get task assignments assigned by user
   * @param userId The user ID
   * @returns Array of task assignment DTOs
   */
  async getTaskAssignmentsAssignedBy(userId: string): Promise<TaskAssignmentDTO[]> {
    try {
      const tasks = await this.taskAssignmentRepository.findByAssignedBy(userId);
      return tasks.map(task => this.taskAssignmentTransformer.toDTO(task));
    } catch (error) {
      console.error('Error fetching task assignments assigned by user:', error);
      throw new Error(`Failed to fetch task assignments assigned by user: ${error.message}`);
    }
  }

  /**
   * Get overdue task assignments
   * @returns Array of overdue task assignment DTOs
   */
  async getOverdueTaskAssignments(): Promise<TaskAssignmentDTO[]> {
    try {
      const tasks = await this.taskAssignmentRepository.findOverdue();
      return tasks.map(task => this.taskAssignmentTransformer.toDTO(task));
    } catch (error) {
      console.error('Error fetching overdue task assignments:', error);
      throw new Error(`Failed to fetch overdue task assignments: ${error.message}`);
    }
  }

  /**
   * Get task assignments due soon
   * @param days Number of days ahead
   * @returns Array of task assignment DTOs due soon
   */
  async getTaskAssignmentsDueSoon(days: number = 3): Promise<TaskAssignmentDTO[]> {
    try {
      const tasks = await this.taskAssignmentRepository.findDueSoon(days);
      return tasks.map(task => this.taskAssignmentTransformer.toDTO(task));
    } catch (error) {
      console.error('Error fetching task assignments due soon:', error);
      throw new Error(`Failed to fetch task assignments due soon: ${error.message}`);
    }
  }

  /**
   * Get task assignment statistics
   * @returns Statistics object
   */
  async getTaskAssignmentStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byAssigneeType: Record<string, number>;
    overdue: number;
    dueSoon: number;
  }> {
    try {
      return await this.taskAssignmentRepository.getStats();
    } catch (error) {
      console.error('Error fetching task assignment stats:', error);
      throw new Error(`Failed to fetch task assignment stats: ${error.message}`);
    }
  }

  /**
   * Validate task assignment data
   * @param data The task assignment data to validate
   * @returns Validation result
   */
  validateTaskAssignmentData(data: CreateTaskAssignmentRequestDto | UpdateTaskAssignmentRequestDto): {
    isValid: boolean;
    errors: string[];
  } {
    return this.taskAssignmentTransformer.validate(data);
  }

  /**
   * Search task assignments
   * @param searchTerm The search term
   * @returns Array of matching task assignment DTOs
   */
  async searchTaskAssignments(searchTerm: string): Promise<TaskAssignmentDTO[]> {
    try {
      const tasks = await this.taskAssignmentRepository.searchByTerm(searchTerm);
      return tasks.map(task => this.taskAssignmentTransformer.toDTO(task));
    } catch (error) {
      console.error('Error searching task assignments:', error);
      throw new Error(`Failed to search task assignments: ${error.message}`);
    }
  }

  /**
   * Get task assignments by status
   * @param status The status filter
   * @returns Array of task assignment DTOs
   */
  async getTaskAssignmentsByStatus(status: string): Promise<TaskAssignmentDTO[]> {
    try {
      const tasks = await this.taskAssignmentRepository.findByStatus(status);
      return tasks.map(task => this.taskAssignmentTransformer.toDTO(task));
    } catch (error) {
      console.error('Error fetching task assignments by status:', error);
      throw new Error(`Failed to fetch task assignments by status: ${error.message}`);
    }
  }

  /**
   * Get task assignments by priority
   * @param priority The priority filter
   * @returns Array of task assignment DTOs
   */
  async getTaskAssignmentsByPriority(priority: string): Promise<TaskAssignmentDTO[]> {
    try {
      const tasks = await this.taskAssignmentRepository.findByPriority(priority);
      return tasks.map(task => this.taskAssignmentTransformer.toDTO(task));
    } catch (error) {
      console.error('Error fetching task assignments by priority:', error);
      throw new Error(`Failed to fetch task assignments by priority: ${error.message}`);
    }
  }

  /**
   * Get task assignments by assignee type
   * @param assigneeType The assignee type filter
   * @returns Array of task assignment DTOs
   */
  async getTaskAssignmentsByAssigneeType(assigneeType: string): Promise<TaskAssignmentDTO[]> {
    try {
      const tasks = await this.taskAssignmentRepository.findByAssigneeType(assigneeType);
      return tasks.map(task => this.taskAssignmentTransformer.toDTO(task));
    } catch (error) {
      console.error('Error fetching task assignments by assignee type:', error);
      throw new Error(`Failed to fetch task assignments by assignee type: ${error.message}`);
    }
  }
}
