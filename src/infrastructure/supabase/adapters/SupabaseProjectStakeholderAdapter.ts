/**
 * Supabase Project Stakeholder Adapter
 * Implements IProjectStakeholderRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { ProjectStakeholderEntity } from '@/domain/entities/ProjectStakeholder';
import { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';

// Database row interface for project_stakeholders table
interface ProjectStakeholderRow {
  id: string;
  project_id: string;
  stakeholder_type: string;
  stakeholder_entity_type: string;
  employee_id?: string | null;
  supplier_id?: string | null;
  external_name?: string | null;
  external_email?: string | null;
  external_phone?: string | null;
  role_description?: string | null;
  responsibilities?: string[] | null;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  hourly_rate?: number | null;
  contract_type?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Supabase insert/update data interface
interface ProjectStakeholderInsertData {
  project_id?: string;
  stakeholder_type?: string;
  stakeholder_entity_type?: string;
  employee_id?: string | null;
  supplier_id?: string | null;
  external_name?: string | null;
  external_email?: string | null;
  external_phone?: string | null;
  role_description?: string | null;
  responsibilities?: string[] | null;
  is_active?: boolean;
  start_date?: string | null;
  end_date?: string | null;
  hourly_rate?: number | null;
  contract_type?: string | null;
  notes?: string | null;
  updated_at?: string;
}

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

  async findAll(filters?: {
    projectId?: string;
    stakeholderType?: string;
    isActive?: boolean;
  }): Promise<ProjectStakeholderEntity[]> {
    let query = supabase
      .from('project_stakeholders')
      .select('*')
      .order('created_at', { ascending: true });

    if (filters?.projectId) {
      query = query.eq('project_id', filters.projectId);
    }
    if (filters?.stakeholderType) {
      query = query.eq('stakeholder_type', filters.stakeholderType);
    }
    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(this.mapToEntity);
  }

  async search(criteria: {
    projectId?: string;
    searchTerm?: string;
    stakeholderType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    stakeholders: ProjectStakeholderEntity[];
    total: number;
  }> {
    let query = supabase
      .from('project_stakeholders')
      .select('*', { count: 'exact' });

    if (criteria.projectId) {
      query = query.eq('project_id', criteria.projectId);
    }
    if (criteria.stakeholderType) {
      query = query.eq('stakeholder_type', criteria.stakeholderType);
    }
    if (criteria.searchTerm) {
      query = query.or(`external_name.ilike.%${criteria.searchTerm}%,role_description.ilike.%${criteria.searchTerm}%`);
    }

    if (criteria.offset) {
      query = query.range(criteria.offset, (criteria.offset + (criteria.limit || 10)) - 1);
    } else if (criteria.limit) {
      query = query.limit(criteria.limit);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      stakeholders: (data || []).map(this.mapToEntity),
      total: count || 0
    };
  }

  async exists(id: string): Promise<boolean> {
    if (!id || id.trim() === '') {
      return false;
    }

    const { data, error } = await supabase
      .from('project_stakeholders')
      .select('id')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }

    return !!data;
  }

  async countByProject(projectId: string): Promise<number> {
    if (!projectId || projectId.trim() === '') {
      return 0;
    }

    const { data, error } = await supabase
      .from('project_stakeholders')
      .select('id', { count: 'exact' })
      .eq('project_id', projectId);

    if (error) throw error;

    return data?.length || 0;
  }

  // ============= Helper Methods =============

  private mapToEntity(data: ProjectStakeholderRow): ProjectStakeholderEntity {
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

  private mapToSupabase(entity: Partial<ProjectStakeholderEntity>): ProjectStakeholderInsertData {
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
