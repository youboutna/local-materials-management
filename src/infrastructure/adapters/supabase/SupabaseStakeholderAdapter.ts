/**
 * Supabase Stakeholder Adapter
 * Implements IStakeholderRepository using the canonical `project_stakeholders`
 * table (public schema). The legacy `stakeholders` table does not exist in
 * this project — using it caused HTTP 404 on edit data load.
 *
 * The rich `Stakeholder` domain entity has many fields that are not stored in
 * `project_stakeholders` (name, email, phone, organization, …). We synthesize
 * safe defaults on read and only persist the columns that exist on the table.
 */

import { supabase } from '@/integrations/supabase/client';
import { btpClient } from '@/integrations/supabase/schema-clients';
import { BtpTablesInsert } from '@/integrations/supabase/btp-types';
import { Stakeholder } from '@/domain/entities/Stakeholder';
import { IStakeholderRepository } from '@/domain/repositories/IStakeholderRepository';

const TABLE = 'project_stakeholders';

export class SupabaseStakeholderAdapter implements IStakeholderRepository {
  async save(stakeholder: Stakeholder): Promise<Stakeholder> {
    if (!stakeholder.id) return this.create(stakeholder);
    return this.update(stakeholder.id, stakeholder);
  }

  private async create(stakeholder: Omit<Stakeholder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Stakeholder> {
    const row = this.mapToSupabase(stakeholder) as BtpTablesInsert<'project_stakeholders'>;
    const { data, error } = await btpClient.from(TABLE).insert(row).select().single();
    if (error) throw error;
    return this.mapToEntity(data);
  }

  async update(id: string, data: Partial<Stakeholder>): Promise<Stakeholder> {
    if (!id) throw new Error('Invalid stakeholder ID provided');
    const row = this.mapToSupabase(data);
    const { data: updated, error } = await btpClient.from(TABLE).update(row).eq('id', id).select().single();
    if (error) throw error;
    return this.mapToEntity(updated);
  }

  async findById(id: string): Promise<Stakeholder | null> {
    if (!id) return null;
    const { data, error } = await btpClient.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? this.mapToEntity(data) : null;
  }

  async findByProjectId(projectId: string): Promise<Stakeholder[]> {
    if (!projectId) return [];
    const { data, error } = await btpClient.from(TABLE)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((d) => this.mapToEntity(d));
  }

  async findByType(type: string): Promise<Stakeholder[]> {
    const { data, error } = await btpClient.from(TABLE)
      .select('*')
      .eq('stakeholder_type', type)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((d) => this.mapToEntity(d));
  }

  async findByRole(_role: string): Promise<Stakeholder[]> {
    // `role` is encoded in `role_description` / `stakeholder_type`; we filter client-side.
    return [];
  }

  async findActiveByProjectId(projectId: string): Promise<Stakeholder[]> {
    return this.findByProjectId(projectId);
  }

  async findInternalByProjectId(projectId: string): Promise<Stakeholder[]> {
    if (!projectId) return [];
    const { data, error } = await btpClient.from(TABLE)
      .select('*')
      .eq('project_id', projectId)
      .eq('stakeholder_entity_type', 'employee')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((d) => this.mapToEntity(d));
  }

  async findExternalByProjectId(projectId: string): Promise<Stakeholder[]> {
    if (!projectId) return [];
    const { data, error } = await btpClient.from(TABLE)
      .select('*')
      .eq('project_id', projectId)
      .neq('stakeholder_entity_type', 'employee')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((d) => this.mapToEntity(d));
  }

  async findPrimaryByProjectId(projectId: string): Promise<Stakeholder[]> {
    if (!projectId) return [];
    const { data, error } = await btpClient.from(TABLE)
      .select('*')
      .eq('project_id', projectId)
      .eq('is_primary', true)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((d) => this.mapToEntity(d));
  }

  async delete(id: string): Promise<void> {
    if (!id) throw new Error('Invalid stakeholder ID provided');
    const { error } = await btpClient.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  }

  async exists(id: string): Promise<boolean> {
    if (!id) return false;
    const { data, error } = await btpClient.from(TABLE).select('id').eq('id', id).maybeSingle();
    if (error) throw error;
    return !!data;
  }

  async countByProjectId(projectId: string): Promise<number> {
    if (!projectId) return 0;
    const { count, error } = await btpClient.from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId);
    if (error) throw error;
    return count || 0;
  }

  async countByType(type: string): Promise<number> {
    const { count, error } = await btpClient.from(TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('stakeholder_type', type);
    if (error) throw error;
    return count || 0;
  }

  // ============= Mappers =============

  private mapToEntity(data: Record<string, any>): Stakeholder {
    const stakeholderType = (data.stakeholder_entity_type === 'employee' ? 'employee' : 'supplier') as any;
    return new Stakeholder(
      data.id,
      data.project_id,
      stakeholderType,
      (data.stakeholder_type || data.role_description || 'observer') as any,
      data.supplier_id || null,
      data.employee_id || null,
      !!data.is_primary,
      data.stakeholder_entity_type === 'employee',
      { name: data.role_description || '', email: '', phone: undefined, position: undefined },
      null,
      [],
      'read',
      null,
      null,
      null,
      null,
      null,
      true,
      data.created_at,
      data.updated_at,
    );
  }

  private mapToSupabase(entity: Partial<Stakeholder>): Record<string, unknown> {
    const e: any = entity;
    return {
      project_id: e.projectId,
      stakeholder_type: e.type || e.stakeholderType || 'contractor',
      stakeholder_entity_type: e.isInternal ? 'employee' : (e.entityType || 'supplier'),
      employee_id: e.employeeId ?? null,
      supplier_id: e.organizationId ?? e.supplierId ?? null,
      role_description: e.contact?.name || e.role || null,
      is_primary: !!e.isPrimary,
      updated_at: new Date().toISOString(),
    };
  }
}
