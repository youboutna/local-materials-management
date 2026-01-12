/**
 * Get Tenders List Use Case
 * Retrieves all tenders with optional filtering
 */

import { Tender, TenderStatus } from '@/domain/entities/Tender';
import { ITenderRepository } from '@/domain/repositories';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface GetTendersListResult {
  success: boolean;
  tenders: Tender[];
  error?: string;
}

export interface TenderFilters {
  status?: TenderStatus;
  projectId?: string;
}

export class GetTendersListUseCase {
  private tenderRepository: ITenderRepository;

  constructor(tenderRepository?: ITenderRepository) {
    this.tenderRepository = tenderRepository || RepositoryFactory.getTenderRepository();
  }

  async execute(filters?: TenderFilters): Promise<GetTendersListResult> {
    try {
      let tenders: Tender[];

      if (filters?.status) {
        tenders = await this.tenderRepository.findByStatus(filters.status);
      } else if (filters?.projectId) {
        tenders = await this.tenderRepository.findByProjectId(filters.projectId);
      } else {
        tenders = await this.tenderRepository.findAll();
      }

      return { success: true, tenders };
    } catch (error) {
      console.error('GetTendersListUseCase error:', error);
      return {
        success: false,
        tenders: [],
        error: error instanceof Error ? error.message : 'Failed to fetch tenders'
      };
    }
  }
}
