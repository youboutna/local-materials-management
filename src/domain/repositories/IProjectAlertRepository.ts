import { ProjectAlert } from '@/domain/entities/Workspace';

export interface IProjectAlertRepository {
  /**
   * Create a new project alert
   * @param alert The alert entity
   * @returns The created alert
   */
  create(alert: Omit<ProjectAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectAlert>;

  /**
   * Get an alert by ID
   * @param id The alert ID
   * @returns The alert or null
   */
  findById(id: string): Promise<ProjectAlert | null>;

  /**
   * Get all alerts for a project
   * @param projectId The project ID
   * @returns Array of alerts
   */
  findByProjectId(projectId: string): Promise<ProjectAlert[]>;

  /**
   * Get all alerts
   * @returns Array of alerts
   */
  findAll(): Promise<ProjectAlert[]>;

  /**
   * Update an alert
   * @param id The alert ID
   * @param updates The updates to apply
   * @returns The updated alert
   */
  update(id: string, updates: Partial<ProjectAlert>): Promise<ProjectAlert>;

  /**
   * Delete an alert
   * @param id The alert ID
   */
  delete(id: string): Promise<void>;

  /**
   * Get alerts by severity
   * @param severity The severity filter
   * @returns Array of alerts
   */
  findBySeverity(severity: string): Promise<ProjectAlert[]>;

  /**
   * Get alerts by type
   * @param type The type filter
   * @returns Array of alerts
   */
  findByType(type: string): Promise<ProjectAlert[]>;

  /**
   * Get unresolved alerts for a project
   * @param projectId The project ID
   * @returns Array of unresolved alerts
   */
  findUnresolvedByProjectId(projectId: string): Promise<ProjectAlert[]>;

  /**
   * Get alerts that need escalation
   * @returns Array of alerts needing escalation
   */
  findNeedingEscalation(): Promise<ProjectAlert[]>;

  /**
   * Get alerts assigned to a user
   * @param userId The user ID
   * @returns Array of assigned alerts
   */
  findByAssignedUser(userId: string): Promise<ProjectAlert[]>;
}
