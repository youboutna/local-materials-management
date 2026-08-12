/**
 * Supabase Hierarchy Adapter
 * Implements IHierarchyRepository using Supabase
 */

import { btpClient as supabase } from '@/integrations/supabase/schema-clients';

// Import DTOs following Rule #4
import {
  HierarchyNode,
  CreateHierarchyNodeDTO,
  UpdateHierarchyNodeDTO,
  HierarchyStatisticsDTO,
  HierarchySearchCriteriaDTO,
  HierarchySearchResultDTO,
  HierarchyValidationDTO
} from '@/dtos/entities/HierarchyDTO';

// Import domain entities
import { ProjectHierarchy, HierarchyMember, EscalationTarget, EscalationLevel } from '@/domain/entities/Hierarchy';

// Import interfaces
import { IHierarchyRepository } from '@/domain/repositories/IHierarchyRepository';

// Database row interfaces for hierarchy tables
interface HierarchyMemberRow {
  hierarchy_id: string;
  employee_id: string;
  employee_name: string;
  position_title: string;
  department: string;
  level: number;
  parent_id?: string;
  organization_name?: string; // Made optional to match RPC responses
  can_approve_projects?: boolean;
  can_approve_payments?: boolean;
  employee_email?: string;
  employee_phone?: string;
}

// Interface for hierarchy chain RPC response (different structure)
interface HierarchyChainRow {
  hierarchy_id: string;
  employee_id: string;
  employee_name: string;
  position_title: string;
  department: string;
  level: number;
  distance: number; // Additional field for chain queries
  employee_email?: string;
  employee_phone?: string;
}

interface EscalationTargetRow {
  employee_id: string;
  employee_name: string;
  employee_email?: string;
  employee_phone?: string;
  position_title: string;
  department: string;
  hierarchy_level: number;
}

interface HierarchyNodeRow {
  id?: string;
  project_id?: string;
  name?: string;
  type?: string;
  parent_id?: string;
  order_index?: number;
  level?: number;
  path?: string;
  status?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  assigned_to?: string;
  priority?: string;
  estimated_hours?: number;
  actual_hours?: number;
  budget?: number;
  actual_cost?: number;
  tags?: string[];
  custom_fields?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

/** Table réelle des nœuds de hiérarchie projet (schéma btp). */
const NODES_TABLE = 'project_hierarchy_nodes';

/** Ligne DB de btp.project_hierarchy_nodes (metadata en jsonb). */
interface NodeRow {
  id: string;
  project_id: string;
  name: string;
  type: string;
  parent_id: string | null;
  order_index: number | null;
  level: number | null;
  path: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

/** DB (snake_case) -> DTO (camelCase). */
function mapNodeRow(row: NodeRow): HierarchyNode {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    type: (row.type as HierarchyNode['type']) || 'task',
    parentId: row.parent_id ?? undefined,
    orderIndex: row.order_index ?? 0,
    level: row.level ?? 1,
    path: row.path ?? row.name,
    metadata: (row.metadata ?? {}) as HierarchyNode['metadata'],
    createdAt: row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? new Date().toISOString(),
  };
}

export class SupabaseHierarchyAdapter implements IHierarchyRepository {

  // ============= Core CRUD Operations =============

  async getMembers(projectId: string): Promise<HierarchyMember[]> {
    const { data, error } = await supabase
      .rpc('get_project_hierarchy', { project_id_param: projectId });

    if (error) {
      console.error('Error fetching hierarchy members:', error);
      throw error;
    }

    return (data || []).map(this.mapToHierarchyMember);
  }

  async getProjectHierarchy(projectId: string): Promise<HierarchyNode[]> {
    const { data, error } = await supabase
      .rpc('get_project_hierarchy', { project_id_param: projectId });

    if (error) {
      console.error('Error fetching hierarchy nodes:', error);
      throw error;
    }

    return (data || []).map(this.mapToHierarchyNode);
  }

  async getMemberById(projectId: string, employeeId: string): Promise<HierarchyMember | null> {
    const members = await this.getMembers(projectId);
    return members.find(m => m.employeeId === employeeId) || null;
  }

  async getMembersByRole(projectId: string, roleFilter: string): Promise<HierarchyMember[]> {
    const members = await this.getMembers(projectId);
    return members.filter(member => 
      member.positionTitle.toLowerCase().includes(roleFilter.toLowerCase())
    );
  }

  async getMembersByDepartment(projectId: string, department: string): Promise<HierarchyMember[]> {
    const members = await this.getMembers(projectId);
    return members.filter(member => 
      member.department.toLowerCase().includes(department.toLowerCase())
    );
  }

