/**
 * Project Stakeholder Service
 * Uses in-memory storage as the table schema differs
 */

export interface ProjectStakeholder {
  id: string;
  project_id: string;
  stakeholder_type: string;
  stakeholder_entity_type: 'employee' | 'supplier';
  employee_id?: string;
  supplier_id?: string;
  role_description?: string;
  is_primary?: boolean;
  created_at: string;
  updated_at: string;
}

// In-memory store
const stakeholdersStore = new Map<string, ProjectStakeholder>();

export class ProjectStakeholderService {
  /**
   * Create project stakeholders
   */
  static async createProjectStakeholders(
    projectId: string, 
    stakeholders: unknown[] = [], 
    delegation: Record<string, unknown[]> = {}
  ): Promise<void> {
    const now = new Date().toISOString();

    // Add external stakeholders (suppliers)
    if (stakeholders && stakeholders.length > 0) {
      for (const stakeholder of stakeholders as Record<string, unknown>[]) {
        if (stakeholder.selected) {
          const record: ProjectStakeholder = {
            id: crypto.randomUUID(),
            project_id: projectId,
            stakeholder_type: (stakeholder.type as string) || 'supplier',
            stakeholder_entity_type: 'supplier',
            supplier_id: stakeholder.id as string,
            role_description: (stakeholder.role_description as string) || '',
            is_primary: (stakeholder.is_primary as boolean) || false,
            created_at: now,
            updated_at: now
          };
          stakeholdersStore.set(record.id, record);
        }
      }
    }

    // Add team delegation (employees)
    if (delegation && Object.keys(delegation).length > 0) {
      for (const [role, employees] of Object.entries(delegation)) {
        if (Array.isArray(employees)) {
          for (const employee of employees as Record<string, unknown>[]) {
            if (employee && employee.selected) {
              const record: ProjectStakeholder = {
                id: crypto.randomUUID(),
                project_id: projectId,
                stakeholder_type: role,
                stakeholder_entity_type: 'employee',
                employee_id: employee.id as string,
                role_description: (employee.role_description as string) || '',
                is_primary: (employee.is_primary as boolean) || false,
                created_at: now,
                updated_at: now
              };
              stakeholdersStore.set(record.id, record);
            }
          }
        }
      }
    }
  }

  /**
   * Get all stakeholders for a project
   */
  static async getProjectStakeholders(projectId: string): Promise<ProjectStakeholder[]> {
    const results: ProjectStakeholder[] = [];
    stakeholdersStore.forEach(stakeholder => {
      if (stakeholder.project_id === projectId) {
        results.push(stakeholder);
      }
    });
    return results.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  /**
   * Update a project stakeholder
   */
  static async updateProjectStakeholder(
    stakeholderId: string, 
    updates: Partial<ProjectStakeholder>
  ): Promise<ProjectStakeholder> {
    const existing = stakeholdersStore.get(stakeholderId);
    if (!existing) {
      throw new Error('Stakeholder not found');
    }

    const updated: ProjectStakeholder = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    stakeholdersStore.set(stakeholderId, updated);
    return updated;
  }

  /**
   * Delete a project stakeholder
   */
  static async deleteProjectStakeholder(stakeholderId: string): Promise<void> {
    stakeholdersStore.delete(stakeholderId);
  }

  /**
   * Get stakeholders by type for a project
   */
  static async getStakeholdersByType(
    projectId: string, 
    stakeholderType: string
  ): Promise<ProjectStakeholder[]> {
    const results: ProjectStakeholder[] = [];
    stakeholdersStore.forEach(stakeholder => {
      if (stakeholder.project_id === projectId && stakeholder.stakeholder_type === stakeholderType) {
        results.push(stakeholder);
      }
    });
    return results.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  /**
   * Get primary stakeholders for a project
   */
  static async getPrimaryStakeholders(projectId: string): Promise<ProjectStakeholder[]> {
    const results: ProjectStakeholder[] = [];
    stakeholdersStore.forEach(stakeholder => {
      if (stakeholder.project_id === projectId && stakeholder.is_primary) {
        results.push(stakeholder);
      }
    });
    return results.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  /**
   * Add a single stakeholder
   */
  static async addStakeholder(stakeholder: Omit<ProjectStakeholder, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectStakeholder> {
    const now = new Date().toISOString();
    const record: ProjectStakeholder = {
      ...stakeholder,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now
    };
    stakeholdersStore.set(record.id, record);
    return record;
  }
}
