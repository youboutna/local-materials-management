/**
 * ProjectBudgetLinkService - Application layer
 * Orchestrates project-budget linkage operations
 * Following hexagonal architecture principles
 */
import type { IProjectBudgetLinkRepository } from '@/domain/repositories/IProjectBudgetLinkRepository';
import type {
  ProjectBudgetLinkDTO,
  CreateProjectBudgetLinkDTO,
  UpdateProjectBudgetLinkDTO,
} from '@/dtos/entities/ProjectBudgetLinkDTO';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class ProjectBudgetLinkService {
  constructor(
    private readonly budgetLinkRepository: IProjectBudgetLinkRepository
  ) {}

  /**
   * Get all budget links for a project
   */
  async getLinksByProjectId(projectId: string): Promise<ProjectBudgetLinkDTO[]> {
    try {
      return await this.budgetLinkRepository.findByProjectId(projectId);
    } catch (error) {
      console.error('[ProjectBudgetLinkService] getLinksByProjectId error:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch budget links');
    }
  }

  /**
   * Create a new budget link
   */
  async createLink(dto: CreateProjectBudgetLinkDTO): Promise<ProjectBudgetLinkDTO> {
    this.validateCreateDTO(dto);
    try {
      return await this.budgetLinkRepository.create(dto);
    } catch (error) {
      console.error('[ProjectBudgetLinkService] createLink error:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create budget link');
    }
  }

  /**
   * Update an existing budget link
   */
  async updateLink(id: string, dto: UpdateProjectBudgetLinkDTO): Promise<ProjectBudgetLinkDTO> {
    try {
      return await this.budgetLinkRepository.update(id, dto);
    } catch (error) {
      console.error('[ProjectBudgetLinkService] updateLink error:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update budget link');
    }
  }

  /**
   * Delete a budget link
   */
  async deleteLink(id: string): Promise<void> {
    try {
      await this.budgetLinkRepository.delete(id);
    } catch (error) {
      console.error('[ProjectBudgetLinkService] deleteLink error:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete budget link');
    }
  }

  /**
   * Batch create budget links
   */
  async batchCreateLinks(projectId: string, links: CreateProjectBudgetLinkDTO[]): Promise<ProjectBudgetLinkDTO[]> {
    const results: ProjectBudgetLinkDTO[] = [];
    for (const link of links) {
      const linkWithProject = { ...link, projectId };
      results.push(await this.createLink(linkWithProject));
    }
    return results;
  }

  /**
   * Calculate total allocated amounts for a project
   */
  calculateTotalAllocations(links: ProjectBudgetLinkDTO[]): { totalCe: number; totalCp: number } {
    return {
      totalCe: links.reduce((sum, link) => sum + (link.allocatedCe || 0), 0),
      totalCp: links.reduce((sum, link) => sum + (link.allocatedCp || 0), 0),
    };
  }

  /**
   * Validate create DTO
   */
  private validateCreateDTO(dto: CreateProjectBudgetLinkDTO): void {
    if (!dto.projectId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    }
    if (dto.allocatedCe !== undefined && dto.allocatedCe < 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Allocated CE must be non-negative');
    }
    if (dto.allocatedCp !== undefined && dto.allocatedCp < 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Allocated CP must be non-negative');
    }
  }
}

let projectBudgetLinkServiceInstance: ProjectBudgetLinkService | null = null;
export function getProjectBudgetLinkService(): ProjectBudgetLinkService {
  if (!projectBudgetLinkServiceInstance) {
    projectBudgetLinkServiceInstance = new ProjectBudgetLinkService(RepositoryFactory.getProjectBudgetLinkRepository());
  }
  return projectBudgetLinkServiceInstance;
}
