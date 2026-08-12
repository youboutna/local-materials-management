/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IOrganizationHierarchyRepository } from '@/domain/repositories/IOrganizationHierarchyRepository';
import type { CreateOrganizationHierarchyDTO, OrganizationHierarchyDTO, UpdateOrganizationHierarchyDTO } from '@/dtos/entities/OrganizationHierarchyDTO';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { OrganizationHierarchyTransformer } from '@/dtos/transforms/OrganizationHierarchyTransformer';

const TABLE = 'organizational_hierarchy';
type HierarchyRow = Record<string, unknown>;

const toDTO = (row: HierarchyRow): OrganizationHierarchyDTO =>
  OrganizationHierarchyTransformer.toDTO(row);
const toRow = (
  data: CreateOrganizationHierarchyDTO | UpdateOrganizationHierarchyDTO,
): Record<string, unknown> => OrganizationHierarchyTransformer.toRow(data);

export class SupabaseOrganizationHierarchyAdapter implements IOrganizationHierarchyRepository {
  async findById(id: string): Promise<OrganizationHierarchyDTO | null> {
    const { data, error } = await (supabase as any).from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDTO(data) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<OrganizationHierarchyDTO[]> {
    const { data, error } = await (supabase as any).from(TABLE).select('*').eq('organization_id', organizationId).order('level');
    if (error) throw new Error(error.message);
    return (data ?? []).map(toDTO);
  }

  async findByEmployeeId(employeeId: string): Promise<OrganizationHierarchyDTO | null> {
    const { data, error } = await (supabase as any).from(TABLE).select('*').eq('employee_id', employeeId).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toDTO(data) : null;
  }

  async findByParentId(parentId: string): Promise<OrganizationHierarchyDTO[]> {
    const { data, error } = await (supabase as any).from(TABLE).select('*').eq('parent_id', parentId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(toDTO);
  }

  async replaceForOrganization(organizationId: string, nodes: CreateOrganizationHierarchyDTO[]): Promise<OrganizationHierarchyDTO[]> {
    const { data: previousNodes, error: listError } = await (supabase as any)
      .from(TABLE)
      .select('id')
      .eq('organization_id', organizationId);
    if (listError) throw new Error(listError.message);

    if (nodes.length === 0) {
      const { error: deleteError } = await (supabase as any).from(TABLE).delete().eq('organization_id', organizationId);
      if (deleteError) throw new Error(deleteError.message);
      return [];
    }

    const payload = nodes.map((node) => toRow({ ...node, organizationId }));
    const { data, error } = await (supabase as any).from(TABLE).insert(payload).select();
    if (error) throw new Error(error.message);

    const previousIds = (previousNodes ?? []).map((node: { id?: string }) => node.id).filter(Boolean);
    if (previousIds.length > 0) {
      const { error: deleteError } = await (supabase as any).from(TABLE).delete().in('id', previousIds);
      if (deleteError) throw new Error(deleteError.message);
    }

    return (data ?? []).map(toDTO);
  }

  async create(data: CreateOrganizationHierarchyDTO): Promise<OrganizationHierarchyDTO> {
    const { data: row, error } = await (supabase as any).from(TABLE).insert(toRow(data)).select().single();
    if (error) throw new Error(error.message);
    return toDTO(row);
  }

  async update(id: string, data: UpdateOrganizationHierarchyDTO): Promise<OrganizationHierarchyDTO> {
    const { data: row, error } = await (supabase as any).from(TABLE).update(toRow(data)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return toDTO(row);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await (supabase as any).from(TABLE).delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }
}