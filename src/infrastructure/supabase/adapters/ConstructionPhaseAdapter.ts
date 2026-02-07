/**
 * Construction Phase Supabase Adapter
 * Infrastructure adapter for construction phase operations
 * Following hexagonal architecture principles
 */

import { ConstructionPhase } from '@/domain/entities/ConstructionPhase';
import { IConstructionPhaseRepository } from '@/domain/repositories/IConstructionPhaseRepository';
import { supabase } from '@/integrations/supabase/client';
import { AppError, ErrorCode } from '@/utils/errorHandling';
/**
 * Supabase implementation of construction phase repository
 */
export class ConstructionPhaseAdapter implements IConstructionPhaseRepository {
  private tableName = 'construction_phases';

  /**
   * Create a new construction phase
   */
  async create(phase: ConstructionPhase): Promise<ConstructionPhase> {
    try {
      const phaseData = phase.toDTO();
      
      const { data, error } = await supabase
        .from(this.tableName)
        .insert({
          project_id: phaseData.projectId,
          name: phaseData.name,
          description: phaseData.description,
          type: phaseData.type,
          stage: phaseData.stage,
          status: phaseData.status,
          progress: phaseData.progress,
          start_date: phaseData.startDate,
          end_date: phaseData.endDate,
          estimated_duration: phaseData.estimatedDuration,
          actual_duration: phaseData.actualDuration,
          budget: phaseData.budget,
          actual_cost: phaseData.actualCost,
          location: phaseData.location,
          notes: phaseData.notes,
          created_at: phaseData.createdAt,
          updated_at: phaseData.updatedAt
        })
        .select()
        .single();

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to create construction phase: ${error.message}`);
      }

      if (!data) {
        throw new AppError(ErrorCode.DATABASE_ERROR, 'No data returned from create operation');
      }

      return ConstructionPhase.fromDTO({ ...data, id: data.id });
    } catch (error) {
      console.error('ConstructionPhaseAdapter.create failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create construction phase');
    }
  }

  /**
   * Update an existing construction phase
   */
  async update(id: string, phase: ConstructionPhase): Promise<ConstructionPhase> {
    try {
      const phaseData = phase.toDTO();
      
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          name: phaseData.name,
          description: phaseData.description,
          type: phaseData.type,
          stage: phaseData.stage,
          status: phaseData.status,
          progress: phaseData.progress,
          start_date: phaseData.startDate,
          end_date: phaseData.endDate,
          estimated_duration: phaseData.estimatedDuration,
          actual_duration: phaseData.actualDuration,
          budget: phaseData.budget,
          actual_cost: phaseData.actualCost,
          location: phaseData.location,
          notes: phaseData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to update construction phase: ${error.message}`);
      }

      if (!data) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Construction phase not found for update');
      }

      return ConstructionPhase.fromDTO({ ...data, id });
    } catch (error) {
      console.error('ConstructionPhaseAdapter.update failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update construction phase');
    }
  }

  /**
   * Find a construction phase by ID
   */
  async findById(id: string): Promise<ConstructionPhase | null> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find construction phase: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      return ConstructionPhase.fromDTO(data);
    } catch (error) {
      console.error('ConstructionPhaseAdapter.findById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to find construction phase');
    }
  }

  /**
   * Find all construction phases for a project
   */
  async findByProjectId(projectId: string): Promise<ConstructionPhase[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', 'asc');

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find construction phases: ${error.message}`);
      }

      return data ? data.map(phase => ConstructionPhase.fromDTO(phase)) : [];
    } catch (error) {
      console.error('ConstructionPhaseAdapter.findByProjectId failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to find construction phases');
    }
  }

  /**
   * Find all construction phases
   */
  async findAll(): Promise<ConstructionPhase[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', 'asc');

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find all construction phases: ${error.message}`);
      }

      return data ? data.map(phase => ConstructionPhase.fromDTO(phase)) : [];
    } catch (error) {
      console.error('ConstructionPhaseAdapter.findAll failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to find all construction phases');
    }
  }

  /**
   * Delete a construction phase
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to delete construction phase: ${error.message}`);
      }
    } catch (error) {
      console.error('ConstructionPhaseAdapter.delete failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete construction phase');
    }
  }

  /**
   * Get phases by status
   */
  async findByStatus(status: string): Promise<ConstructionPhase[]> {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('status', status)
        .order('created_at', 'asc');

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to find phases by status: ${error.message}`);
      }

      return data ? data.map(phase => ConstructionPhase.fromDTO(phase)) : [];
    } catch (error) {
      console.error('ConstructionPhaseAdapter.findByStatus failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to find phases by status');
    }
  }

  /**
   * Count phases by project
   */
  async countByProject(projectId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('project_id', projectId);

      if (error) {
        throw new AppError(ErrorCode.DATABASE_ERROR, `Failed to count construction phases: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('ConstructionPhaseAdapter.countByProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to count construction phases');
    }
  }
}
