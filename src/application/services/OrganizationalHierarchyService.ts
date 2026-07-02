/**
 * Organizational Hierarchy Service - Hexagonal Architecture
 *
 * Resolves escalation recipients for cross-entity control actions (inspections,
 * insurance, bank guarantees). Uses the employees table as the source of truth;
 * a richer org-chart repository can be wired later without changing callers.
 */

import { supabase } from '@/integrations/supabase/client';

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
    const query = supabase
      .from('employees')
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

    const rows = (data ?? []).map((row: {
      id: string;
      full_name: string;
      email: string | null;
      phone: string | null;
      position: string | null;
      department: string | null;
    }) => ({
      employee_id: row.id,
      full_name: row.full_name,
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
    const { data, error } = await supabase
      .from('employees')
      .select('id, full_name, email, phone, position')
      .in('id', ids);

    if (error) {
      console.error('OrganizationalHierarchyService.resolveByIds', error);
      return [];
    }
    return (data ?? []).map((row: {
      id: string;
      full_name: string;
      email: string | null;
      phone: string | null;
      position: string | null;
    }) => ({
      employee_id: row.id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      position_title: row.position,
      hierarchy_level: inferLevel(row.position),
    }));
  }
}

export default OrganizationalHierarchyService;
