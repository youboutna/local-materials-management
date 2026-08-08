/**
 * Project Stakeholder Service - Hexagonal Architecture
 * Business logic for managing project stakeholders and team delegation
 */

import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
import { IProjectStakeholderRepository } from '@/domain/repositories/IProjectStakeholderRepository';
import {
    CreateProjectStakeholderDTO,
    CreateStakeholderInputDTO,
    ProjectStakeholderDTO,
    StakeholderInputDTO,
    UpdateProjectStakeholderDTO
} from '@/dtos/entities/ProjectStakeholderDTO';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

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
        stakeholderType: String(stakeholder.stakeholderType),
        stakeholderEntityType: stakeholder.stakeholderEntityType === 'external' ? 'supplier' : stakeholder.stakeholderEntityType as 'employee' | 'supplier',
        employeeId: stakeholder.employeeId || undefined,
        supplierId: stakeholder.supplierId || undefined,
        organizationId: stakeholder.organizationId || undefined,
        externalRef: stakeholder.externalRef || undefined,
        roleDescription: stakeholder.roleDescription || undefined,
        isPrimary: stakeholder.isActive,
        createdAt: stakeholder.createdAt,
        updatedAt: stakeholder.updatedAt
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

      const updateData = {
        stakeholderType: updates.stakeholderType as any,
        stakeholderEntityType: updates.stakeholderEntityType as any,
        employeeId: updates.employeeId ?? null,
        supplierId: updates.supplierId ?? null,
        organizationId: updates.organizationId ?? null,
        externalRef: updates.externalRef ?? null,
        roleDescription: updates.roleDescription ?? null,
        isActive: updates.isPrimary ?? true
      };

      const updatedStakeholder = await this.projectStakeholderRepository.update(stakeholderId, updateData as any);
      return {
        id: updatedStakeholder.id,
        projectId: updatedStakeholder.projectId,
        stakeholderType: String(updatedStakeholder.stakeholderType),
        stakeholderEntityType: updatedStakeholder.stakeholderEntityType === 'external' ? 'supplier' : updatedStakeholder.stakeholderEntityType as 'employee' | 'supplier',
        employeeId: updatedStakeholder.employeeId || undefined,
        supplierId: updatedStakeholder.supplierId || undefined,
        organizationId: updatedStakeholder.organizationId || undefined,
        externalRef: updatedStakeholder.externalRef || undefined,
        roleDescription: updatedStakeholder.roleDescription || undefined,
        isPrimary: updatedStakeholder.isActive,
        createdAt: updatedStakeholder.createdAt,
        updatedAt: updatedStakeholder.updatedAt
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

      const createData = {
        projectId: request.projectId,
        stakeholderType: request.stakeholderType as any,
        stakeholderEntityType: request.stakeholderEntityType as any,
        employeeId: request.employeeId ?? null,
        supplierId: request.supplierId ?? null,
        organizationId: request.organizationId ?? null,
        externalRef: request.externalRef ?? null,
        roleDescription: request.roleDescription ?? null,
        isActive: request.isPrimary ?? true
      };

      const createdStakeholder = await this.projectStakeholderRepository.create(createData as any);

      return {
        id: createdStakeholder.id,
        projectId: createdStakeholder.projectId,
        stakeholderType: String(createdStakeholder.stakeholderType),
        stakeholderEntityType: createdStakeholder.stakeholderEntityType === 'external' ? 'supplier' : createdStakeholder.stakeholderEntityType as 'employee' | 'supplier',
        employeeId: createdStakeholder.employeeId || undefined,
        supplierId: createdStakeholder.supplierId || undefined,
        organizationId: createdStakeholder.organizationId || undefined,
        externalRef: createdStakeholder.externalRef || undefined,
        roleDescription: createdStakeholder.roleDescription || undefined,
        isPrimary: createdStakeholder.isActive,
        createdAt: createdStakeholder.createdAt,
        updatedAt: createdStakeholder.updatedAt
      };
    } catch (error) {
      console.error('ProjectStakeholderService.addStakeholder failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add stakeholder');
    }
  }

  private async createStakeholder(stakeholder: CreateStakeholderInputDTO): Promise<ProjectStakeholderDTO> {
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

let projectStakeholderServiceInstance: ProjectStakeholderService | null = null;
export function getProjectStakeholderService(): ProjectStakeholderService {
  if (!projectStakeholderServiceInstance) {
    projectStakeholderServiceInstance = new ProjectStakeholderService();
  }
  return projectStakeholderServiceInstance;
}
