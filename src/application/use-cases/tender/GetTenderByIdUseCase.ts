/**
 * Get Tender By Id Use Case
 * Retrieves a single tender by ID
 */

import { Tender } from '@/domain/entities/Tender';
import { ITenderRepository } from '@/domain/repositories';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface GetTenderByIdResult {
  success: boolean;
  tender: Tender | null;
  error?: string;
}

export class GetTenderByIdUseCase {
  private tenderRepository: ITenderRepository;

  constructor(tenderRepository?: ITenderRepository) {
    this.tenderRepository = tenderRepository || RepositoryFactory.getTenderRepository();
  }

  async execute(id: string): Promise<GetTenderByIdResult> {
    try {
      if (!id) {
        return { success: false, tender: null, error: 'Tender ID is required' };
      }

      const tender = await this.tenderRepository.findById(id);

      if (!tender) {
        return { success: false, tender: null, error: 'Tender not found' };
      }

      return { success: true, tender };
    } catch (error) {
      console.error('GetTenderByIdUseCase error:', error);
      return {
        success: false,
        tender: null,
        error: error instanceof Error ? error.message : 'Failed to fetch tender'
      };
    }
  }
}
