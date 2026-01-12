/**
 * Hierarchy Repository Interface
 * Defines contract for organizational hierarchy data access
 */

import { ProjectHierarchy, HierarchyMember, EscalationTarget, EscalationLevel } from '../entities/Hierarchy';

export interface IHierarchyRepository {
  // ============= Query Operations =============

  /**
   * Get full project hierarchy
   */
  getProjectHierarchy(projectId: string): Promise<ProjectHierarchy>;

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

  // ============= Escalation Operations =============

  /**
   * Get escalation targets for a specific level
   */
  getEscalationTargets(projectId: string, level: EscalationLevel): Promise<EscalationTarget[]>;

  /**
   * Get hierarchy chain (up or down from a member)
   */
  getHierarchyChain(employeeId: string, direction: 'up' | 'down'): Promise<HierarchyMember[]>;

  // ============= Approval Operations =============

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
