/**
 * Supabase Hierarchy Adapter
 * Implements IHierarchyRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';

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

  // ============= Core CRUD Operations =============

  async createHierarchyNode(nodeData: CreateHierarchyNodeDTO): Promise<HierarchyNode> {
    // Implementation would create a new hierarchy node in database
    // For now, return a mock node
    return {
      id: crypto.randomUUID(),
      projectId: nodeData.projectId,
      name: nodeData.name,
      type: nodeData.type,
      parentId: nodeData.parentId,
      orderIndex: nodeData.orderIndex || 0,
      level: nodeData.parentId ? 2 : 1, // Mock level calculation
      path: nodeData.parentId ? `root.${nodeData.name}` : nodeData.name, // Mock path
      metadata: {
        status: 'active',
        ...nodeData.metadata
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async updateHierarchyNode(id: string, updateData: UpdateHierarchyNodeDTO): Promise<HierarchyNode> {
    // Implementation would update hierarchy node in database
    // For now, return a mock updated node
    return {
      id,
      projectId: '', // Would get from database
      name: updateData.name || 'Updated Node',
      type: updateData.type || 'task',
      parentId: updateData.parentId,
      orderIndex: updateData.orderIndex || 0,
      level: updateData.parentId ? 2 : 1, // Mock level calculation
      path: updateData.parentId ? `root.${updateData.name || 'Updated'}` : (updateData.name || 'Updated'), // Mock path
      metadata: {
        status: 'active',
        ...updateData.metadata
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async deleteHierarchyNode(id: string): Promise<boolean> {
    // Implementation would delete hierarchy node from database
    // For now, return true
    return true;
  }

  // ============= Hierarchy-specific Operations =============

  async getHierarchyNode(id: string): Promise<HierarchyNode | null> {
    // Implementation would fetch hierarchy node by ID
    // For now, return null
    return null;
  }

  async getChildNodes(parentId: string): Promise<HierarchyNode[]> {
    // Implementation would fetch child nodes
    // For now, return empty array
    return [];
  }

  async getParentNode(nodeId: string): Promise<HierarchyNode | null> {
    // Implementation would fetch parent node
    // For now, return null
    return null;
  }

  async getRootNodes(projectId: string): Promise<HierarchyNode[]> {
    // Implementation would fetch root nodes (nodes with no parent)
    // For now, return empty array
    return [];
  }

  async getHierarchyPath(nodeId: string): Promise<string> {
    // Implementation would build path string from root to node
    // For now, return empty string
    return '';
  }

  // ============= Validation and Integrity =============

  async hasChildNodes(nodeId: string): Promise<boolean> {
    // Implementation would check if node has children
    // For now, return false
    return false;
  }

  async validateHierarchyIntegrity(projectId: string): Promise<HierarchyValidationDTO> {
    // Implementation would validate hierarchy integrity
    // For now, return valid result
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  async detectCircularReference(nodeId: string, parentId?: string): Promise<boolean> {
    // Implementation would detect circular references
    // For now, return false
    return false;
  }

  // ============= Search and Filtering =============

  async searchHierarchy(criteria: HierarchySearchCriteriaDTO): Promise<HierarchySearchResultDTO> {
    // Implementation would search hierarchy nodes
    // For now, return empty result
    return {
      nodes: [],
      totalCount: 0,
      facets: {
        nodeTypes: {},
        statuses: {},
        priorities: {},
        assignees: {}
      }
    };
  }

  async filterByType(projectId: string, nodeType: HierarchyNode['type']): Promise<HierarchyNode[]> {
    // Implementation would filter nodes by type
    // For now, return empty array
    return [];
  }

  async filterByStatus(projectId: string, status: string): Promise<HierarchyNode[]> {
    // Implementation would filter nodes by status
    // For now, return empty array
    return [];
  }

  // ============= Statistics and Analytics =============

  async getHierarchyStatistics(projectId: string): Promise<HierarchyStatisticsDTO> {
    // Implementation would calculate hierarchy statistics
    // For now, return default stats
    return {
      projectId,
      totalNodes: 0,
      maxDepth: 0,
      nodeTypes: {},
      totalTasks: 0,
      completedTasks: 0,
      totalBudget: 0,
      actualCost: 0,
      overallProgress: 0
    };
  }

  async getCriticalPath(projectId: string): Promise<string[]> {
    // Implementation would calculate critical path
    // For now, return empty array
    return [];
  }

  async calculateProgress(nodeId: string): Promise<number> {
    // Implementation would calculate progress for node
    // For now, return 0
    return 0;
  }

  // ============= Bulk Operations =============

  async bulkCreate(nodes: CreateHierarchyNodeDTO[]): Promise<HierarchyNode[]> {
    // Implementation would create multiple nodes
    // For now, return mock nodes
    return nodes.map(node => ({
      id: crypto.randomUUID(),
      projectId: node.projectId,
      name: node.name,
      type: node.type,
      parentId: node.parentId,
      orderIndex: node.orderIndex || 0,
      level: node.parentId ? 2 : 1,
      path: node.parentId ? `root.${node.name}` : node.name,
      metadata: {
        status: 'active',
        ...node.metadata
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  async bulkUpdate(updates: Array<{ id: string; data: UpdateHierarchyNodeDTO }>): Promise<HierarchyNode[]> {
    // Implementation would update multiple nodes
    // For now, return mock updated nodes
    return updates.map(update => ({
      id: update.id,
      projectId: '', // Would get from database
      name: update.data.name || 'Updated Node',
      type: update.data.type || 'task',
      parentId: update.data.parentId,
      orderIndex: update.data.orderIndex || 0,
      level: update.data.parentId ? 2 : 1,
      path: update.data.parentId ? `root.${update.data.name || 'Updated'}` : (update.data.name || 'Updated'),
      metadata: {
        status: 'active',
        ...update.data.metadata
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  async bulkDelete(nodeIds: string[]): Promise<boolean> {
    // Implementation would delete multiple nodes
    // For now, return true
    return true;
  }

  // ============= Tree Operations =============

  async moveNode(nodeId: string, newParentId?: string, newOrderIndex?: number): Promise<HierarchyNode> {
    // Implementation would move node to new parent
    // For now, return mock moved node
    return {
      id: nodeId,
      projectId: '',
      name: 'Moved Node',
      type: 'task',
      parentId: newParentId,
      orderIndex: newOrderIndex || 0,
      level: newParentId ? 2 : 1,
      path: newParentId ? `root.Moved` : 'Moved',
      metadata: {
        status: 'active'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async reorderNodes(parentId: string, nodeOrders: Array<{ id: string; orderIndex: number }>): Promise<HierarchyNode[]> {
    // Implementation would reorder child nodes
    // For now, return mock reordered nodes
    return nodeOrders.map(order => ({
      id: order.id,
      projectId: '',
      name: 'Reordered Node',
      type: 'task',
      parentId: parentId,
      orderIndex: order.orderIndex,
      level: parentId ? 2 : 1,
      path: parentId ? `root.Reordered` : 'Reordered',
      metadata: {
        status: 'active'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }

  async duplicateNode(nodeId: string, newParentId?: string): Promise<HierarchyNode> {
    // Implementation would duplicate node
    // For now, return mock duplicated node
    return {
      id: crypto.randomUUID(),
      projectId: '',
      name: 'Duplicated Node',
      type: 'task',
      parentId: newParentId,
      orderIndex: 0,
      level: newParentId ? 2 : 1,
      path: newParentId ? `root.Duplicated` : 'Duplicated',
      metadata: {
        status: 'active'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // ============= Caching and Performance =============

  async invalidateCache(projectId: string): Promise<void> {
    // Implementation would invalidate cache for project
    // For now, do nothing
  }

  async preloadHierarchy(projectId: string): Promise<HierarchyNode[]> {
    // Implementation would preload hierarchy into cache
    // For now, return empty array
    return [];
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