  async getMembersByLevel(projectId: string, level: number): Promise<HierarchyMember[]> {
    const members = await this.getMembers(projectId);
    return members.filter(member => member.level === level);
  }

  // ============= Escalation Operations =============

  async getEscalationTargets(projectId: string, level: EscalationLevel): Promise<EscalationTarget[]> {
    const { data, error } = await supabase
      .rpc('get_escalation_targets', {
        project_id_param: projectId,
        escalation_level_param: level
      });

    if (error) {
      console.error('Error getting escalation targets:', error);
      return [];
    }

    return (data || []).map(this.mapToEscalationTarget);
  }

  async getHierarchyChain(employeeId: string, direction: 'up' | 'down'): Promise<HierarchyMember[]> {
    const { data, error } = await supabase
      .rpc('get_hierarchy_chain', {
        employee_id_param: employeeId,
        direction: direction
      });

    if (error) {
      console.error('Error getting hierarchy chain:', error);
      return [];
    }

    return (data || []).map(this.mapToHierarchyChainMember);
  }

  // ============= Approval Operations =============

  async getProjectApprovers(projectId: string): Promise<HierarchyMember[]> {
    const members = await this.getMembers(projectId);
    return members.filter(m => m.canApproveProjects);
  }

  async getPaymentApprovers(projectId: string): Promise<HierarchyMember[]> {
    const members = await this.getMembers(projectId);
    return members.filter(m => m.canApprovePayments);
  }

  async canApproveProjects(projectId: string, employeeId: string): Promise<boolean> {
    const member = await this.getMemberById(projectId, employeeId);
    return member?.canApproveProjects ?? false;
  }

  async canApprovePayments(projectId: string, employeeId: string): Promise<boolean> {
    const member = await this.getMemberById(projectId, employeeId);
    return member?.canApprovePayments ?? false;
  }

  // ============= Core CRUD Operations (btp.project_hierarchy_nodes) =============

