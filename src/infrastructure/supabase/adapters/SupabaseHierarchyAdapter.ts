/**
 * Supabase Hierarchy Adapter
 * Implements IHierarchyRepository using Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  ProjectHierarchy, 
  HierarchyMember, 
  EscalationTarget, 
  EscalationLevel 
} from '@/domain/entities';
import { IHierarchyRepository } from '@/domain/repositories';

export class SupabaseHierarchyAdapter implements IHierarchyRepository {
  // ============= Query Operations =============

  async getProjectHierarchy(projectId: string): Promise<ProjectHierarchy> {
    const members = await this.getMembers(projectId);
    return ProjectHierarchy.create(projectId, members);
  }

  async getMembers(projectId: string): Promise<HierarchyMember[]> {
    const { data, error } = await supabase
      .rpc('get_project_hierarchy', { project_id_param: projectId });

    if (error) {
      console.error('Error fetching hierarchy members:', error);
      throw error;
    }

    return (data || []).map(this.mapToHierarchyMember);
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

    return (data || []).map(this.mapToHierarchyMember);
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

  // ============= Private Mappers =============

  private mapToHierarchyMember(data: any): HierarchyMember {
    return {
      hierarchyId: data.hierarchy_id,
      employeeId: data.employee_id,
      employeeName: data.employee_name,
      positionTitle: data.position_title,
      department: data.department,
      level: data.level,
      parentId: data.parent_id,
      organizationName: data.organization_name,
      canApproveProjects: data.can_approve_projects || false,
      canApprovePayments: data.can_approve_payments || false,
      employeeEmail: data.employee_email || '',
      employeePhone: data.employee_phone || '',
    };
  }

  private mapToEscalationTarget(data: any): EscalationTarget {
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
