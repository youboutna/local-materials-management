/**
 * Example: Using PhaseService with Referential Steps
 * This example demonstrates how to create phases with steps from the referential
 */

import { PhaseService } from '@/application/services/PhaseService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export class ConstructionPhaseWithStepsExample {
  private phaseService: PhaseService;

  constructor() {
    this.phaseService = new PhaseService(
      RepositoryFactory.getPhaseRepository()
    );
  }

  /**
   * Example 1: Create phases from CUSTOM_STANDARD referential
   */
  async createFromStandard(projectId: string) {
    const phases = await this.phaseService.getPhasesByProject(projectId);
    console.log('Loaded phases:', phases.length);
    return phases;
  }
}
