/**
 * Get Project Hierarchy Use Case
 * Retrieves the full project hierarchy for navigation and display
 */

import { ProjectHierarchy } from '@/domain/entities';
import { IHierarchyRepository } from '@/domain/repositories';

export interface GetProjectHierarchyResult {
  hierarchy: ProjectHierarchy;
  success: boolean;
  error?: string;
}

export class GetProjectHierarchyUseCase {
  constructor(private hierarchyRepository: IHierarchyRepository) {}

  async execute(projectId: string): Promise<GetProjectHierarchyResult> {
    try {
      if (!projectId || projectId === 'new-project') {
        return {
          hierarchy: ProjectHierarchy.create(projectId, []),
          success: true,
        };
      }

      const hierarchy = await this.hierarchyRepository.getProjectHierarchy(projectId);

      return {
        hierarchy,
        success: true,
      };
    } catch (error) {
      console.error('GetProjectHierarchyUseCase error:', error);
      return {
        hierarchy: ProjectHierarchy.create(projectId, []),
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load hierarchy',
      };
    }
  }
}