  /** Accès typé-souple à la table (types générés indisponibles pour le schéma btp). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private table(): any {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (supabase as any).from(NODES_TABLE);
  }

  private toRow(
    data: CreateHierarchyNodeDTO | UpdateHierarchyNodeDTO,
  ): Record<string, unknown> {
    const row: Record<string, unknown> = {};
    if ('projectId' in data && data.projectId) row.project_id = data.projectId;
    if (data.name !== undefined) row.name = data.name;
    if (data.type !== undefined) row.type = data.type;
    if (data.parentId !== undefined) row.parent_id = data.parentId ?? null;
    if (data.orderIndex !== undefined) row.order_index = data.orderIndex;
    if (data.metadata !== undefined) row.metadata = data.metadata ?? {};
    return row;
  }

  async createHierarchyNode(nodeData: CreateHierarchyNodeDTO): Promise<HierarchyNode> {
    const { data, error } = await this.table()
      .insert({ ...this.toRow(nodeData), metadata: nodeData.metadata ?? { status: 'active' } })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapNodeRow(data as NodeRow);
  }

  async updateHierarchyNode(id: string, updateData: UpdateHierarchyNodeDTO): Promise<HierarchyNode> {
    const existing = await this.getHierarchyNode(id);
    const patch = this.toRow(updateData);
    if (updateData.metadata !== undefined) {
      patch.metadata = { ...(existing?.metadata ?? {}), ...updateData.metadata };
    }
    const { data, error } = await this.table().update(patch).eq('id', id).select('*').single();
    if (error) throw new Error(error.message);
    return mapNodeRow(data as NodeRow);
  }

  async deleteHierarchyNode(id: string): Promise<boolean> {
    const { error } = await this.table().delete().eq('id', id);
    if (error) throw new Error(error.message);
    return true;
  }

  // ============= Hierarchy-specific Operations =============

  async getHierarchyNode(id: string): Promise<HierarchyNode | null> {
    const { data, error } = await this.table().select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapNodeRow(data as NodeRow) : null;
  }

  async getChildNodes(parentId: string): Promise<HierarchyNode[]> {
    const { data, error } = await this.table()
      .select('*')
      .eq('parent_id', parentId)
      .order('order_index', { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as NodeRow[]).map(mapNodeRow);
  }

  async getParentNode(nodeId: string): Promise<HierarchyNode | null> {
    const node = await this.getHierarchyNode(nodeId);
    if (!node?.parentId) return null;
    return this.getHierarchyNode(node.parentId);
  }

  async getRootNodes(projectId: string): Promise<HierarchyNode[]> {
    const { data, error } = await this.table()
      .select('*')
      .eq('project_id', projectId)
      .is('parent_id', null)
      .order('order_index', { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as NodeRow[]).map(mapNodeRow);
  }

  /** Tous les nœuds d'un projet (à plat, ordonnés niveau puis index). */
  async listNodes(projectId: string): Promise<HierarchyNode[]> {
    const { data, error } = await this.table()
      .select('*')
      .eq('project_id', projectId)
      .order('level', { ascending: true })
      .order('order_index', { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as NodeRow[]).map(mapNodeRow);
  }

  async getHierarchyPath(nodeId: string): Promise<string> {
    const node = await this.getHierarchyNode(nodeId);
    return node?.path ?? '';
  }

  // ============= Validation and Integrity =============

  async hasChildNodes(nodeId: string): Promise<boolean> {
    const { count, error } = await this.table()
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', nodeId);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  }

  async validateHierarchyIntegrity(projectId: string): Promise<HierarchyValidationDTO> {
    const nodes = await this.listNodes(projectId);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const errors: HierarchyValidationDTO['errors'] = [];
    const warnings: HierarchyValidationDTO['warnings'] = [];

    for (const node of nodes) {
      if (node.parentId && !byId.has(node.parentId)) {
        errors.push({
          nodeId: node.id,
          type: 'invalid_parent',
          message: `Parent introuvable (${node.parentId})`,
          severity: 'error',
        });
      }
      // Détection de cycle par remontée
      let cursor = node.parentId;
      const seen = new Set<string>([node.id]);
      while (cursor) {
        if (seen.has(cursor)) {
          errors.push({
            nodeId: node.id,
            type: 'circular_reference',
            message: 'Référence circulaire détectée dans la hiérarchie',
            severity: 'error',
          });
          break;
        }
        seen.add(cursor);
        cursor = byId.get(cursor)?.parentId;
      }
      if (node.level > 6) {
        warnings.push({ nodeId: node.id, type: 'deep_nesting', message: `Profondeur ${node.level} > 6` });
      }
    }

    // Doublons d'ordre entre frères
    const siblings = new Map<string, Set<number>>();
    for (const node of nodes) {
      const key = node.parentId ?? 'root';
      const set = siblings.get(key) ?? new Set<number>();
      const order = node.orderIndex ?? 0;
      if (set.has(order)) {
        errors.push({
          nodeId: node.id,
          type: 'duplicate_order',
          message: `Index d'ordre dupliqué (${order})`,
          severity: 'warning',
        });
      }
      set.add(order);
      siblings.set(key, set);
    }

    return { isValid: errors.filter((e) => e.severity === 'error').length === 0, errors, warnings };
  }

  async detectCircularReference(nodeId: string, parentId?: string): Promise<boolean> {
    let cursor = parentId;
    const seen = new Set<string>([nodeId]);
    while (cursor) {
      if (seen.has(cursor)) return true;
      seen.add(cursor);
      const parent = await this.getHierarchyNode(cursor);
      cursor = parent?.parentId;
    }
    return false;
  }

  // ============= Search and Filtering =============

  async searchHierarchy(criteria: HierarchySearchCriteriaDTO): Promise<HierarchySearchResultDTO> {
    let query = this.table().select('*').eq('project_id', criteria.projectId);
    if (criteria.nodeType) query = query.eq('type', criteria.nodeType);
    if (criteria.searchText) query = query.ilike('name', `%${criteria.searchText}%`);
    if (criteria.maxDepth) query = query.lte('level', criteria.maxDepth);

    const { data, error } = await query.order('level', { ascending: true });
    if (error) throw new Error(error.message);

    let nodes = ((data ?? []) as NodeRow[]).map(mapNodeRow);
    if (criteria.status) nodes = nodes.filter((n) => n.metadata?.status === criteria.status);
    if (criteria.assignedTo) nodes = nodes.filter((n) => n.metadata?.assignedTo === criteria.assignedTo);
    if (criteria.priority) nodes = nodes.filter((n) => n.metadata?.priority === criteria.priority);
    if (criteria.tags?.length) {
      nodes = nodes.filter((n) => criteria.tags!.every((t) => n.metadata?.tags?.includes(t)));
    }

    const facet = (values: Array<string | undefined>): Record<string, number> =>
      values.reduce<Record<string, number>>((acc, v) => {
        if (!v) return acc;
        acc[v] = (acc[v] || 0) + 1;
        return acc;
      }, {});

    return {
      nodes,
      totalCount: nodes.length,
      facets: {
        nodeTypes: facet(nodes.map((n) => n.type)),
        statuses: facet(nodes.map((n) => n.metadata?.status)),
        priorities: facet(nodes.map((n) => n.metadata?.priority)),
        assignees: facet(nodes.map((n) => n.metadata?.assignedTo)),
      },
    };
  }

  async filterByType(projectId: string, nodeType: HierarchyNode['type']): Promise<HierarchyNode[]> {
    const { data, error } = await this.table()
      .select('*')
      .eq('project_id', projectId)
      .eq('type', nodeType)
      .order('order_index', { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as NodeRow[]).map(mapNodeRow);
  }

  async filterByStatus(projectId: string, status: string): Promise<HierarchyNode[]> {
    const nodes = await this.listNodes(projectId);
    return nodes.filter((n) => n.metadata?.status === status);
  }

  // ============= Statistics and Analytics =============

  async getHierarchyStatistics(projectId: string): Promise<HierarchyStatisticsDTO> {
    const nodes = await this.listNodes(projectId);
    const tasks = nodes.filter((n) => n.type === 'task' || n.type === 'subtask');
    const completedTasks = tasks.filter((n) => n.metadata?.status === 'completed').length;
    const totalBudget = nodes.reduce((s, n) => s + (n.metadata?.budget ?? 0), 0);
    const actualCost = nodes.reduce((s, n) => s + (n.metadata?.actualCost ?? 0), 0);

    return {
      projectId,
      totalNodes: nodes.length,
      maxDepth: nodes.reduce((m, n) => Math.max(m, n.level), 0),
      nodeTypes: nodes.reduce<Record<string, number>>((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {}),
      totalTasks: tasks.length,
      completedTasks,
      totalBudget,
      actualCost,
      overallProgress: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
    };
  }

  async getCriticalPath(projectId: string): Promise<string[]> {
    const nodes = await this.listNodes(projectId);
    const childrenOf = new Map<string, HierarchyNode[]>();
    for (const n of nodes) {
      const key = n.parentId ?? 'root';
      childrenOf.set(key, [...(childrenOf.get(key) ?? []), n]);
    }
    // Chemin de plus grande charge (heures estimées) depuis les racines.
    const walk = (node: HierarchyNode): { path: string[]; weight: number } => {
      const children = childrenOf.get(node.id) ?? [];
      const weight = node.metadata?.estimatedHours ?? 0;
      if (!children.length) return { path: [node.id], weight };
      const best = children
        .map(walk)
        .sort((a, b) => b.weight - a.weight)[0];
      return { path: [node.id, ...best.path], weight: weight + best.weight };
    };
    const roots = childrenOf.get('root') ?? [];
    if (!roots.length) return [];
    return roots.map(walk).sort((a, b) => b.weight - a.weight)[0].path;
  }

  async calculateProgress(nodeId: string): Promise<number> {
    const node = await this.getHierarchyNode(nodeId);
    if (!node) return 0;
    const children = await this.getChildNodes(nodeId);
    if (!children.length) return node.metadata?.status === 'completed' ? 100 : 0;
    const done = children.filter((c) => c.metadata?.status === 'completed').length;
    return Math.round((done / children.length) * 100);
  }

  // ============= Bulk Operations =============

  async bulkCreate(nodes: CreateHierarchyNodeDTO[]): Promise<HierarchyNode[]> {
    if (!nodes.length) return [];
    const { data, error } = await this.table()
      .insert(nodes.map((n) => ({ ...this.toRow(n), metadata: n.metadata ?? { status: 'active' } })))
      .select('*');
    if (error) throw new Error(error.message);
    return ((data ?? []) as NodeRow[]).map(mapNodeRow);
  }

  async bulkUpdate(updates: Array<{ id: string; data: UpdateHierarchyNodeDTO }>): Promise<HierarchyNode[]> {
    const results: HierarchyNode[] = [];
    for (const update of updates) {
      results.push(await this.updateHierarchyNode(update.id, update.data));
    }
    return results;
  }

  async bulkDelete(nodeIds: string[]): Promise<boolean> {
    if (!nodeIds.length) return true;
    const { error } = await this.table().delete().in('id', nodeIds);
    if (error) throw new Error(error.message);
    return true;
  }

  // ============= Tree Operations =============

  async moveNode(nodeId: string, newParentId?: string, newOrderIndex?: number): Promise<HierarchyNode> {
    if (newParentId && (await this.detectCircularReference(nodeId, newParentId))) {
      throw new Error('Déplacement impossible : référence circulaire détectée');
    }
    return this.updateHierarchyNode(nodeId, {
      parentId: newParentId,
      ...(newOrderIndex !== undefined ? { orderIndex: newOrderIndex } : {}),
    });
  }

  async reorderNodes(
    parentId: string,
    nodeOrders: Array<{ id: string; orderIndex: number }>,
  ): Promise<HierarchyNode[]> {
    return this.bulkUpdate(nodeOrders.map((o) => ({ id: o.id, data: { orderIndex: o.orderIndex } })));
  }

  async duplicateNode(nodeId: string, newParentId?: string): Promise<HierarchyNode> {
    const source = await this.getHierarchyNode(nodeId);
    if (!source) throw new Error('Nœud source introuvable');
    const copy = await this.createHierarchyNode({
      projectId: source.projectId,
      name: `${source.name} (copie)`,
      type: source.type,
      parentId: newParentId ?? source.parentId,
      orderIndex: (source.orderIndex ?? 0) + 1,
      metadata: source.metadata as CreateHierarchyNodeDTO['metadata'],
    });
    // Duplication récursive des enfants
    const children = await this.getChildNodes(nodeId);
    for (const child of children) {
      await this.duplicateNode(child.id, copy.id);
    }
    return copy;
  }

  // ============= Caching and Performance =============

  async invalidateCache(_projectId: string): Promise<void> {
    // Le cache est géré côté TanStack Query (invalidateQueries dans les hooks).
  }

  async preloadHierarchy(projectId: string): Promise<HierarchyNode[]> {
    return this.listNodes(projectId);
  }


  // ============= Private Mappers =============

  private mapToHierarchyMember(data: HierarchyMemberRow): HierarchyMember {
    return {
      hierarchyId: data.hierarchy_id,
      employeeId: data.employee_id,
      employeeName: data.employee_name,
      positionTitle: data.position_title,
      department: data.department,
      level: data.level,
      parentId: data.parent_id || null,
      organizationName: data.organization_name || '',
      canApproveProjects: data.can_approve_projects || false,
      canApprovePayments: data.can_approve_payments || false,
      employeeEmail: data.employee_email || '',
      employeePhone: data.employee_phone || '',
    };
  }

  private mapToHierarchyChainMember(data: HierarchyChainRow): HierarchyMember {
    return {
      hierarchyId: data.hierarchy_id,
      employeeId: data.employee_id,
      employeeName: data.employee_name,
      positionTitle: data.position_title,
      department: data.department,
      level: data.level,
      parentId: null, // Chain queries don't include parent relationships
      organizationName: '', // Not provided in chain queries
      canApproveProjects: false, // Default values for chain queries
      canApprovePayments: false,
      employeeEmail: data.employee_email || '',
      employeePhone: data.employee_phone || '',
    };
  }

  private mapToHierarchyNode(data: HierarchyNodeRow): HierarchyNode {
    // Build metadata object only with defined values
    const metadata: HierarchyNode['metadata'] = {};

    if (data.status !== undefined) metadata.status = data.status as 'active' | 'completed' | 'pending' | 'cancelled';
    if (data.description !== undefined) metadata.description = data.description;
    if (data.start_date !== undefined) metadata.startDate = data.start_date;
    if (data.end_date !== undefined) metadata.endDate = data.end_date;
    if (data.assigned_to !== undefined) metadata.assignedTo = data.assigned_to;
    if (data.priority !== undefined) metadata.priority = data.priority as 'low' | 'medium' | 'high' | 'critical';
    if (data.estimated_hours !== undefined) metadata.estimatedHours = data.estimated_hours;
    if (data.actual_hours !== undefined) metadata.actualHours = data.actual_hours;
    if (data.budget !== undefined) metadata.budget = data.budget;
    if (data.actual_cost !== undefined) metadata.actualCost = data.actual_cost;
    if (data.tags !== undefined) metadata.tags = data.tags;
    if (data.custom_fields !== undefined) metadata.customFields = data.custom_fields;

    return {
      id: data.id || crypto.randomUUID(),
      projectId: data.project_id || '',
      name: data.name || 'Unknown Node',
      type: (data.type as HierarchyNode['type']) || 'task',
      parentId: data.parent_id,
      orderIndex: data.order_index || 0,
      level: data.level || 1,
      path: data.path || '',
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: data.updated_at || new Date().toISOString()
    };
  }

  private mapToEscalationTarget(data: EscalationTargetRow): EscalationTarget {
    return {
      employeeId: data.employee_id,
      employeeName: data.employee_name,
      employeeEmail: data.employee_email || '',
      employeePhone: data.employee_phone || '',
      positionTitle: data.position_title,
      department: data.department,
      hierarchyLevel: data.hierarchy_level,
    };
  }
}
