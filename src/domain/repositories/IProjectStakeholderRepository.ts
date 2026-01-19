/**
 * Project Stakeholder Repository Interface
 * Defines contract for project stakeholder data access
 * Following hexagonal architecture principles
 */

import { ProjectStakeholderEntity } from '@/domain/entities/ProjectStakeholder';

export interface IProjectStakeholderRepository {
  /**
   * Find stakeholder by ID
   */
  findById(id: string): Promise<ProjectStakeholderEntity | null>;

  /**
   * Find all stakeholders for a specific project
   */
  findByProjectId(projectId: string): Promise<ProjectStakeholderEntity[]>;

  /**
   * Find stakeholders by type
   */
  findByType(stakeholderType: string): Promise<ProjectStakeholderEntity[]>;

  /**
   * Find stakeholders by employee ID
   */
  findByEmployeeId(employeeId: string): Promise<ProjectStakeholderEntity[]>;

  /**
   * Find stakeholders by supplier ID
   */
  findBySupplierId(supplierId: string): Promise<ProjectStakeholderEntity[]>;

  /**
   * Create new stakeholder
   */
  create(stakeholder: Omit<ProjectStakeholderEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProjectStakeholderEntity>;

  /**
   * Update existing stakeholder
   */
  update(id: string, updates: Partial<ProjectStakeholderEntity>): Promise<ProjectStakeholderEntity>;

  /**
   * Delete stakeholder
   */
  delete(id: string): Promise<void>;

  /**
   * Find all stakeholders (with optional filters)
   */
  findAll(filters?: {
    projectId?: string;
    stakeholderType?: string;
    isActive?: boolean;
  }): Promise<ProjectStakeholderEntity[]>;

  /**
   * Search stakeholders with criteria
   */
  search(criteria: {
    projectId?: string;
    searchTerm?: string;
    stakeholderType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    stakeholders: ProjectStakeholderEntity[];
    total: number;
  }>;

  /**
   * Check if stakeholder exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count stakeholders for a project
   */
  countByProject(projectId: string): Promise<number>;
}
