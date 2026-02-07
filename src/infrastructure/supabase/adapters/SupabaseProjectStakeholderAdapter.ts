/**
 * Supabase Project Stakeholder Adapter
 * Implements IProjectStakeholderRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { ProjectStakeholderEntity } from '@/domain/entities/ProjectStakeholder';
import { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';

export class SupabaseProjectStakeholderAdapter implements IProjectStakeholderRepository {
  // ============= CRUD Operations =============

  async findById(id: string): Promise<ProjectStakeholderEntity | null> {
    if (!id || id.trim() === '') {
      return null;
    }

    const { data, error } = await supabase
      .from('project_stakeholders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapToEntity(data);
  }

  async findByProjectId(projectId: string): Promise<ProjectStakeholderEntity[]> {
    if (!projectId || projectId.trim() === '') {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('project_stakeholders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('SupabaseProjectStakeholderAdapter.findByProjectId error:', error);
        throw error;
      }

      console.log('SupabaseProjectStakeholderAdapter.findByProjectId data:', data);
      return (data || []).map(this.mapToEntity);
    } catch (error) {
      console.error('SupabaseProjectStakeholderAdapter.findByProjectId caught error:', error);
      throw error;
    }
  }

  async findByType(stakeholderType: string): Promise<ProjectStakeholderEntity[]> {
    const { data, error } = await supabase
      .from('project_stakeholders')
      .select('*')
      .eq('stakeholder_type', stakeholderType)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToEntity);
  }

  async findByEmployeeId(employeeId: string): Promise<ProjectStakeholderEntity[]> {
    const { data, error } = await supabase
      .from('project_stakeholders')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToEntity);
  }

  async findBySupplierId(supplierId: string): Promise<ProjectStakeholderEntity[]> {
    const { data, error } = await supabase
      .from('project_stakeholders')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToEntity);
  }

  async create(stakeholder: Omit<ProjectStakeholderEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectStakeholderEntity> {
    const entityData = this.mapToSupabase(stakeholder);

    const { data, error } = await supabase
      .from('project_stakeholders')
      .insert(entityData)
      .select()
      .single();

    if (error) throw error;

    return this.mapToEntity(data);
  }

  async update(id: string, updates: Partial<ProjectStakeholderEntity>): Promise<ProjectStakeholderEntity> {
    if (!id || id.trim() === '') {
      throw new Error('Invalid stakeholder ID provided');
    }

    const updateData = this.mapToSupabase(updates);

    const { data, error } = await supabase
      .from('project_stakeholders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.mapToEntity(data);
  }

  async delete(id: string): Promise<void> {
    if (!id || id.trim() === '') {
      throw new Error('Invalid stakeholder ID provided');
    }

    const { error } = await supabase
      .from('project_stakeholders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ============= Helper Methods =============

  private mapToEntity(data: any): ProjectStakeholderEntity {
    return new ProjectStakeholderEntity(
      data.id,
      data.project_id,
      data.stakeholder_type,
      data.stakeholder_entity_type,
      data.employee_id || null,
      data.supplier_id || null,
      data.external_name || null,
      data.external_email || null,
      data.external_phone || null,
      data.role_description || null,
      data.responsibilities || null,
      data.is_active ?? true,
      data.start_date || null,
      data.end_date || null,
      data.hourly_rate || null,
      data.contract_type || null,
      data.notes || null,
      data.created_at,
      data.updated_at
    );
  }

  private mapToSupabase(entity: Partial<ProjectStakeholderEntity>): any {
    return {
      project_id: entity.projectId,
      stakeholder_type: entity.stakeholderType,
      stakeholder_entity_type: entity.stakeholderEntityType,
      employee_id: entity.employeeId,
      supplier_id: entity.supplierId,
      role_description: entity.roleDescription,
      is_active: entity.isActive,
      updated_at: new Date().toISOString()
    };
  }
}
