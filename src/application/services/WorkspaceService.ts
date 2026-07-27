/**
 * WorkspaceService - Hexagonal Architecture Implementation
 * Follows PROMPTS.md Rule #1: Arrow Flow Pattern
 * Service → Repository → Domain ← Infrastructure
 */

import { OperationalStatus } from '@/domain/entities/Workspace';
import {
    CreateWorkspaceRequestDTO,
    UpdateWorkspaceRequestDTO,
    WorkspaceDTO
} from '@/dtos/entities/WorkspaceDTO';
import { WorkspaceTransformer } from '@/dtos/transforms/WorkspaceTransformer';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class WorkspaceService {
  private workspaceRepository: any;

  constructor() {
    try {
      this.workspaceRepository = RepositoryFactory.getWorkspaceRepository();
    } catch (error) {
      console.warn('Workspace repository not available, using fallback implementation');
      this.workspaceRepository = null;
    }
  }

  /**
   * Get a workspace by ID
   */
  async getWorkspaceById(id: string): Promise<WorkspaceDTO | null> {
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
  async createWorkspace(workspaceData: CreateWorkspaceRequestDTO): Promise<WorkspaceDTO> {
    try {
      if (!this.workspaceRepository) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Workspace repository not available');
      }
      
      // Validate workspace data
      const validation = this.validateWorkspaceData(workspaceData);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, validation.errors.join(', '));
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
  async getAllWorkspaces(): Promise<WorkspaceDTO[]> {
    try {
      if (!this.workspaceRepository) {
        // Fallback to empty array if repository not available
        return [];
      }
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
  async updateWorkspace(id: string, updates: UpdateWorkspaceRequestDTO): Promise<WorkspaceDTO> {
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
  async deleteWorkspace(id: string): Promise<void> {
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
  async getWorkspacesByStatus(status: OperationalStatus): Promise<WorkspaceDTO[]> {
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
  async getWorkspacesByLocation(locationCode: string): Promise<WorkspaceDTO[]> {
    try {
      const workspaces = await this.workspaceRepository.findByLocation(locationCode);
      return workspaces.map(workspace => WorkspaceTransformer.toDTO(workspace));
    } catch (error) {
      console.error('Error fetching workspaces by location:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch workspaces by location');
    }
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    closed: number;
    byLocation: Record<string, number>;
  }> {
    try {
      const workspaces = await this.getAllWorkspaces();
      const stats = {
        total: workspaces.length,
        active: workspaces.filter(w => w.status === OperationalStatus.active).length,
        inactive: workspaces.filter(w => w.status === OperationalStatus.inactive).length,
        closed: workspaces.filter(w => w.status === OperationalStatus.closed).length,
        byLocation: {} as Record<string, number>
      };

      workspaces.forEach(workspace => {
        const locationKey = workspace.location.name;
        if (stats.byLocation[locationKey]) {
          stats.byLocation[locationKey]++;
        } else {
          stats.byLocation[locationKey] = 1;
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
  async searchWorkspaces(query: string): Promise<WorkspaceDTO[]> {
    try {
      const workspaces = await this.getAllWorkspaces();
      const lowerQuery = query.toLowerCase();
      
      return workspaces.filter(workspace => 
        workspace.name.toLowerCase().includes(lowerQuery) ||
        workspace.location.name.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching workspaces:', error);
      throw new Error('Failed to search workspaces');
    }
  }

  /**
   * Validate workspace data
   */
  validateWorkspaceData(data: CreateWorkspaceRequestDTO | UpdateWorkspaceRequestDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if ('name' in data && (!data.name || data.name.trim().length === 0)) {
      errors.push('Workspace name is required');
    }

    if ('workspaceId' in data && (!data.workspaceId || data.workspaceId.trim().length === 0)) {
      errors.push('Workspace ID is required');
    }

    if ('workspaceCode' in data && (!data.workspaceCode || data.workspaceCode.trim().length === 0)) {
      errors.push('Workspace code is required');
    }

    if ('location' in data && (!data.location || !data.location.code)) {
      errors.push('Workspace location is required');
    }

    if (data.contact && data.contact.phone && !/^[\d\s\-+()]+$/.test(data.contact.phone)) {
      errors.push('Invalid phone number format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
