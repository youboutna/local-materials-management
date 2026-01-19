import { Workspace } from '@/domain/entities/Workspace';

export interface IWorkspaceRepository {
  /**
   * Create a new workspace
   * @param workspace The workspace entity
   * @returns The created workspace
   */
  create(workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace>;

  /**
   * Get a workspace by ID
   * @param id The workspace ID
   * @returns The workspace or null
   */
  findById(id: string): Promise<Workspace | null>;

  /**
   * Get all workspaces
   * @returns Array of workspaces
   */
  findAll(): Promise<Workspace[]>;

  /**
   * Update a workspace
   * @param id The workspace ID
   * @param updates The updates to apply
   * @returns The updated workspace
   */
  update(id: string, updates: Partial<Workspace>): Promise<Workspace>;

  /**
   * Delete a workspace
   * @param id The workspace ID
   */
  delete(id: string): Promise<void>;

  /**
   * Get workspaces by status
   * @param status The status filter
   * @returns Array of workspaces
   */
  findByStatus(status: string): Promise<Workspace[]>;

  /**
   * Get workspaces by location
   * @param location The location filter
   * @returns Array of workspaces
   */
  findByLocation(location: string): Promise<Workspace[]>;
}
