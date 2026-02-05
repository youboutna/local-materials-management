/**
 * WorkspaceService - In-memory implementation
 * Uses local storage while database tables are pending migration
 * TODO: Replace with RepositoryFactory pattern when workspace tables are available
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  WorkspaceDTO,
  CreateWorkspaceRequestDTO,
  UpdateWorkspaceRequestDTO
} from '@/dtos/entities/WorkspaceDTO';
import { WorkspaceTransformer } from '@/dtos/transforms/WorkspaceTransformer';

export class WorkspaceService {
  private static workspaceRepository: any = null;

  /**
   * Get a workspace by ID
   */
  static async getWorkspaceById(id: string): Promise<WorkspaceDTO | null> {
    try {
      if (!this.workspaceRepository) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Workspace repository not available');
      }
      const workspace = await this.workspaceRepository.findById(id);
      return WorkspaceTransformer.toDTO(workspace);
    } catch (error) {
      console.error('Error fetching workspace:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.NOT_FOUND, 'Workspace not found');
    }
  }

  /**
   * Create a new workspace
   */
  static async createWorkspace(workspaceData: CreateWorkspaceRequestDTO): Promise<WorkspaceDTO> {
    try {
      if (!this.workspaceRepository) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Workspace repository not available');
      }
      const workspaceDataTransformed = WorkspaceTransformer.fromCreateDTO(workspaceData);
      const newWorkspace = await this.workspaceRepository.create(workspaceDataTransformed);
      return WorkspaceTransformer.toDTO(newWorkspace);
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create workspace');
    }
  }

  /**
   * Get all workspaces
   */
  static async getAllWorkspaces(): Promise<WorkspaceDTO[]> {
    try {
      const workspaces = await this.workspaceRepository.findAll();
      return workspaces.map(workspace => WorkspaceTransformer.toDTO(workspace));
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch workspaces');
    }
  }

  /**
   * Update a workspace
   */
  static async updateWorkspace(id: string, updates: UpdateWorkspaceRequestDTO): Promise<WorkspaceDTO> {
    try {
      const updatesTransformed = WorkspaceTransformer.fromUpdateDTO(updates);
      const workspace = await this.workspaceRepository.update(id, updatesTransformed);
      return WorkspaceTransformer.toDTO(workspace);
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update workspace');
    }
  }

  /**
   * Delete a workspace
   */
  static async deleteWorkspace(id: string): Promise<void> {
    try {
      await this.workspaceRepository.delete(id);
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete workspace');
    }
  }

  /**
   * Get workspaces by status
   */
  static async getWorkspacesByStatus(status: string): Promise<WorkspaceDTO[]> {
    try {
      const workspaces = await this.workspaceRepository.findByStatus(status);
      return workspaces.map(workspace => WorkspaceTransformer.toDTO(workspace));
    } catch (error) {
      console.error('Error fetching workspaces by status:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch workspaces by status');
    }
  }

  /**
   * Get workspaces by location
   */
  static async getWorkspacesByLocation(location: string): Promise<WorkspaceDTO[]> {
    try {
      const workspaces = await this.workspaceRepository.findByLocation(location);
      return workspaces.map(workspace => WorkspaceTransformer.toDTO(workspace));
    } catch (error) {
      console.error('Error fetching workspaces by location:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch workspaces by location');
    }
  }

  /**
   * Get workspace statistics
   */
  static async getWorkspaceStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byLocation: Record<string, number>;
  }> {
    try {
      const workspaces = await this.getAllWorkspaces();
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
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch workspace stats');
    }
  }

  /**
   * Search workspaces by name or location
   */
  static async searchWorkspaces(query: string): Promise<WorkspaceDTO[]> {
    try {
      const workspaces = await this.getAllWorkspaces();
      const lowerQuery = query.toLowerCase();
      
      return workspaces.filter(workspace => 
        workspace.name.toLowerCase().includes(lowerQuery) ||
        workspace.location.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching workspaces:', error);
      throw new Error('Failed to search workspaces');
    }
  }

  /**
   * Validate workspace data
   */
  static validateWorkspaceData(data: CreateWorkspaceRequestDTO | UpdateWorkspaceRequestDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if ('name' in data && (!data.name || data.name.trim().length === 0)) {
      errors.push('Workspace name is required');
    }

    if ('location' in data && (!data.location || data.location.trim().length === 0)) {
      errors.push('Workspace location is required');
    }

    if (data.contactPhone && !/^[\d\s\-\+\(\)]+$/.test(data.contactPhone)) {
      errors.push('Invalid phone number format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
