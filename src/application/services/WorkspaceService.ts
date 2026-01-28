/**
 * WorkspaceService - In-memory implementation
 * Uses local storage while database tables are pending migration
 */

import { supabase } from '@/integrations/supabase/client';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface WorkspaceDTO {
  id: string;
  name: string;
  location: string;
  description?: string | null;
  status: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  capacity?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateWorkspaceRequestDto {
  name: string;
  location: string;
  description?: string | null;
  status?: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  capacity?: number | null;
}

export interface UpdateWorkspaceRequestDto {
  name?: string;
  location?: string;
  description?: string | null;
  status?: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  capacity?: number | null;
}

// In-memory store
const workspacesStore = new Map<string, WorkspaceDTO>();

export class WorkspaceService {
  /**
   * Create a new workspace
   */
  static async createWorkspace(workspaceData: CreateWorkspaceRequestDto): Promise<WorkspaceDTO> {
    try {
      const id = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const newWorkspace: WorkspaceDTO = {
        id,
        name: workspaceData.name,
        location: workspaceData.location,
        description: workspaceData.description || null,
        status: workspaceData.status || 'active',
        contact_phone: workspaceData.contact_phone || null,
        contact_email: workspaceData.contact_email || null,
        capacity: workspaceData.capacity || null,
        created_at: now,
        updated_at: now
      };

      workspacesStore.set(id, newWorkspace);
      return newWorkspace;
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to create workspace: ${(error as Error).message}`);
    }
  }

  /**
   * Get a workspace by ID
   */
  static async getWorkspaceById(id: string): Promise<WorkspaceDTO | null> {
    try {
      return workspacesStore.get(id) || null;
    } catch (error) {
      console.error('Error fetching workspace:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to fetch workspace: ${(error as Error).message}`);
    }
  }

  /**
   * Get all workspaces
   */
  static async getAllWorkspaces(): Promise<WorkspaceDTO[]> {
    try {
      const workspaces: WorkspaceDTO[] = [];
      workspacesStore.forEach((workspace) => {
        workspaces.push(workspace);
      });
      return workspaces;
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to fetch workspaces: ${(error as Error).message}`);
    }
  }

  /**
   * Update a workspace
   */
  static async updateWorkspace(id: string, updates: UpdateWorkspaceRequestDto): Promise<WorkspaceDTO> {
    try {
      const existing = workspacesStore.get(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Workspace not found');
      }

      const updatedWorkspace: WorkspaceDTO = {
        ...existing,
        ...updates,
        updated_at: new Date().toISOString()
      };

      workspacesStore.set(id, updatedWorkspace);
      return updatedWorkspace;
    } catch (error) {
      console.error('Error updating workspace:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to update workspace: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a workspace
   */
  static async deleteWorkspace(id: string): Promise<void> {
    try {
      workspacesStore.delete(id);
    } catch (error) {
      console.error('Error deleting workspace:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to delete workspace: ${(error as Error).message}`);
    }
  }

  /**
   * Get workspaces by status
   */
  static async getWorkspacesByStatus(status: string): Promise<WorkspaceDTO[]> {
    try {
      const workspaces: WorkspaceDTO[] = [];
      workspacesStore.forEach((workspace) => {
        if (workspace.status === status) {
          workspaces.push(workspace);
        }
      });
      return workspaces;
    } catch (error) {
      console.error('Error fetching workspaces by status:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to fetch workspaces by status: ${(error as Error).message}`);
    }
  }

  /**
   * Get workspaces by location
   */
  static async getWorkspacesByLocation(location: string): Promise<WorkspaceDTO[]> {
    try {
      const workspaces: WorkspaceDTO[] = [];
      const lowerLocation = location.toLowerCase();
      workspacesStore.forEach((workspace) => {
        if (workspace.location.toLowerCase().includes(lowerLocation)) {
          workspaces.push(workspace);
        }
      });
      return workspaces;
    } catch (error) {
      console.error('Error fetching workspaces by location:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to fetch workspaces by location: ${(error as Error).message}`);
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
      throw new AppError(ErrorCode.INTERNAL_ERROR, `Failed to fetch workspace stats: ${(error as Error).message}`);
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
      throw new Error(`Failed to search workspaces: ${(error as Error).message}`);
    }
  }

  /**
   * Validate workspace data
   */
  static validateWorkspaceData(data: CreateWorkspaceRequestDto | UpdateWorkspaceRequestDto): {
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

    if (data.contact_phone && !/^[\d\s\-\+\(\)]+$/.test(data.contact_phone)) {
      errors.push('Invalid phone number format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
