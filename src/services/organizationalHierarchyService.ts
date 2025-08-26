import { supabase } from '@/integrations/supabase/client';

export interface OrganizationHierarchy {
  hierarchy_id: string;
  employee_id: string;
  employee_name: string;
  position_title: string;
  department: string;
  level: number;
  parent_id?: string;
  organization_name: string;
  can_approve_projects: boolean;
  can_approve_payments: boolean;
  notification_preferences: {
    email: boolean;
    sms: boolean;
    in_app: boolean;
  } | null;
  employee_email?: string;
  employee_phone?: string;
}

export interface EscalationTarget {
  employee_id: string;
  employee_name: string;
  employee_email?: string;
  employee_phone?: string;
  position_title: string;
  department: string;
  hierarchy_level: number;
}

export class OrganizationalHierarchyService {
  /**
   * Get the organizational hierarchy for a specific project
   */
  static async getProjectHierarchy(projectId: string): Promise<OrganizationHierarchy[]> {
    try {
      const { data, error } = await supabase.rpc('get_project_hierarchy', {
        project_id_param: projectId
      });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData: OrganizationHierarchy[] = (data || []).map(item => ({
        ...item,
        notification_preferences: item.notification_preferences as any || { email: true, sms: false, in_app: true }
      }));
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching project hierarchy:', error);
      return [];
    }
  }

  /**
   * Get escalation targets based on project and escalation level
   */
  static async getEscalationTargets(
    projectId: string, 
    escalationLevel: 'team' | 'supervisor' | 'manager' | 'director'
  ): Promise<EscalationTarget[]> {
    try {
      const { data, error } = await supabase.rpc('get_escalation_targets', {
        project_id_param: projectId,
        escalation_level_param: escalationLevel
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching escalation targets:', error);
      return [];
    }
  }

  /**
   * Get hierarchy chain (up or down the org chart)
   */
  static async getHierarchyChain(
    employeeId: string, 
    direction: 'up' | 'down' = 'up'
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_hierarchy_chain', {
        employee_id_param: employeeId,
        direction: direction
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching hierarchy chain:', error);
      return [];
    }
  }

  /**
   * Get project organizations and their relationships
   */
  static async getProjectOrganizations(projectId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('project_organizations')
        .select(`
          *,
          organizations (
            id,
            name,
            code,
            description
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching project organizations:', error);
      return [];
    }
  }

  /**
   * Find appropriate notification recipients based on context
   */
  static async findNotificationRecipients(
    projectId: string,
    context: {
      type: 'bank_guarantee' | 'inspection' | 'insurance' | 'payment';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      escalationLevel?: 'team' | 'supervisor' | 'manager' | 'director';
      department?: string;
      requiresApproval?: boolean;
    }
  ): Promise<EscalationTarget[]> {
    try {
      let recipients: EscalationTarget[] = [];

      // Get base escalation targets
      if (context.escalationLevel) {
        recipients = await this.getEscalationTargets(projectId, context.escalationLevel);
      } else {
        // Auto-determine escalation level based on priority
        const autoLevel = context.priority === 'urgent' ? 'director' : 
                         context.priority === 'high' ? 'manager' : 'supervisor';
        recipients = await this.getEscalationTargets(projectId, autoLevel);
      }

      // Filter by department if specified
      if (context.department) {
        recipients = recipients.filter(r => 
          r.department.toLowerCase().includes(context.department!.toLowerCase())
        );
      }

      // Add context-specific filtering
      switch (context.type) {
        case 'bank_guarantee':
        case 'payment':
          // Include finance team
          const financeTeam = await this.getEscalationTargets(projectId, 'team');
          const financeMembers = financeTeam.filter(r => 
            r.department.toLowerCase().includes('finance') ||
            r.position_title.toLowerCase().includes('finance')
          );
          recipients = [...recipients, ...financeMembers];
          break;

        case 'inspection':
          // Include quality/construction team
          const qualityTeam = await this.getEscalationTargets(projectId, 'team');
          const qualityMembers = qualityTeam.filter(r => 
            r.department.toLowerCase().includes('quality') ||
            r.department.toLowerCase().includes('construction') ||
            r.position_title.toLowerCase().includes('inspecteur')
          );
          recipients = [...recipients, ...qualityMembers];
          break;

        case 'insurance':
          // Include legal/risk management team
          const legalTeam = await this.getEscalationTargets(projectId, 'team');
          const legalMembers = legalTeam.filter(r => 
            r.department.toLowerCase().includes('legal') ||
            r.department.toLowerCase().includes('risk') ||
            r.position_title.toLowerCase().includes('juridique')
          );
          recipients = [...recipients, ...legalMembers];
          break;
      }

      // Remove duplicates
      const uniqueRecipients = recipients.filter((recipient, index, self) => 
        index === self.findIndex(r => r.employee_id === recipient.employee_id)
      );

      return uniqueRecipients;
    } catch (error) {
      console.error('Error finding notification recipients:', error);
      return [];
    }
  }

  /**
   * Get approval authorities for a project
   */
  static async getApprovalAuthorities(
    projectId: string, 
    approvalType: 'projects' | 'payments'
  ): Promise<EscalationTarget[]> {
    try {
      const hierarchy = await this.getProjectHierarchy(projectId);
      
      const authorities = hierarchy.filter(h => {
        return approvalType === 'projects' ? h.can_approve_projects : h.can_approve_payments;
      });

      return authorities.map(h => ({
        employee_id: h.employee_id,
        employee_name: h.employee_name,
        employee_email: h.employee_email,
        employee_phone: h.employee_phone,
        position_title: h.position_title,
        department: h.department,
        hierarchy_level: h.level
      }));
    } catch (error) {
      console.error('Error getting approval authorities:', error);
      return [];
    }
  }
}

export default OrganizationalHierarchyService;