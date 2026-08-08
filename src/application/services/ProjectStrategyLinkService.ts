/**
 * ProjectStrategyLinkService - Application layer
 * Orchestrates project-strategy linkage operations
 * Following hexagonal architecture principles
 */
import type { IProjectStrategyLinkRepository } from '@/domain/repositories/IProjectStrategyLinkRepository';
import type {
  ProjectStrategyLinkDTO,
  CreateProjectStrategyLinkDTO,
  UpdateProjectStrategyLinkDTO,
} from '@/dtos/entities/ProjectStrategyLinkDTO';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export class ProjectStrategyLinkService {
  constructor(
    private readonly strategyLinkRepository: IProjectStrategyLinkRepository
  ) {}

  /**
   * Get all strategy links for a project
   */
  async getLinksByProjectId(projectId: string): Promise<ProjectStrategyLinkDTO[]> {
    try {
      return await this.strategyLinkRepository.findByProjectId(projectId);
    } catch (error) {
      console.error('[ProjectStrategyLinkService] getLinksByProjectId error:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch strategy links');
    }
  }

  /**
   * Create a new strategy link
   */
  async createLink(dto: CreateProjectStrategyLinkDTO): Promise<ProjectStrategyLinkDTO> {
    this.validateCreateDTO(dto);
    try {
      return await this.strategyLinkRepository.create(dto);
    } catch (error) {
      console.error('[ProjectStrategyLinkService] createLink error:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to create strategy link');
    }
  }

  /**
   * Update an existing strategy link
   */
  async updateLink(id: string, dto: UpdateProjectStrategyLinkDTO): Promise<ProjectStrategyLinkDTO> {
    try {
      return await this.strategyLinkRepository.update(id, dto);
    } catch (error) {
      console.error('[ProjectStrategyLinkService] updateLink error:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update strategy link');
    }
  }

  /**
   * Delete a strategy link
   */
  async deleteLink(id: string): Promise<void> {
    try {
      await this.strategyLinkRepository.delete(id);
    } catch (error) {
      console.error('[ProjectStrategyLinkService] deleteLink error:', error);
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to delete strategy link');
    }
  }

  /**
   * Batch create strategy links
   */
  async batchCreateLinks(projectId: string, links: CreateProjectStrategyLinkDTO[]): Promise<ProjectStrategyLinkDTO[]> {
    const results: ProjectStrategyLinkDTO[] = [];
    for (const link of links) {
      const linkWithProject = { ...link, projectId };
      results.push(await this.createLink(linkWithProject));
    }
    return results;
  }

  /**
   * Calculate total contribution percentage for a project
   */
  calculateTotalContribution(links: ProjectStrategyLinkDTO[]): number {
    return links.reduce((sum, link) => sum + (link.contributionPct || 0), 0);
  }

  /**
   * Validate create DTO
   */
  private validateCreateDTO(dto: CreateProjectStrategyLinkDTO): void {
    if (!dto.projectId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    }
    if (dto.contributionPct !== undefined && (dto.contributionPct < 0 || dto.contributionPct > 100)) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Contribution percentage must be between 0 and 100');
    }
  }
}

let projectStrategyLinkServiceInstance: ProjectStrategyLinkService | null = null;
export function getProjectStrategyLinkService(): ProjectStrategyLinkService {
  if (!projectStrategyLinkServiceInstance) {
    projectStrategyLinkServiceInstance = new ProjectStrategyLinkService(RepositoryFactory.getProjectStrategyLinkRepository());
  }
  return projectStrategyLinkServiceInstance;
}
