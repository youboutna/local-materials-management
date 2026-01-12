/**
 * Get Phase Details Use Case
 * Retrieves phase with full hierarchy and metrics
 */

import { Phase } from '@/domain/entities';
import { IPhaseRepository, PhaseMetrics } from '@/domain/repositories';

export interface GetPhaseDetailsResult {
  phase: Phase | null;
  metrics: PhaseMetrics;
  success: boolean;
  error?: string;
}

const defaultMetrics: PhaseMetrics = {
  materialCost: 0,
  totalMaterials: 0,
  totalTasks: 0,
  completedTasks: 0,
  taskCompletionRate: 0,
  totalInspections: 0,
  passedInspections: 0,
  inspectionPassRate: 0,
  totalEmployees: 0,
  totalPayments: 0,
  totalPaymentAmount: 0,
  totalDocuments: 0,
  milestoneProgress: 0,
  stepsCount: 0,
  completedSteps: 0,
};

export class GetPhaseDetailsUseCase {
  constructor(private phaseRepository: IPhaseRepository) {}

  async execute(phaseId: string): Promise<GetPhaseDetailsResult> {
    try {
      if (!phaseId) {
        return {
          phase: null,
          metrics: defaultMetrics,
          success: false,
          error: 'Phase ID is required',
        };
      }

      // Load phase with steps
      const phase = await this.phaseRepository.findWithSteps(phaseId);

      if (!phase) {
        return {
          phase: null,
          metrics: defaultMetrics,
          success: false,
          error: 'Phase not found',
        };
      }

      // Load metrics
      const metrics = await this.phaseRepository.getMetrics(phaseId);

      return {
        phase,
        metrics,
        success: true,
      };
    } catch (error) {
      console.error('GetPhaseDetailsUseCase error:', error);
      return {
        phase: null,
        metrics: defaultMetrics,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load phase details',
      };
    }
  }
}
