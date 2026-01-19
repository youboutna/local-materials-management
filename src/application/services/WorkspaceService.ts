import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { IWorkspaceRepository } from '@/domain/repositories/IWorkspaceRepository';
import { Workspace } from '@/domain/entities/Workspace';
import { WorkspaceDTO, CreateWorkspaceRequestDto, UpdateWorkspaceRequestDto } from '@/dtos/transforms/shared';
import { WorkspaceDomainTransformer } from '@/dtos/transforms/WorkspaceDomainTransformer';

export class WorkspaceService {
  private workspaceRepository: IWorkspaceRepository;
  private workspaceTransformer: WorkspaceDomainTransformer;

  constructor() {
    this.workspaceRepository = RepositoryFactory.getWorkspaceRepository();
    this.workspaceTransformer = new WorkspaceDomainTransformer();
  }

  /**
   * Create a new workspace
   * @param workspaceData The workspace data
   * @returns The created workspace DTO
   */
  async createWorkspace(workspaceData: CreateWorkspaceRequestDto): Promise<WorkspaceDTO> {
    try {
      const entity = this.workspaceTransformer.fromCreateDtoToEntity(workspaceData);
      const createdWorkspace = await this.workspaceRepository.create(entity);
      return this.workspaceTransformer.toDTO(createdWorkspace);
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw new Error(`Failed to create workspace: ${error.message}`);
    }
  }

  /**
   * Get a workspace by ID
   * @param id The workspace ID
   * @returns The workspace DTO or null
   */
  async getWorkspaceById(id: string): Promise<WorkspaceDTO | null> {
    try {
      const workspace = await this.workspaceRepository.findById(id);
      return workspace ? this.workspaceTransformer.toDTO(workspace) : null;
    } catch (error) {
      console.error('Error fetching workspace:', error);
      throw new Error(`Failed to fetch workspace: ${error.message}`);
    }
  }

  /**
   * Get all workspaces
   * @returns Array of workspace DTOs
   */
  async getAllWorkspaces(): Promise<WorkspaceDTO[]> {
    try {
      const workspaces = await this.workspaceRepository.findAll();
      return workspaces.map(workspace => this.workspaceTransformer.toDTO(workspace));
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw new Error(`Failed to fetch workspaces: ${error.message}`);
    }
  }

  /**
   * Update a workspace
   * @param id The workspace ID
   * @param updates The updates to apply
   * @returns The updated workspace DTO
   */
  async updateWorkspace(id: string, updates: UpdateWorkspaceRequestDto): Promise<WorkspaceDTO> {
    try {
      const entityUpdates = this.workspaceTransformer.fromUpdateDtoToEntity(updates);
      const updatedWorkspace = await this.workspaceRepository.update(id, entityUpdates);
      return this.workspaceTransformer.toDTO(updatedWorkspace);
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw new Error(`Failed to update workspace: ${error.message}`);
    }
  }

  /**
   * Delete a workspace
   * @param id The workspace ID
   */
  async deleteWorkspace(id: string): Promise<void> {
    try {
      await this.workspaceRepository.delete(id);
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw new Error(`Failed to delete workspace: ${error.message}`);
    }
  }

  /**
   * Get workspaces by status
   * @param status The status filter
   * @returns Array of workspace DTOs
   */
  async getWorkspacesByStatus(status: string): Promise<WorkspaceDTO[]> {
    try {
      const workspaces = await this.workspaceRepository.findByStatus(status);
      return workspaces.map(workspace => this.workspaceTransformer.toDTO(workspace));
    } catch (error) {
      console.error('Error fetching workspaces by status:', error);
      throw new Error(`Failed to fetch workspaces by status: ${error.message}`);
    }
  }

  /**
   * Get workspaces by location
   * @param location The location filter
   * @returns Array of workspace DTOs
   */
  async getWorkspacesByLocation(location: string): Promise<WorkspaceDTO[]> {
    try {
      const workspaces = await this.workspaceRepository.findByLocation(location);
      return workspaces.map(workspace => this.workspaceTransformer.toDTO(workspace));
    } catch (error) {
      console.error('Error fetching workspaces by location:', error);
      throw new Error(`Failed to fetch workspaces by location: ${error.message}`);
    }
  }

  /**
   * Get workspace statistics
   * @returns Statistics object
   */
  async getWorkspaceStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byLocation: Record<string, number>;
  }> {
    try {
      const workspaces = await this.workspaceRepository.findAll();
      const stats = {
        total: workspaces.length,
        active: workspaces.filter(w => w.status === 'active').length,
        inactive: workspaces.filter(w => w.status === 'inactive').length,
        byLocation: {} as Record<string, number>
      };

      workspaces.forEach(workspace => {
        if (stats.byLocation[workspace.location]) {
          stats.byLocation[workspace.location]++;
        } else {
          stats.byLocation[workspace.location] = 1;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching workspace stats:', error);
      throw new Error(`Failed to fetch workspace stats: ${error.message}`);
    }
  }

  /**
   * Search workspaces by name or location
   * @param query The search query
   * @returns Array of matching workspace DTOs
   */
  async searchWorkspaces(query: string): Promise<WorkspaceDTO[]> {
    try {
      const workspaces = await this.workspaceRepository.findAll();
      const lowerQuery = query.toLowerCase();
      
      const filteredWorkspaces = workspaces.filter(workspace => 
        workspace.name.toLowerCase().includes(lowerQuery) ||
        workspace.location.toLowerCase().includes(lowerQuery)
      );

      return filteredWorkspaces.map(workspace => this.workspaceTransformer.toDTO(workspace));
    } catch (error) {
      console.error('Error searching workspaces:', error);
      throw new Error(`Failed to search workspaces: ${error.message}`);
    }
  }

  /**
   * Validate workspace data
   * @param data The workspace data to validate
   * @returns Validation result
   */
  validateWorkspaceData(data: CreateWorkspaceRequestDto | UpdateWorkspaceRequestDto): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push('Workspace name is required');
    }

    if (!data.location || data.location.trim().length === 0) {
      errors.push('Workspace location is required');
    }

    if (data.contact_phone && !/^[\d\s\-\+\(\)]+$/.test(data.contact_phone)) {
      errors.push('Invalid phone number format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
