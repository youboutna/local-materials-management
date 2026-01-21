/**
 * Task Assignment Service
 * Uses in-memory storage for task assignments
 */

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

// In-memory store
const taskStore = new Map<string, TaskAssignment>();

export class TaskAssignmentService {
  /**
   * Create a new task assignment
   */
  async createTaskAssignment(
    taskData: CreateTaskAssignmentRequestDto, 
    assignedBy?: string
  ): Promise<TaskAssignmentDTO> {
    try {
      const now = new Date();
      const task: TaskAssignment = {
        id: crypto.randomUUID(),
        title: taskData.title,
        description: taskData.description,
        projectId: taskData.project_id,
        assignedTo: taskData.assigned_to,
        assignedBy: assignedBy || taskData.assigned_by,
        assigneeType: taskData.assignee_type as 'employee' | 'supplier',
        status: 'pending',
        priority: (taskData.priority as 'low' | 'medium' | 'high') || 'medium',
        dueDate: taskData.due_date ? new Date(taskData.due_date) : undefined,
        createdAt: now,
        updatedAt: now
      };

      taskStore.set(task.id, task);
      return this.toDTO(task);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error creating task assignment:', error);
      throw new Error(`Failed to create task assignment: ${message}`);
    }
  }

  /**
   * Get a task assignment by ID
   */
  async getTaskAssignmentById(id: string): Promise<TaskAssignmentDTO | null> {
    const task = taskStore.get(id);
    return task ? this.toDTO(task) : null;
  }

  /**
   * Get all task assignments
   */
  async getAllTaskAssignments(): Promise<TaskAssignmentDTO[]> {
    const tasks: TaskAssignment[] = [];
    taskStore.forEach(task => tasks.push(task));
    return tasks.map(task => this.toDTO(task));
  }

  /**
   * Update a task assignment
   */
  async updateTaskAssignment(id: string, updates: UpdateTaskAssignmentRequestDto): Promise<TaskAssignmentDTO> {
    const task = taskStore.get(id);
    if (!task) {
      throw new Error('Task assignment not found');
    }

    const updatedTask: TaskAssignment = {
      ...task,
      title: updates.title ?? task.title,
      description: updates.description ?? task.description,
      status: (updates.status as TaskAssignment['status']) ?? task.status,
      priority: (updates.priority as TaskAssignment['priority']) ?? task.priority,
      dueDate: updates.due_date ? new Date(updates.due_date) : task.dueDate,
      completedAt: updates.status === 'completed' ? new Date() : task.completedAt,
      updatedAt: new Date()
    };

    taskStore.set(id, updatedTask);
    return this.toDTO(updatedTask);
  }

  /**
   * Delete a task assignment
   */
  async deleteTaskAssignment(id: string): Promise<void> {
    taskStore.delete(id);
  }

  /**
   * Get task assignments with filters
   */
  async getTaskAssignments(filters?: TaskAssignmentFilters): Promise<TaskAssignmentDTO[]> {
    if (!filters || Object.keys(filters).length === 0) {
      return this.getAllTaskAssignments();
    }

    const tasks: TaskAssignment[] = [];
    taskStore.forEach(task => {
      let matches = true;
      if (filters.projectId && task.projectId !== filters.projectId) matches = false;
      if (filters.assignedTo && task.assignedTo !== filters.assignedTo) matches = false;
      if (filters.assignedBy && task.assignedBy !== filters.assignedBy) matches = false;
      if (filters.status && task.status !== filters.status) matches = false;
      if (filters.priority && task.priority !== filters.priority) matches = false;
      if (filters.assigneeType && task.assigneeType !== filters.assigneeType) matches = false;
      if (matches) tasks.push(task);
    });

    return tasks.map(task => this.toDTO(task));
  }

  /**
   * Get task assignments by project
   */
  async getTaskAssignmentsByProject(projectId: string): Promise<TaskAssignmentDTO[]> {
    return this.getTaskAssignments({ projectId });
  }

  /**
   * Get task assignments assigned to user
   */
  async getTaskAssignmentsAssignedTo(userId: string): Promise<TaskAssignmentDTO[]> {
    return this.getTaskAssignments({ assignedTo: userId });
  }

  /**
   * Get task assignments assigned by user
   */
  async getTaskAssignmentsAssignedBy(userId: string): Promise<TaskAssignmentDTO[]> {
    return this.getTaskAssignments({ assignedBy: userId });
  }

  /**
   * Get overdue task assignments
   */
  async getOverdueTaskAssignments(): Promise<TaskAssignmentDTO[]> {
    const now = new Date();
    const tasks: TaskAssignment[] = [];
    taskStore.forEach(task => {
      if (task.status !== 'completed' && task.dueDate && task.dueDate < now) {
        tasks.push(task);
      }
    });
    return tasks.map(task => this.toDTO(task));
  }

  /**
   * Get task assignments due soon
   */
  async getTaskAssignmentsDueSoon(days: number = 3): Promise<TaskAssignmentDTO[]> {
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const tasks: TaskAssignment[] = [];
    taskStore.forEach(task => {
      if (task.status !== 'completed' && task.dueDate && task.dueDate >= now && task.dueDate <= futureDate) {
        tasks.push(task);
      }
    });
    return tasks.map(task => this.toDTO(task));
  }

  /**
   * Get task assignment statistics
   */
  async getTaskAssignmentStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byAssigneeType: Record<string, number>;
    overdue: number;
    dueSoon: number;
  }> {
    const stats = {
      total: 0,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      byAssigneeType: {} as Record<string, number>,
      overdue: 0,
      dueSoon: 0
    };

    const now = new Date();
    const futureDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    taskStore.forEach(task => {
      stats.total++;
      stats.byStatus[task.status] = (stats.byStatus[task.status] || 0) + 1;
      stats.byPriority[task.priority] = (stats.byPriority[task.priority] || 0) + 1;
      if (task.assigneeType) {
        stats.byAssigneeType[task.assigneeType] = (stats.byAssigneeType[task.assigneeType] || 0) + 1;
      }
      if (task.status !== 'completed' && task.dueDate) {
        if (task.dueDate < now) stats.overdue++;
        else if (task.dueDate <= futureDate) stats.dueSoon++;
      }
    });

    return stats;
  }

  /**
   * Validate task assignment data
   */
  validateTaskAssignmentData(data: CreateTaskAssignmentRequestDto | UpdateTaskAssignmentRequestDto): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    if ('title' in data && !data.title) {
      errors.push('Title is required');
    }
    return { isValid: errors.length === 0, errors };
  }

  /**
   * Search task assignments
   */
  async searchTaskAssignments(searchTerm: string): Promise<TaskAssignmentDTO[]> {
    const term = searchTerm.toLowerCase();
    const tasks: TaskAssignment[] = [];
    taskStore.forEach(task => {
      if (
        task.title.toLowerCase().includes(term) ||
        task.description?.toLowerCase().includes(term)
      ) {
        tasks.push(task);
      }
    });
    return tasks.map(task => this.toDTO(task));
  }

  /**
   * Get task assignments by status
   */
  async getTaskAssignmentsByStatus(status: string): Promise<TaskAssignmentDTO[]> {
    return this.getTaskAssignments({ status });
  }

  /**
   * Get task assignments by priority
   */
  async getTaskAssignmentsByPriority(priority: string): Promise<TaskAssignmentDTO[]> {
    return this.getTaskAssignments({ priority });
  }

  /**
   * Get task assignments by assignee type
   */
  async getTaskAssignmentsByAssigneeType(assigneeType: string): Promise<TaskAssignmentDTO[]> {
    return this.getTaskAssignments({ assigneeType });
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
