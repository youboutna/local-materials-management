/**
 * Project Stakeholder Service - Hexagonal Architecture
 * Business logic for managing project stakeholders and team delegation
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface ProjectStakeholder {
  id: string;
  project_id: string;
  stakeholder_type: string;
  stakeholder_entity_type: 'employee' | 'supplier';
  employee_id?: string;
  supplier_id?: string;
  stakeholder_id?: string;
  stakeholder_name?: string;
  role?: string;
  permissions?: string[];
  contact_info?: Record<string, unknown>;
  role_description?: string;
  is_primary?: boolean;
  created_at: string;
  updated_at: string;
}

// Service DTOs for data exchange
export interface CreateProjectStakeholderRequestDto {
  project_id: string;
  stakeholder_type: string;
  stakeholder_entity_type: 'employee' | 'supplier';
  employee_id?: string;
  supplier_id?: string;
  role_description?: string;
  is_primary?: boolean;
}

export interface UpdateProjectStakeholderRequestDto {
  stakeholder_type?: string;
  stakeholder_entity_type?: 'employee' | 'supplier';
  employee_id?: string;
  supplier_id?: string;
  role_description?: string;
  is_primary?: boolean;
}

export interface StakeholderDelegationDto {
  role: string;
  employees: Array<{
    id: string;
    selected: boolean;
    role_description?: string;
    is_primary?: boolean;
  }>;
}

export interface ExternalStakeholderDto {
  id: string;
  selected: boolean;
  type?: string;
  role_description?: string;
  is_primary?: boolean;
}

export class ProjectStakeholderService {
  constructor(
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository() // Using project repository as placeholder
  ) {}
  /**
   * Create project stakeholders
   */
  async createProjectStakeholders(
    projectId: string,
    stakeholders: any[],
    delegation: Record<string, any>
  ): Promise<ProjectStakeholder[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const now = new Date().toISOString();
      console.log(`Creating stakeholders for project: ${projectId}`);
      console.log(`External stakeholders: ${stakeholders.length}`);
      console.log(`Delegation roles: ${Object.keys(delegation).length}`);
      
      // Create stakeholder records using project repository as workaround
      const createdStakeholders: ProjectStakeholder[] = [];
      
      // Add external stakeholders (suppliers)
      if (stakeholders && stakeholders.length > 0) {
        for (const stakeholder of stakeholders) {
          if (stakeholder.selected) {
            const stakeholderRecord: ProjectStakeholder = {
              id: crypto.randomUUID(),
              project_id: projectId,
              stakeholder_type: 'supplier',
              stakeholder_entity_type: 'supplier',
              stakeholder_id: stakeholder.id,
              stakeholder_name: stakeholder.name || 'Unknown Supplier',
              role: delegation?.supplier || 'external',
              permissions: ['view', 'comment'],
              contact_info: stakeholder.contact || {},
              created_at: now,
              updated_at: now
            };
            createdStakeholders.push(stakeholderRecord);
            console.log(`Creating supplier stakeholder: ${stakeholder.id}`);
          }
        }
      }

      // Add team delegation (employees)
      if (delegation && Object.keys(delegation).length > 0) {
        for (const [role, employees] of Object.entries(delegation)) {
          if (Array.isArray(employees)) {
            for (const employee of employees) {
              if (employee && employee.selected) {
                const stakeholderRecord: ProjectStakeholder = {
                  id: crypto.randomUUID(),
                  project_id: projectId,
                  stakeholder_type: 'employee',
                  stakeholder_entity_type: 'employee',
                  stakeholder_id: employee.id,
                  stakeholder_name: employee.name || 'Unknown Employee',
                  role: role,
                  permissions: ['view', 'comment', 'edit'],
                  contact_info: employee.contact || {},
                  created_at: now,
                  updated_at: now
                };
                createdStakeholders.push(stakeholderRecord);
                console.log(`Creating employee stakeholder: ${employee.id} with role: ${role}`);
              }
            }
          }
        }
      }

      return createdStakeholders;
    } catch (error) {
      console.error('ProjectStakeholderService.createProjectStakeholders failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create project stakeholders');
    }
  }

  /**
   * Get all stakeholders for a project
   */
  async getProjectStakeholders(projectId: string): Promise<ProjectStakeholder[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // For now, return mock data as project stakeholder repository is not available
      // TODO: Implement proper stakeholder retrieval when repository is available
      console.warn('ProjectStakeholderService.getProjectStakeholders: Project stakeholder repository not available');
      
      return [];
    } catch (error) {
      console.error('ProjectStakeholderService.getProjectStakeholders failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project stakeholders');
    }
  }

  /**
   * Update a project stakeholder
   */
  async updateProjectStakeholder(
    stakeholderId: string, 
    updates: UpdateProjectStakeholderRequestDto
  ): Promise<ProjectStakeholder> {
    try {
      if (!stakeholderId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Stakeholder ID is required');
      }
      if (!updates || Object.keys(updates).length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Update data is required');
      }

      // For now, return mock data as project stakeholder repository is not available
      // TODO: Implement proper stakeholder update when repository is available
      console.warn('ProjectStakeholderService.updateProjectStakeholder: Project stakeholder repository not available');
      
      const now = new Date().toISOString();
      return {
        id: stakeholderId,
        project_id: 'mock-project-id',
        stakeholder_type: updates.stakeholder_type || 'supplier',
        stakeholder_entity_type: updates.stakeholder_entity_type || 'supplier',
        employee_id: updates.employee_id,
        supplier_id: updates.supplier_id,
        role_description: updates.role_description,
        is_primary: updates.is_primary,
        created_at: now,
        updated_at: now
      };
    } catch (error) {
      console.error('ProjectStakeholderService.updateProjectStakeholder failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update project stakeholder');
    }
  }

  /**
   * Delete a project stakeholder
   */
  async deleteProjectStakeholder(stakeholderId: string): Promise<void> {
    try {
      if (!stakeholderId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Stakeholder ID is required');
      }

      // For now, simulate deletion as project stakeholder repository is not available
      // TODO: Implement proper stakeholder deletion when repository is available
      console.warn('ProjectStakeholderService.deleteProjectStakeholder: Project stakeholder repository not available');
      console.log(`Deleting stakeholder: ${stakeholderId}`);
    } catch (error) {
      console.error('ProjectStakeholderService.deleteProjectStakeholder failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete project stakeholder');
    }
  }

  /**
   * Get stakeholders by type for a project
   */
  async getStakeholdersByType(
    projectId: string, 
    stakeholderType: string
  ): Promise<ProjectStakeholder[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }
      if (!stakeholderType) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Stakeholder type is required');
      }

      // For now, return mock data as project stakeholder repository is not available
      // TODO: Implement proper stakeholder retrieval by type when repository is available
      console.warn('ProjectStakeholderService.getStakeholdersByType: Project stakeholder repository not available');
      
      return [];
    } catch (error) {
      console.error('ProjectStakeholderService.getStakeholdersByType failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get stakeholders by type');
    }
  }

  /**
   * Get primary stakeholders for a project
   */
  async getPrimaryStakeholders(projectId: string): Promise<ProjectStakeholder[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // For now, return mock data as project stakeholder repository is not available
      // TODO: Implement proper primary stakeholder retrieval when repository is available
      console.warn('ProjectStakeholderService.getPrimaryStakeholders: Project stakeholder repository not available');
      
      return [];
    } catch (error) {
      console.error('ProjectStakeholderService.getPrimaryStakeholders failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get primary stakeholders');
    }
  }

  /**
   * Add a single stakeholder
   */
  async addStakeholder(request: CreateProjectStakeholderRequestDto): Promise<ProjectStakeholder> {
    try {
      if (!request.project_id || !request.stakeholder_type || !request.stakeholder_entity_type) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID, stakeholder type, and entity type are required');
      }
      if (request.stakeholder_entity_type === 'employee' && !request.employee_id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Employee ID is required for employee stakeholders');
      }
      if (request.stakeholder_entity_type === 'supplier' && !request.supplier_id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Supplier ID is required for supplier stakeholders');
      }

      // For now, return mock data as project stakeholder repository is not available
      // TODO: Implement proper stakeholder creation when repository is available
      console.warn('ProjectStakeholderService.addStakeholder: Project stakeholder repository not available');
      
      const now = new Date().toISOString();
      return {
        id: crypto.randomUUID(),
        project_id: request.project_id,
        stakeholder_type: request.stakeholder_type,
        stakeholder_entity_type: request.stakeholder_entity_type,
        employee_id: request.employee_id,
        supplier_id: request.supplier_id,
        role_description: request.role_description,
        is_primary: request.is_primary,
        created_at: now,
        updated_at: now
      };
    } catch (error) {
      console.error('ProjectStakeholderService.addStakeholder failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add stakeholder');
    }
  }
}
