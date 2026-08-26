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
import { IStakeholderRepository, StakeholderAssignment } from '@/domain/repositories/IStakeholderRepository';

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
    return this.hydrate(data || []);
  }

  async findByType(type: string): Promise<Stakeholder[]> {
    const { data, error } = await btpClient.from(TABLE)
      .select('*')
      .eq('stakeholder_type', type)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return this.hydrate(data || []);
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
    return this.hydrate(data || []);
  }

  async findExternalByProjectId(projectId: string): Promise<Stakeholder[]> {
    if (!projectId) return [];
    const { data, error } = await btpClient.from(TABLE)
      .select('*')
      .eq('project_id', projectId)
      .neq('stakeholder_entity_type', 'employee')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return this.hydrate(data || []);
  }

  async findPrimaryByProjectId(projectId: string): Promise<Stakeholder[]> {
    if (!projectId) return [];
    const { data, error } = await btpClient.from(TABLE)
      .select('*')
      .eq('project_id', projectId)
      .eq('is_primary', true)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return this.hydrate(data || []);
  }

  /**
   * Hydrate les identités depuis les référentiels (employés, fournisseurs,
   * organisations) : `project_stakeholders` ne stocke que des identifiants,
   * l'UI ne doit jamais afficher un UUID ni un rôle technique nu.
   */
  private async hydrate(rows: Record<string, any>[]): Promise<Stakeholder[]> {
    if (rows.length === 0) return [];

    const ids = (key: string) =>
      Array.from(new Set(rows.map((r) => r?.[key]).filter((v): v is string => typeof v === 'string' && !!v)));

    const employeeIds = ids('employee_id');
    const supplierIds = ids('supplier_id');
    const organizationIds = ids('organization_id');

    const safeFetch = async (
      table: string,
      columns: string,
      values: string[],
    ): Promise<Record<string, any>[]> => {
      if (values.length === 0) return [];
      try {
        const { data, error } = await btpClient.from(table as any).select(columns).in('id', values);
        if (error) throw error;
        return (data as unknown as Record<string, any>[]) || [];
      } catch {
        return [];
      }
    };

    const [employees, suppliers, organizations] = await Promise.all([
      safeFetch('employees', 'id, full_name, email, phone, position', employeeIds),
      safeFetch('suppliers', 'id, name, email, phone', supplierIds),
      safeFetch('organizations', 'id, name', organizationIds),
    ]);

    const byId = (list: Record<string, any>[]) => new Map(list.map((r) => [String(r.id), r]));
    const employeeMap = byId(employees);
    const supplierMap = byId(suppliers);
    const organizationMap = byId(organizations);

    return rows.map((row) => {
      const employee = row.employee_id ? employeeMap.get(String(row.employee_id)) : undefined;
      const supplier = row.supplier_id ? supplierMap.get(String(row.supplier_id)) : undefined;
      const organization = row.organization_id ? organizationMap.get(String(row.organization_id)) : undefined;
      return this.mapToEntity(row, {
        name:
          employee?.full_name ||
          supplier?.name ||
          organization?.name ||
          row.external_name ||
          null,
        email: employee?.email || supplier?.email || row.external_email || null,
        phone: employee?.phone || supplier?.phone || row.external_phone || null,
        position: employee?.position || null,
        organizationName: organization?.name || supplier?.name || null,
      });
    });
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

  /** Met à jour uniquement le rôle métier (`stakeholder_type`). */
  async setBusinessRole(id: string, businessRole: string): Promise<Stakeholder> {
    if (!id) throw new Error('Invalid stakeholder ID provided');
    const { data, error } = await btpClient.from(TABLE)
      .update({ stakeholder_type: businessRole, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return this.mapToEntity(data);
  }

  /** Projection légère des affectations pour des rôles métier donnés. */
  async findAssignmentsByBusinessRoles(businessRoles: string[]): Promise<StakeholderAssignment[]> {
    if (!businessRoles?.length) return [];
    const { data, error } = await btpClient.from(TABLE)
      .select('id, project_id, stakeholder_type, stakeholder_entity_type, employee_id, supplier_id, external_name, role_description')
      .in('stakeholder_type', businessRoles);
    if (error) throw error;
    return (data || []).map((row: Record<string, any>) => ({
      id: row.id,
      projectId: row.project_id,
      businessRole: String(row.stakeholder_type ?? ''),
      entityType: String(row.stakeholder_entity_type ?? ''),
      employeeId: row.employee_id ?? null,
      supplierId: row.supplier_id ?? null,
      name: row.external_name ?? row.role_description ?? null,
    }));
  }


  // ============= Mappers =============

  private mapToEntity(
    data: Record<string, any>,
    identity?: {
      name?: string | null;
      email?: string | null;
      phone?: string | null;
      position?: string | null;
      organizationName?: string | null;
    },
  ): Stakeholder {
    const stakeholderType = (data.stakeholder_entity_type === 'employee' ? 'employee' : 'supplier') as any;
    const organizationId = data.organization_id || data.supplier_id || null;
    const displayName = identity?.name || data.external_name || data.role_description || '';
    return new Stakeholder(
      data.id,
      data.project_id,
      stakeholderType,
      (data.stakeholder_type || data.role_description || 'observer') as any,
      organizationId,
      data.employee_id || null,
      !!data.is_primary,
      data.stakeholder_entity_type === 'employee',
      {
        name: displayName,
        email: identity?.email || data.external_email || '',
        phone: identity?.phone || data.external_phone || undefined,
        position: identity?.position || undefined,
      },
      identity?.organizationName && organizationId
        ? { id: String(organizationId), name: identity.organizationName, type: stakeholderType }
        : null,
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
