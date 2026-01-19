import { Action } from '@/domain/entities/Workspace';

export interface IActionRepository {
  /**
   * Create a new action
   * @param action The action entity
   * @returns The created action
   */
  create(action: Omit<Action, 'id' | 'createdAt' | 'updatedAt'>): Promise<Action>;

  /**
   * Get an action by ID
   * @param id The action ID
   * @returns The action or null
   */
  findById(id: string): Promise<Action | null>;

  /**
   * Get all actions
   * @returns Array of actions
   */
  findAll(): Promise<Action[]>;

  /**
   * Update an action
   * @param id The action ID
   * @param updates The updates to apply
   * @returns The updated action
   */
  update(id: string, updates: Partial<Action>): Promise<Action>;

  /**
   * Delete an action
   * @param id The action ID
   */
  delete(id: string): Promise<void>;

  /**
   * Get actions by type
   * @param actionType The action type filter
   * @returns Array of actions
   */
  findByType(actionType: string): Promise<Action[]>;

  /**
   * Get recent actions
   * @param limit The number of recent actions to fetch
   * @returns Array of recent actions
   */
  findRecent(limit: number): Promise<Action[]>;

  /**
   * Get actions created in date range
   * @param startDate The start date
   * @param endDate The end date
   * @returns Array of actions in date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Action[]>;
}
