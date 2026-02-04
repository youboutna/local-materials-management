/**
 * Project Stakeholder Service - Hexagonal Architecture
 * Business logic for managing project stakeholders and team delegation
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { 
  ProjectStakeholderDTO,
  CreateProjectStakeholderDTO,
  UpdateProjectStakeholderDTO,
  StakeholderDelegationDTO,
  ExternalStakeholderDTO,
  StakeholderInputDTO,
  CreateStakeholderInputDTO,
  StakeholderFormDataDTO
} from '@/dtos/entities/ProjectStakeholderDTO';

export class ProjectStakeholderService {
  constructor(
    private projectRepository: IProjectRepository = RepositoryFactory.getProjectRepository(),
    private projectStakeholderRepository: IProjectStakeholderRepository = RepositoryFactory.getProjectStakeholderRepository()
  ) {}

  /**
   * Create project stakeholders
   */
  async createProjectStakeholders(
    projectId: string,
    stakeholders: StakeholderInputDTO[],
    delegation: Record<string, unknown>
  ): Promise<ProjectStakeholderDTO[]> {
    try {
      const createdStakeholders: ProjectStakeholderDTO[] = [];

      for (const stakeholder of stakeholders) {
        const createInput: CreateStakeholderInputDTO = {
          ...stakeholder,
          projectId
        };

        const created = await this.createStakeholder(createInput);
        createdStakeholders.push(created);
      }

      return createdStakeholders;
    } catch (error) {
      console.error('Failed to create project stakeholders:', error);
      throw error;
    }
  }

  /**
   * Get all stakeholders for a project
   */
  async getProjectStakeholders(projectId: string): Promise<ProjectStakeholderDTO[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      const stakeholders = await this.projectStakeholderRepository.findByProjectId(projectId);
      return stakeholders.map(stakeholder => ({
        id: stakeholder.id,
        projectId: stakeholder.projectId,
        stakeholderType: stakeholder.stakeholderType,
        stakeholderEntityType: stakeholder.stakeholderEntityType,
        employeeId: stakeholder.employeeId,
        supplierId: stakeholder.supplierId,
        roleDescription: stakeholder.roleDescription,
        isPrimary: stakeholder.isPrimary,
        createdAt: stakeholder.createdAt.toISOString(),
        updatedAt: stakeholder.updatedAt.toISOString()
      }));
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
    updates: UpdateProjectStakeholderDTO
  ): Promise<ProjectStakeholderDTO> {
    try {
      if (!stakeholderId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Stakeholder ID is required');
      }
      if (!updates || Object.keys(updates).length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Update data is required');
      }

      const updatedStakeholder = await this.projectStakeholderRepository.update(stakeholderId, updates);
      return {
        id: updatedStakeholder.id,
        projectId: updatedStakeholder.projectId,
        stakeholderType: updatedStakeholder.stakeholderType,
        stakeholderEntityType: updatedStakeholder.stakeholderEntityType,
        employeeId: updatedStakeholder.employeeId,
        supplierId: updatedStakeholder.supplierId,
        roleDescription: updatedStakeholder.roleDescription,
        isPrimary: updatedStakeholder.isPrimary,
        createdAt: updatedStakeholder.createdAt.toISOString(),
        updatedAt: updatedStakeholder.updatedAt.toISOString()
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

      await this.projectStakeholderRepository.delete(stakeholderId);
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
  ): Promise<ProjectStakeholderDTO[]> {
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
  async getPrimaryStakeholders(projectId: string): Promise<ProjectStakeholderDTO[]> {
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
  async addStakeholder(request: CreateProjectStakeholderDTO): Promise<ProjectStakeholderDTO> {
    try {
      if (!request.projectId || !request.stakeholderType || !request.stakeholderEntityType) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID, stakeholder type, and entity type are required');
      }
      if (request.stakeholderEntityType === 'employee' && !request.employeeId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Employee ID is required for employee stakeholders');
      }
      if (request.stakeholderEntityType === 'supplier' && !request.supplierId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Supplier ID is required for supplier stakeholders');
      }

      const createdStakeholder = await this.projectStakeholderRepository.create({
        projectId: request.projectId,
        stakeholderType: request.stakeholderType,
        stakeholderEntityType: request.stakeholderEntityType,
        employeeId: request.employeeId,
        supplierId: request.supplierId,
        roleDescription: request.roleDescription,
        isPrimary: request.isPrimary
      });

      return {
        id: createdStakeholder.id,
        projectId: createdStakeholder.projectId,
        stakeholderType: createdStakeholder.stakeholderType,
        stakeholderEntityType: createdStakeholder.stakeholderEntityType,
        employeeId: createdStakeholder.employeeId,
        supplierId: createdStakeholder.supplierId,
        roleDescription: createdStakeholder.roleDescription,
        isPrimary: createdStakeholder.isPrimary,
        createdAt: createdStakeholder.createdAt.toISOString(),
        updatedAt: createdStakeholder.updatedAt.toISOString()
      };
    } catch (error) {
      console.error('ProjectStakeholderService.addStakeholder failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add stakeholder');
    }
  }

  private async createStakeholder(stakeholder: CreateStakeholderInputDTO): Promise<ProjectStakeholderDTO> {
    // Implement stakeholder creation logic here
    // For now, return mock data
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      projectId: stakeholder.projectId,
      stakeholderType: stakeholder.type,
      stakeholderEntityType: stakeholder.isInternal ? 'employee' : 'supplier',
      employeeId: stakeholder.employeeId,
      supplierId: stakeholder.organizationId,
      stakeholderId: stakeholder.id,
      stakeholderName: stakeholder.name,
      role: stakeholder.role,
      permissions: ['view', 'comment'],
      contactInfo: {
        email: stakeholder.email,
        phone: stakeholder.phone
      },
      createdAt: now,
      updatedAt: now
    };
  }
}
