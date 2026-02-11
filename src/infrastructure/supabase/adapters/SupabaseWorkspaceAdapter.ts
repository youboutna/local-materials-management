/**
 * Supabase Workspace Repository Adapter
 * Hexagonal Architecture - Infrastructure Layer
 * 
 * Implements IWorkspaceRepository interface using Supabase
 * Provides CRUD operations for workspace entities
 */

import { IWorkspaceRepository } from '@/domain/repositories/IWorkspaceRepository';
import { WorkspaceDTO, CreateWorkspaceDTO, UpdateWorkspaceDTO } from '@/dtos/entities/WorkspaceDTO';
import { WorkspaceTransformer } from '@/dtos/transforms/WorkspaceTransformer';
import { supabase } from '@/integrations/supabase/client';

/**
 * Supabase implementation of Workspace Repository
 * Follows hexagonal architecture principles
 */
export class SupabaseWorkspaceAdapter implements IWorkspaceRepository {
  /**
   * Create a new workspace
   */
  async create(workspaceDTO: CreateWorkspaceDTO): Promise<WorkspaceDTO> {
    try {
      const entity = WorkspaceTransformer.fromCreateDTOToEntity(workspaceDTO);
      
      const { data, error } = await supabase
        .from('workspaces')
        .insert([entity])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create workspace: ${error.message}`);
      }

      return WorkspaceTransformer.toDTO(data);
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.create error:', error);
      throw error;
    }
  }

  /**
   * Get workspace by ID
   */
  async findById(id: string): Promise<WorkspaceDTO | null> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to find workspace: ${error.message}`);
      }

      return WorkspaceTransformer.toDTO(data);
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.findById error:', error);
      throw error;
    }
  }

  /**
   * Get all workspaces
   */
  async findAll(): Promise<WorkspaceDTO[]> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch workspaces: ${error.message}`);
      }

      return data.map(WorkspaceTransformer.toDTO);
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.findAll error:', error);
      throw error;
    }
  }

  /**
   * Update an existing workspace
   */
  async update(id: string, updateDTO: UpdateWorkspaceDTO): Promise<WorkspaceDTO> {
    try {
      const entity = WorkspaceTransformer.fromUpdateDTOToEntity(updateDTO);
      
      const { data, error } = await supabase
        .from('workspaces')
        .update(entity)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update workspace: ${error.message}`);
      }

      return WorkspaceTransformer.toDTO(data);
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.update error:', error);
      throw error;
    }
  }

  /**
   * Delete a workspace
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete workspace: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.delete error:', error);
      throw error;
    }
  }

  /**
   * Get workspaces by owner ID
   */
  async findByOwnerId(ownerId: string): Promise<WorkspaceDTO[]> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch owner workspaces: ${error.message}`);
      }

      return data.map(WorkspaceTransformer.toDTO);
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.findByOwnerId error:', error);
      throw error;
    }
  }

  /**
   * Get workspaces by project ID
   */
  async findByProjectId(projectId: string): Promise<WorkspaceDTO[]> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch project workspaces: ${error.message}`);
      }

      return data.map(WorkspaceTransformer.toDTO);
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.findByProjectId error:', error);
      throw error;
    }
  }

  /**
   * Get active workspaces
   */
  async findActive(): Promise<WorkspaceDTO[]> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch active workspaces: ${error.message}`);
      }

      return data.map(WorkspaceTransformer.toDTO);
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.findActive error:', error);
      throw error;
    }
  }

  /**
   * Get workspace by type
   */
  async findByType(type: string): Promise<WorkspaceDTO[]> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('workspace_type', type)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch workspaces by type: ${error.message}`);
      }

      return data.map(WorkspaceTransformer.toDTO);
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.findByType error:', error);
      throw error;
    }
  }

  /**
   * Update workspace status
   */
  async updateStatus(id: string, status: string): Promise<WorkspaceDTO> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update workspace status: ${error.message}`);
      }

      return WorkspaceTransformer.toDTO(data);
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.updateStatus error:', error);
      throw error;
    }
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStatistics(): Promise<{
    totalWorkspaces: number;
    activeWorkspaces: number;
    workspacesByType: Record<string, number>;
    workspacesByStatus: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('workspace_type, status, is_active');

      if (error) {
        throw new Error(`Failed to fetch workspace statistics: ${error.message}`);
      }

      const totalWorkspaces = data.length;
      const activeWorkspaces = data.filter(w => w.is_active).length;
      
      const workspacesByType = data.reduce((acc, workspace) => {
        const type = workspace.workspace_type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const workspacesByStatus = data.reduce((acc, workspace) => {
        const status = workspace.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalWorkspaces,
        activeWorkspaces,
        workspacesByType,
        workspacesByStatus
      };
    } catch (error) {
      console.error('SupabaseWorkspaceAdapter.getWorkspaceStatistics error:', error);
      throw error;
    }
  }
}
