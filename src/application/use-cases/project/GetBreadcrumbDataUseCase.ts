/**
 * Get Breadcrumb Data Use Case
 * Retrieves minimal data needed for breadcrumb navigation
 */

import { IProjectRepository } from '@/domain/repositories';
import { IPhaseRepository } from '@/domain/repositories';

export interface BreadcrumbData {
  project?: { id: string; title: string };
  phase?: { id: string; name: string };
  step?: { id: string; name: string };
}

export interface GetBreadcrumbDataResult {
  data: BreadcrumbData;
  success: boolean;
  error?: string;
}

export class GetBreadcrumbDataUseCase {
  constructor(
    private projectRepository: IProjectRepository,
    private phaseRepository: IPhaseRepository
  ) {}

  async execute(
    projectId?: string,
    phaseId?: string,
    stepId?: string
  ): Promise<GetBreadcrumbDataResult> {
    try {
      const data: BreadcrumbData = {};

      // Load project data
      if (projectId) {
        const project = await this.projectRepository.findForBreadcrumb(projectId);
        if (project) {
          data.project = project;
        }
      }

      // Load phase data
      if (phaseId) {
        const phase = await this.phaseRepository.findForBreadcrumb(phaseId);
        if (phase) {
          data.phase = phase;
        }

        // If step is requested, find it from phase
        if (stepId) {
          const phaseWithSteps = await this.phaseRepository.findWithSteps(phaseId);
          const step = phaseWithSteps?.steps.find(s => s.id === stepId);
          if (step) {
            data.step = { id: step.id, name: step.name };
          }
        }
      }

      return {
        data,
        success: true,
      };
    } catch (error) {
      console.error('GetBreadcrumbDataUseCase error:', error);
      return {
        data: {},
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load breadcrumb data',
      };
    }
  }
}
