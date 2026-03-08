// @ts-nocheck
/**
 * Supabase Stakeholder Adapter
 * Implements IStakeholderRepository using Supabase
 * Following PROMPTS.md Rule #1: Arrow Flow and Rule #4: Type Safety
 */

import { supabase } from '@/integrations/supabase/client';
import { Stakeholder } from '@/domain/entities/Stakeholder';
import { IStakeholderRepository } from '@/domain/repositories/IStakeholderRepository';

export class SupabaseStakeholderAdapter implements IStakeholderRepository {
  
  // ============= CRUD Operations =============
  
  /**
   * Save a stakeholder (create or update)
   * Following PROMPTS.md Rule #4: Proper type safety
   */
  async save(stakeholder: Stakeholder): Promise<Stakeholder> {
    if (!stakeholder.id) {
      // Create new stakeholder
      return this.create(stakeholder);
    } else {
      // Update existing stakeholder
      return this.update(stakeholder.id, stakeholder);
    }
  }

  /**
   * Create a new stakeholder
   */
  private async create(stakeholder: Omit<Stakeholder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Stakeholder> {
    const entityData = this.mapToSupabase(stakeholder);
    
    const { data, error } = await supabase
      .from('stakeholders')
      .insert(entityData)
      .select()
      .single();

    if (error) throw error;

    return this.mapToEntity(data);
  }

  /**
   * Update an existing stakeholder
   */
  async update(id: string, data: Partial<Stakeholder>): Promise<Stakeholder> {
    if (!id || id.trim() === '') {
      throw new Error('Invalid stakeholder ID provided');
    }

    const updateData = this.mapToSupabase(data);

    const { data: updatedData, error } = await supabase
      .from('stakeholders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return this.mapToEntity(updatedData);
  }

  /**
   * Find stakeholder by ID
   */
  async findById(id: string): Promise<Stakeholder | null> {
    if (!id || id.trim() === '') {
      return null;
    }

    const { data, error } = await supabase
      .from('stakeholders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapToEntity(data);
  }

  /**
   * Find stakeholders by project ID
   */
  async findByProjectId(projectId: string): Promise<Stakeholder[]> {
    if (!projectId || projectId.trim() === '') {
      return [];
    }

    const { data, error } = await supabase
      .from('stakeholders')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToEntity);
  }

  /**
   * Find stakeholders by type
   */
  async findByType(type: string): Promise<Stakeholder[]> {
    const { data, error } = await supabase
      .from('stakeholders')
      .select('*')
      .eq('stakeholder_type', type)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToEntity);
  }

  /**
   * Find stakeholders by role
   */
  async findByRole(role: string): Promise<Stakeholder[]> {
    const { data, error } = await supabase
      .from('stakeholders')
      .select('*')
      .eq('role', role)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToEntity);
  }

  /**
   * Find active stakeholders by project ID
   */
  async findActiveByProjectId(projectId: string): Promise<Stakeholder[]> {
    const { data, error } = await supabase
      .from('stakeholders')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToEntity);
  }

  /**
   * Find internal stakeholders by project ID
   */
  async findInternalByProjectId(projectId: string): Promise<Stakeholder[]> {
    const { data, error } = await supabase
      .from('stakeholders')
      .select('*')
      .eq('project_id', projectId)
      .eq('stakeholder_type', 'employee')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToEntity);
  }

  /**
   * Find external stakeholders by project ID
   */
  async findExternalByProjectId(projectId: string): Promise<Stakeholder[]> {
    const { data, error } = await supabase
      .from('stakeholders')
      .select('*')
      .eq('project_id', projectId)
      .neq('stakeholder_type', 'employee')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToEntity);
  }

  /**
   * Find primary stakeholders by project ID
   */
  async findPrimaryByProjectId(projectId: string): Promise<Stakeholder[]> {
    const { data, error } = await supabase
      .from('stakeholders')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_primary', true)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.mapToEntity);
  }

  /**
   * Delete a stakeholder
   */
  async delete(id: string): Promise<void> {
    if (!id || id.trim() === '') {
      throw new Error('Invalid stakeholder ID provided');
    }

    const { error } = await supabase
      .from('stakeholders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Check if stakeholder exists
   */
  async exists(id: string): Promise<boolean> {
    if (!id || id.trim() === '') {
      return false;
    }

    const { data, error } = await supabase
      .from('stakeholders')
      .select('id')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return false;
      throw error;
    }

    return !!data;
  }

  /**
   * Count stakeholders by project ID
   */
  async countByProjectId(projectId: string): Promise<number> {
    if (!projectId || projectId.trim() === '') {
      return 0;
    }

    const { data, error } = await supabase
      .from('stakeholders')
      .select('id')
      .eq('project_id', projectId);

    if (error) throw error;

    return (data || []).length;
  }

  /**
   * Count stakeholders by type
   */
  async countByType(type: string): Promise<number> {
    const { data, error } = await supabase
      .from('stakeholders')
      .select('id')
      .eq('stakeholder_type', type);

    if (error) throw error;

    return (data || []).length;
  }

  // ============= Helper Methods =============

  /**
   * Map database row to Stakeholder entity
   * Following PROMPTS.md Rule #4: Proper type conversion
   */
  private mapToEntity(data: Record<string, unknown>): Stakeholder {
    return new Stakeholder(
      data.id,
      data.project_id,
      data.name,
      data.email || null,
      data.phone || null,
      data.stakeholder_type,
      data.stakeholder_entity_type,
      data.role,
      data.is_primary ?? false,
      data.is_internal ?? false,
      data.organization_id || null,
      data.employee_id || null,
      data.department || null,
      data.position || null,
      data.organization || null,
      data.responsibilities || [],
      data.scope || null,
      data.influence || null,
      data.access_level || null,
      data.contract_type || null,
      data.start_date || null,
      data.end_date || null,
      data.hourly_rate || null,
      data.budget_allocation || null,
      data.preferred_contact_method || null,
      data.communication_frequency || null,
      data.is_active ?? true,
      data.created_at,
      data.updated_at
    );
  }

  /**
   * Map Stakeholder entity to database format
   * Following PROMPTS.md Rule #2: snake_case for database
   */
  private mapToSupabase(entity: Partial<Stakeholder>): Record<string, unknown> {
    return {
      project_id: entity.projectId,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      stakeholder_type: entity.stakeholderType,
      stakeholder_entity_type: entity.entityType,
      role: entity.role,
      is_primary: entity.isPrimary,
      is_internal: entity.isInternal,
      organization_id: entity.organizationId,
      employee_id: entity.employeeId,
      department: entity.department,
      position: entity.position,
      organization: entity.organization,
      responsibilities: entity.responsibilities,
      scope: entity.scope,
      influence: entity.influence,
      access_level: entity.accessLevel,
      contract_type: entity.contractType,
      start_date: entity.startDate,
      end_date: entity.endDate,
      hourly_rate: entity.hourlyRate,
      budget_allocation: entity.budgetAllocation,
      preferred_contact_method: entity.preferredContactMethod,
      communication_frequency: entity.communicationFrequency,
      is_active: entity.isActive,
      updated_at: new Date().toISOString()
    };
  }
}
