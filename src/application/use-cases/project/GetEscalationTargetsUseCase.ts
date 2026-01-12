/**
 * Get Escalation Targets Use Case
 * Retrieves appropriate escalation targets for workflow actions
 */

import { EscalationTarget, EscalationLevel } from '@/domain/entities';
import { IHierarchyRepository } from '@/domain/repositories';

export interface GetEscalationTargetsResult {
  targets: EscalationTarget[];
  success: boolean;
  error?: string;
}

export class GetEscalationTargetsUseCase {
  constructor(private hierarchyRepository: IHierarchyRepository) {}

  async execute(
    projectId: string,
    level: EscalationLevel
  ): Promise<GetEscalationTargetsResult> {
    try {
      if (!projectId) {
        return {
          targets: [],
          success: false,
          error: 'Project ID is required',
        };
      }

      const targets = await this.hierarchyRepository.getEscalationTargets(projectId, level);

      return {
        targets,
        success: true,
      };
    } catch (error) {
      console.error('GetEscalationTargetsUseCase error:', error);
      return {
        targets: [],
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get escalation targets',
      };
    }
  }
}
