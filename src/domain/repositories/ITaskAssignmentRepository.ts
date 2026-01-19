import { TaskAssignment } from '@/domain/entities/Workspace';

export interface ITaskAssignmentRepository {
  /**
   * Create a new task assignment
   * @param taskAssignment The task assignment entity
   * @returns The created task assignment
   */
  create(taskAssignment: Omit<TaskAssignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaskAssignment>;

  /**
   * Get a task assignment by ID
   * @param id The task assignment ID
   * @returns The task assignment or null
   */
  findById(id: string): Promise<TaskAssignment | null>;

  /**
   * Get all task assignments
   * @returns Array of task assignments
   */
  findAll(): Promise<TaskAssignment[]>;

  /**
   * Update a task assignment
   * @param id The task assignment ID
   * @param updates The updates to apply
   * @returns The updated task assignment
   */
  update(id: string, updates: Partial<TaskAssignment>): Promise<TaskAssignment>;

  /**
   * Delete a task assignment
   * @param id The task assignment ID
   */
  delete(id: string): Promise<void>;

  /**
   * Get task assignments by project ID
   * @param projectId The project ID
   * @returns Array of task assignments
   */
  findByProjectId(projectId: string): Promise<TaskAssignment[]>;

  /**
   * Get task assignments by assigned user
   * @param assignedTo The user ID
   * @returns Array of task assignments
   */
  findByAssignedTo(assignedTo: string): Promise<TaskAssignment[]>;

  /**
   * Get task assignments by assigned by user
   * @param assignedBy The user ID
   * @returns Array of task assignments
   */
  findByAssignedBy(assignedBy: string): Promise<TaskAssignment[]>;

  /**
   * Get task assignments by status
   * @param status The status filter
   * @returns Array of task assignments
   */
  findByStatus(status: string): Promise<TaskAssignment[]>;

  /**
   * Get task assignments by priority
   * @param priority The priority filter
   * @returns Array of task assignments
   */
  findByPriority(priority: string): Promise<TaskAssignment[]>;

  /**
   * Get task assignments by assignee type
   * @param assigneeType The assignee type filter
   * @returns Array of task assignments
   */
  findByAssigneeType(assigneeType: string): Promise<TaskAssignment[]>;

  /**
   * Search task assignments by term
   * @param searchTerm The search term
   * @returns Array of matching task assignments
   */
  searchByTerm(searchTerm: string): Promise<TaskAssignment[]>;

  /**
   * Get task assignments with filters
   * @param filters The filters to apply
   * @returns Array of filtered task assignments
   */
  findWithFilters(filters: {
    searchTerm?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    project_id?: string;
  }): Promise<TaskAssignment[]>;

  /**
   * Get task assignments due soon
   * @param days The number of days ahead
   * @returns Array of task assignments due soon
   */
  findDueSoon(days: number): Promise<TaskAssignment[]>;

  /**
   * Get overdue task assignments
   * @returns Array of overdue task assignments
   */
  findOverdue(): Promise<TaskAssignment[]>;

  /**
   * Get task assignment statistics
   * @returns Statistics object
   */
  getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byAssigneeType: Record<string, number>;
    overdue: number;
    dueSoon: number;
  }>;
}
