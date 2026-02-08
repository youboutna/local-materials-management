/**
 * Supabase Milestone Adapter
 * Implements IMilestoneRepository interface using Supabase
 * Following hexagonal architecture principles
 */

import { supabase } from '@/integrations/supabase/client';
import { IMilestoneRepository, CreateMilestoneData, UpdateMilestoneData } from '@/domain/repositories/IMilestoneRepository';
import { MilestoneDTO, MilestoneStatus, MilestoneType, MilestonePriority } from '@/dtos/entities/MilestoneDTO';

export class SupabaseMilestoneAdapter implements IMilestoneRepository {
  /**
   * Find milestone by ID
   */
  async findById(id: string): Promise<MilestoneDTO | null> {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error finding milestone by ID:', error);
        return null;
      }

      return this.transformToDTO(data);
    } catch (error) {
      console.error('Unexpected error finding milestone by ID:', error);
      return null;
    }
  }

  /**
   * Find all milestones for a project
   */
  async findByProjectId(projectId: string): Promise<MilestoneDTO[]> {
    try {
      const { data, error } = await supabase
        .from('enhanced_project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('target_date', { ascending: true });

      if (error) {
        console.error('Error finding milestones by project ID:', error);
        return [];
      }

      return data ? data.map(item => this.transformToDTO(item)) : [];
    } catch (error) {
      console.error('Unexpected error finding milestones by project ID:', error);
      return [];
    }
  }

  /**
   * Find all milestones for a phase
   */
  async findByPhaseId(phaseId: string): Promise<MilestoneDTO[]> {
    try {
      const { data, error } = await supabase
        .from('enhanced_project_milestones')
        .select('*')
        .eq('phase_id', phaseId)
        .order('target_date', { ascending: true });

      if (error) {
        console.error('Error finding milestones by phase ID:', error);
        return [];
      }

      return data ? data.map(item => this.transformToDTO(item)) : [];
    } catch (error) {
      console.error('Unexpected error finding milestones by phase ID:', error);
      return [];
    }
  }

  /**
   * Find completed milestones for a project
   */
  async findCompletedByProjectId(projectId: string): Promise<MilestoneDTO[]> {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'completed')
        .order('completed_date', { ascending: true });

      if (error) {
        console.error('Error finding completed milestones by project ID:', error);
        return [];
      }

      return data ? data.map(item => this.transformToDTO(item)) : [];
    } catch (error) {
      console.error('Unexpected error finding completed milestones by project ID:', error);
      return [];
    }
  }

  /**
   * Find pending milestones for a project
   */
  async findPendingByProjectId(projectId: string): Promise<MilestoneDTO[]> {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['pending', 'in_progress'])
        .order('target_date', { ascending: true });

      if (error) {
        console.error('Error finding pending milestones by project ID:', error);
        return [];
      }

      return data ? data.map(item => this.transformToDTO(item)) : [];
    } catch (error) {
      console.error('Unexpected error finding pending milestones by project ID:', error);
      return [];
    }
  }

  /**
   * Create a new milestone
   */
  async create(data: CreateMilestoneData): Promise<MilestoneDTO> {
    try {
      const now = new Date().toISOString();
      
      const milestoneData = {
        project_id: data.project_id,
        phase_id: data.phase_id || null,
        title: data.title,
        description: data.description || null,
        target_date: data.target_date,
        completed_date: data.completed_date || null,
        status: data.status || 'pending',
        weight: data.weight || 0.5,
        dependencies: data.dependencies || [],
        notes: data.notes || null,
        created_at: now,
        updated_at: now
      };

      const { data: result, error } = await supabase
        .from('project_milestones')
        .insert(milestoneData)
        .select()
        .single();

      if (error) {
        console.error('Error creating milestone:', error);
        throw new Error(`Failed to create milestone: ${error.message}`);
      }

      return this.transformToDTO(result);
    } catch (error) {
      console.error('Unexpected error creating milestone:', error);
      throw error;
    }
  }

  /**
   * Update a milestone
   */
  async update(id: string, data: UpdateMilestoneData): Promise<MilestoneDTO | null> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from('project_milestones')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating milestone:', error);
        return null;
      }

      return this.transformToDTO(result);
    } catch (error) {
      console.error('Unexpected error updating milestone:', error);
      return null;
    }
  }

  /**
   * Delete a milestone
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_milestones')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting milestone:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Unexpected error deleting milestone:', error);
      return false;
    }
  }

  /**
   * Mark milestone as completed
   */
  async markAsCompleted(id: string, completedDate?: string): Promise<MilestoneDTO | null> {
    try {
      const updateData = {
        status: 'completed',
        completed_date: completedDate || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return await this.update(id, updateData);
    } catch (error) {
      console.error('Unexpected error marking milestone as completed:', error);
      return null;
    }
  }

  /**
   * Get milestones by status
   */
  async findByStatus(projectId: string, status: string): Promise<MilestoneDTO[]> {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', status)
        .order('target_date', { ascending: true });

      if (error) {
        console.error('Error finding milestones by status:', error);
        return [];
      }

      return data ? data.map(item => this.transformToDTO(item)) : [];
    } catch (error) {
      console.error('Unexpected error finding milestones by status:', error);
      return [];
    }
  }

  /**
   * Get milestone statistics for a project
   */
  async getStats(projectId: string): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('status, target_date')
        .eq('project_id', projectId);

      if (error) {
        console.error('Error getting milestone stats:', error);
        return { total: 0, completed: 0, pending: 0, overdue: 0 };
      }

      if (!data || data.length === 0) {
        return { total: 0, completed: 0, pending: 0, overdue: 0 };
      }

      const now = new Date();
      const stats = data.reduce((acc, milestone) => {
        acc.total++;
        
        if (milestone.status === 'completed') {
          acc.completed++;
        } else if (['pending', 'in_progress'].includes(milestone.status)) {
          acc.pending++;
          if (milestone.target_date && new Date(milestone.target_date) < now) {
            acc.overdue++;
          }
        }
        
        return acc;
      }, { total: 0, completed: 0, pending: 0, overdue: 0 });

      return stats;
    } catch (error) {
      console.error('Unexpected error getting milestone stats:', error);
      return { total: 0, completed: 0, pending: 0, overdue: 0 };
    }
  }

  /**
   * Transform database row to MilestoneDTO
   */
  private transformToDTO(data: any): MilestoneDTO {
    return {
      id: data.id,
      project_id: data.project_id,
      phase_id: data.phase_id,
      title: data.title,
      description: data.description,
      target_date: data.target_date,
      completed_date: data.completed_date,
      status: data.status,
      type: data.type || 'checkpoint', // Default to checkpoint if not specified
      priority: data.priority || 'normal', // Default to normal priority
      weight: data.weight,
      is_from_template: data.is_from_template || false, // Default to false for custom milestones
      dependencies: data.dependencies || [],
      notes: data.notes,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}
