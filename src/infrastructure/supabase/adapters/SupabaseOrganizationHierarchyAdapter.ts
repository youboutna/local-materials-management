/* eslint-disable @typescript-eslint/no-explicit-any */
import type { IOrganizationHierarchyRepository } from '@/domain/repositories/IOrganizationHierarchyRepository';
import type { CreateOrganizationHierarchyDTO, OrganizationHierarchyDTO, UpdateOrganizationHierarchyDTO } from '@/dtos/entities/OrganizationHierarchyDTO';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

const TABLE = 'organizational_hierarchy';
type HierarchyRow = Record<string, unknown>;

function toDTO(row: HierarchyRow): OrganizationHierarchyDTO {
  return {
    id: String(row.id),
    organizationId: row.organization_id as string | undefined,
    employeeId: row.employee_id as string | undefined,
    parentId: row.parent_id as string | undefined,
    department: row.department as string | undefined,
    positionTitle: row.position_title as string | undefined,
    level: row.level as number | undefined,
    directReportsCount: row.direct_reports_count as number | undefined,
    canApproveProjects: row.can_approve_projects as boolean | undefined,
    canApprovePayments: row.can_approve_payments as boolean | undefined,
    canEscalateToDirector: row.can_escalate_to_director as boolean | undefined,
    notificationPreferences: row.notification_preferences as Record<string, unknown> | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

function toRow(data: CreateOrganizationHierarchyDTO | UpdateOrganizationHierarchyDTO): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if ('id' in data && data.id !== undefined) row.id = data.id;
  if (data.organizationId !== undefined) row.organization_id = data.organizationId;
  if (data.employeeId !== undefined) row.employee_id = data.employeeId;
  if (data.parentId !== undefined) row.parent_id = data.parentId;
  if (data.department !== undefined) row.department = data.department;
  if (data.positionTitle !== undefined) row.position_title = data.positionTitle;
  if (data.level !== undefined) row.level = data.level;
  if (data.directReportsCount !== undefined) row.direct_reports_count = data.directReportsCount;
  if (data.canApproveProjects !== undefined) row.can_approve_projects = data.canApproveProjects;
  if (data.canApprovePayments !== undefined) row.can_approve_payments = data.canApprovePayments;
  if (data.canEscalateToDirector !== undefined) row.can_escalate_to_director = data.canEscalateToDirector;
  if (data.notificationPreferences !== undefined) row.notification_preferences = data.notificationPreferences;
  return row;
}

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