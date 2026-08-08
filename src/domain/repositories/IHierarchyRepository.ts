/**
 * IHierarchyRepository - Repository interface for hierarchy operations
 * Follows hexagonal architecture port definition
 */

import { HierarchyStatisticsDTO } from '@/dtos/entities/ReportDTO';;
import { ProjectHierarchy, HierarchyMember, EscalationTarget, EscalationLevel } from '../entities/Hierarchy';

export interface IHierarchyRepository {
  // Core CRUD operations
  getProjectHierarchy(projectId: string): Promise<HierarchyNode[]>;
  createHierarchyNode(nodeData: CreateHierarchyNodeDTO): Promise<HierarchyNode>;
  updateHierarchyNode(id: string, updateData: UpdateHierarchyNodeDTO): Promise<HierarchyNode>;
  deleteHierarchyNode(id: string): Promise<boolean>;
  
  // Hierarchy-specific operations
  getHierarchyNode(id: string): Promise<HierarchyNode | null>;
  getChildNodes(parentId: string): Promise<HierarchyNode[]>;
  getParentNode(nodeId: string): Promise<HierarchyNode | null>;
  getRootNodes(projectId: string): Promise<HierarchyNode[]>;
  getHierarchyPath(nodeId: string): Promise<string>;
  
  // Validation and integrity
  hasChildNodes(nodeId: string): Promise<boolean>;
  validateHierarchyIntegrity(projectId: string): Promise<HierarchyValidationDTO>;
  detectCircularReference(nodeId: string, parentId?: string): Promise<boolean>;
  
  // Search and filtering
  searchHierarchy(criteria: HierarchySearchCriteriaDTO): Promise<HierarchySearchResultDTO>;
  filterByType(projectId: string, nodeType: HierarchyNode['type']): Promise<HierarchyNode[]>;
  filterByStatus(projectId: string, status: string): Promise<HierarchyNode[]>;
  
  // Statistics and analytics
  getHierarchyStatistics(projectId: string): Promise<HierarchyStatisticsDTO>;
  getCriticalPath(projectId: string): Promise<string[]>;
  calculateProgress(nodeId: string): Promise<number>;
  
  // Bulk operations
  bulkCreate(nodes: CreateHierarchyNodeDTO[]): Promise<HierarchyNode[]>;
  bulkUpdate(updates: Array<{ id: string; data: UpdateHierarchyNodeDTO }>): Promise<HierarchyNode[]>;
  bulkDelete(nodeIds: string[]): Promise<boolean>;
  
  // Tree operations
  moveNode(nodeId: string, newParentId?: string, newOrderIndex?: number): Promise<HierarchyNode>;
  reorderNodes(parentId: string, nodeOrders: Array<{ id: string; orderIndex: number }>): Promise<HierarchyNode[]>;
  duplicateNode(nodeId: string, newParentId?: string): Promise<HierarchyNode>;
  
  // Caching and performance
  invalidateCache(projectId: string): Promise<void>;
  preloadHierarchy(projectId: string): Promise<HierarchyNode[]>;

  // ============= Legacy Operations (for backward compatibility) =============

  /**
   * Get hierarchy members for a project
   */
  getMembers(projectId: string): Promise<HierarchyMember[]>;

  /**
   * Get member by ID
   */
  getMemberById(projectId: string, employeeId: string): Promise<HierarchyMember | null>;

  /**
   * Get members by role/position
   */
  getMembersByRole(projectId: string, roleFilter: string): Promise<HierarchyMember[]>;

  /**
   * Get members by department
   */
  getMembersByDepartment(projectId: string, department: string): Promise<HierarchyMember[]>;

  /**
   * Get members by level
   */
  getMembersByLevel(projectId: string, level: number): Promise<HierarchyMember[]>;

  /**
   * Get escalation targets for a specific level
   */
  getEscalationTargets(projectId: string, level: EscalationLevel): Promise<EscalationTarget[]>;

  /**
   * Get hierarchy chain (up or down from a member)
   */
  getHierarchyChain(employeeId: string, direction: 'up' | 'down'): Promise<HierarchyMember[]>;

  /**
   * Get project approvers
   */
  getProjectApprovers(projectId: string): Promise<HierarchyMember[]>;

  /**
   * Get payment approvers
   */
  getPaymentApprovers(projectId: string): Promise<HierarchyMember[]>;

  /**
   * Check if member can approve projects
   */
  canApproveProjects(projectId: string, employeeId: string): Promise<boolean>;

  /**
   * Check if member can approve payments
   */
  canApprovePayments(projectId: string, employeeId: string): Promise<boolean>;
}
