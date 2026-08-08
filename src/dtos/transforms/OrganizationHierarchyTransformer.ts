/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OrganizationHierarchyTransformer - DB row (snake_case) <-> OrganizationHierarchyDTO (camelCase)
 */
import type { CreateOrganizationHierarchyDTO, OrganizationHierarchyDTO, UpdateOrganizationHierarchyDTO } from '@/dtos/entities/OrganizationHierarchyDTO';

export type OrganizationHierarchyRow = Record<string, unknown>;

export class OrganizationHierarchyTransformer {
  static toDTO(row: OrganizationHierarchyRow): OrganizationHierarchyDTO {
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

  static toRow(data: CreateOrganizationHierarchyDTO | UpdateOrganizationHierarchyDTO): Record<string, unknown> {
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
}
