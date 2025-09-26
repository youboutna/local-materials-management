import { supabase } from '@/integrations/supabase/client';

export interface ProjectStakeholder {
  id?: string;
  project_id: string;
  stakeholder_type: string;
  stakeholder_entity_type: 'employee' | 'supplier';
  stakeholder_id: string;
  role_description?: string;
  is_primary?: boolean;
}

export class ProjectStakeholderService {
  
  /**
   * Create project stakeholders in the database
   * @param projectId The project ID
   * @param stakeholders Array of stakeholder configurations
   * @param delegation Team delegation object
   */
  static async createProjectStakeholders(
    projectId: string, 
    stakeholders: any[] = [], 
    delegation: any = {}
  ): Promise<void> {
    const stakeholderRecords: ProjectStakeholder[] = [];

    // Add external stakeholders (suppliers) - only if they exist
    if (stakeholders && stakeholders.length > 0) {
      stakeholders.forEach((stakeholder) => {
        stakeholderRecords.push({
          project_id: projectId,
          stakeholder_type: stakeholder.type,
          stakeholder_entity_type: 'supplier',
          stakeholder_id: stakeholder.id,
          role_description: stakeholder.role_description,
          is_primary: stakeholder.is_primary || false
        });
      });
    }

    // Add internal team (employees) - only if delegation is provided
    if (delegation && typeof delegation === 'object') {
      Object.entries(delegation).forEach(([role, employeeId]) => {
        if (employeeId && typeof employeeId === 'string') {
          const stakeholderType = this.mapRoleToStakeholderType(role);
          stakeholderRecords.push({
            project_id: projectId,
            stakeholder_type: stakeholderType,
            stakeholder_entity_type: 'employee',
            stakeholder_id: employeeId,
            is_primary: role === 'projectManager'
          });
        }
      });
    }

    // Insert all stakeholder records only if there are any
    if (stakeholderRecords.length > 0) {
      const { error } = await supabase
        .from('project_stakeholders')
        .insert(stakeholderRecords);

      if (error) {
        console.error('Error creating project stakeholders:', error);
        throw new Error('Failed to create project stakeholders');
      }
    }
  }

  /**
   * Get project stakeholders
   * @param projectId The project ID
   */
  static async getProjectStakeholders(projectId: string) {
    const { data, error } = await supabase
      .from('project_stakeholders')
      .select(`
        *,
        employee:employees(*),
        supplier:suppliers(*)
      `)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching project stakeholders:', error);
      throw new Error('Failed to fetch project stakeholders');
    }

    return data;
  }

  /**
   * Update project stakeholders
   * @param projectId The project ID
   * @param stakeholders New stakeholder configuration
   * @param delegation New delegation configuration
   */
  static async updateProjectStakeholders(
    projectId: string,
    stakeholders: any[],
    delegation: any
  ): Promise<void> {
    // First, delete existing stakeholders
    await supabase
      .from('project_stakeholders')
      .delete()
      .eq('project_id', projectId);

    // Then create new ones
    await this.createProjectStakeholders(projectId, stakeholders, delegation);
  }

  /**
   * Map delegation role to stakeholder type
   * @param role The role key from delegation object
   */
  private static mapRoleToStakeholderType(role: string): string {
    const roleMapping: { [key: string]: string } = {
      projectManager: 'project_manager',
      technicalManager: 'technical_manager',
      supervisor: 'supervisor',
      client: 'client'
    };

    return roleMapping[role] || role;
  }
}