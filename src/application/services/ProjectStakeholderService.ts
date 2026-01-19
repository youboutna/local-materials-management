import { supabase } from '@/integrations/supabase/client';

export interface ProjectStakeholder {
  id?: string;
  project_id: string;
  stakeholder_type: string;
  stakeholder_entity_type: 'employee' | 'supplier';
  employee_id?: string;
  supplier_id?: string;
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
      for (const stakeholder of stakeholders) {
        if (stakeholder.selected) {
          stakeholderRecords.push({
            project_id: projectId,
            stakeholder_type: stakeholder.type || 'supplier',
            stakeholder_entity_type: 'supplier',
            supplier_id: stakeholder.id,
            role_description: stakeholder.role_description || '',
            is_primary: stakeholder.is_primary || false
          });
        }
      }
    }

    // Add team delegation (employees) - only if it exists
    if (delegation && Object.keys(delegation).length > 0) {
      for (const [role, employees] of Object.entries(delegation)) {
        if (Array.isArray(employees)) {
          for (const employee of employees) {
            if (employee && employee.selected) {
              stakeholderRecords.push({
                project_id: projectId,
                stakeholder_type: role,
                stakeholder_entity_type: 'employee',
                employee_id: employee.id,
                role_description: employee.role_description || '',
                is_primary: employee.is_primary || false
              });
            }
          }
        }
      }
    }

    // Insert all stakeholder records
    if (stakeholderRecords.length > 0) {
      const { error } = await supabase
        .from('project_stakeholders')
        .insert(stakeholderRecords);

      if (error) {
        console.error('Error creating project stakeholders:', error);
        throw new Error(`Failed to create project stakeholders: ${error.message}`);
      }
    }
  }

  /**
   * Get all stakeholders for a project
   * @param projectId The project ID
   * @returns Array of project stakeholders
   */
  static async getProjectStakeholders(projectId: string): Promise<ProjectStakeholder[]> {
    const { data, error } = await supabase
      .from('project_stakeholders')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching project stakeholders:', error);
      throw new Error(`Failed to fetch project stakeholders: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update a project stakeholder
   * @param stakeholderId The stakeholder ID
   * @param updates The updates to apply
   * @returns Updated stakeholder
   */
  static async updateProjectStakeholder(
    stakeholderId: string, 
    updates: Partial<ProjectStakeholder>
  ): Promise<ProjectStakeholder> {
    const { data, error } = await supabase
      .from('project_stakeholders')
      .update(updates)
      .eq('id', stakeholderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project stakeholder:', error);
      throw new Error(`Failed to update project stakeholder: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a project stakeholder
   * @param stakeholderId The stakeholder ID
   */
  static async deleteProjectStakeholder(stakeholderId: string): Promise<void> {
    const { error } = await supabase
      .from('project_stakeholders')
      .delete()
      .eq('id', stakeholderId);

    if (error) {
      console.error('Error deleting project stakeholder:', error);
      throw new Error(`Failed to delete project stakeholder: ${error.message}`);
    }
  }

  /**
   * Get stakeholders by type for a project
   * @param projectId The project ID
   * @param stakeholderType The stakeholder type
   * @returns Array of stakeholders of the specified type
   */
  static async getStakeholdersByType(
    projectId: string, 
    stakeholderType: string
  ): Promise<ProjectStakeholder[]> {
    const { data, error } = await supabase
      .from('project_stakeholders')
      .select('*')
      .eq('project_id', projectId)
      .eq('stakeholder_type', stakeholderType)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching stakeholders by type:', error);
      throw new Error(`Failed to fetch stakeholders by type: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get primary stakeholders for a project
   * @param projectId The project ID
   * @returns Array of primary stakeholders
   */
  static async getPrimaryStakeholders(projectId: string): Promise<ProjectStakeholder[]> {
    const { data, error } = await supabase
      .from('project_stakeholders')
      .select('*')
      .eq('project_id', projectId)
      .eq('is_primary', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching primary stakeholders:', error);
      throw new Error(`Failed to fetch primary stakeholders: ${error.message}`);
    }

    return data || [];
  }
}
