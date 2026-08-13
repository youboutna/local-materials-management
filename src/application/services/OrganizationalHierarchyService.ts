/**
 * Organizational Hierarchy Service - Hexagonal Architecture
 *
 * Resolves escalation recipients for cross-entity control actions (inspections,
 * insurance, bank guarantees). Uses the employees table as the source of truth;
 * a richer org-chart repository can be wired later without changing callers.
 */

import { btpClient } from '@/integrations/supabase/schema-clients';

export type HierarchyLevel = 'team' | 'supervisor' | 'manager' | 'director';

export interface HierarchyRecipient {
  employee_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  position_title: string | null;
  hierarchy_level: HierarchyLevel;
}

export interface FindRecipientsCriteria {
  type: 'inspection' | 'insurance' | 'bank_guarantee' | 'project' | 'payment';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  escalationLevel?: HierarchyLevel;
  department?: string;
}

export interface ProjectOrganization {
  id: string;
  project_id: string;
  organization_id: string;
  role: string | null;
  is_primary: boolean | null;
  contract_amount: number | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  organization_name?: string | null;
}

const POSITION_TO_LEVEL: Array<{ match: RegExp; level: HierarchyLevel }> = [
  { match: /directeur|director|dg/i, level: 'director' },
  { match: /manager|responsable|chef de projet/i, level: 'manager' },
  { match: /superviseur|supervisor|chef d.?équipe/i, level: 'supervisor' },
];

function inferLevel(position?: string | null): HierarchyLevel {
  if (!position) return 'team';
  for (const { match, level } of POSITION_TO_LEVEL) {
    if (match.test(position)) return level;
  }
  return 'team';
}

export class OrganizationalHierarchyService {
  static async findNotificationRecipients(
    _projectId: string,
    criteria: FindRecipientsCriteria,
  ): Promise<HierarchyRecipient[]> {
    const query = btpClient.from('employees')
      .select('id, full_name, email, phone, position, department')
      .eq('is_active', true);

    if (criteria.department) {
      query.eq('department', criteria.department);
    }

    const { data, error } = await query;
    if (error) {
      console.error('OrganizationalHierarchyService.findNotificationRecipients', error);
      return [];
    }

    const rows: HierarchyRecipient[] = (data ?? [])
      .filter((row) => !!row.id)
      .map((row) => ({
        employee_id: row.id as string,
        full_name: row.full_name ?? '',
        email: row.email,
        phone: row.phone,
        position_title: row.position,
        hierarchy_level: inferLevel(row.position),
      }));

    if (criteria.escalationLevel) {
      const filtered = rows.filter((r) => r.hierarchy_level === criteria.escalationLevel);
      return filtered.length > 0 ? filtered : rows;
    }
    return rows;
  }

  static async resolveByIds(ids: string[]): Promise<HierarchyRecipient[]> {
    if (ids.length === 0) return [];
    const { data, error } = await btpClient.from('employees')
      .select('id, full_name, email, phone, position')
      .in('id', ids);

    if (error) {
      console.error('OrganizationalHierarchyService.resolveByIds', error);
      return [];
    }
    return (data ?? [])
      .filter((row) => !!row.id)
      .map((row) => ({
        employee_id: row.id as string,
        full_name: row.full_name ?? '',
        email: row.email,
        phone: row.phone,
        position_title: row.position,
        hierarchy_level: inferLevel(row.position),
      }));
  }



  /**
   * Organisations rattachées à un projet (btp.project_organizations).
   * Utilisé par les actions de contrôle pour identifier le maître d'ouvrage principal.
   */
  static async getProjectOrganizations(projectId: string): Promise<ProjectOrganization[]> {
    if (!projectId) return [];
    const { btpClient } = await import('@/integrations/supabase/schema-clients');
    const { data, error } = await (btpClient as any)
      .from('project_organizations')
      .select('id, project_id, organization_id, role, is_primary, contract_amount, contract_start_date, contract_end_date, organizations:organization_id(name)')
      .eq('project_id', projectId);

    if (error) {
      console.error('OrganizationalHierarchyService.getProjectOrganizations', error);
      return [];
    }
    return (data ?? []).map((row: any) => ({
      id: row.id,
      project_id: row.project_id,
      organization_id: row.organization_id,
      role: row.role ?? null,
      is_primary: row.is_primary ?? null,
      contract_amount: row.contract_amount ?? null,
      contract_start_date: row.contract_start_date ?? null,
      contract_end_date: row.contract_end_date ?? null,
      organization_name: row.organizations?.name ?? null,
    }));
  }
}


export default OrganizationalHierarchyService;

