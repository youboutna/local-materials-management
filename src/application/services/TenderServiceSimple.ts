/**
 * Simple Tender Service
 * Implements business logic for tender management
 * Following hexagonal architecture principles
 */

import { ITenderRepository } from '@/domain/repositories/ITenderRepository';

export interface TenderOption {
  id: string;
  title: string;
  reference: string;
  project_id: string;
  status?: string;
}

export class TenderService {
  constructor(
    private tenderRepository: ITenderRepository
  ) {}

  /**
   * Get tenders for a specific project
   */
  async getProjectTenders(projectId: string): Promise<TenderOption[]> {
    try {
      if (!projectId) {
        return [];
      }

      // Get tenders from repository
      const tenders = await this.tenderRepository.findByProjectId(projectId);
      
      const tenderOptions: TenderOption[] = tenders.map((tender, index) => ({
        id: tender.id,
        title: tender.title || `Appel d'offres ${index + 1}`,
        reference: tender.tenderNumber || `AO-${projectId}-${index + 1}`,
        project_id: projectId,
        status: tender.status
      }));

      return tenderOptions.slice(0, 10);
    } catch (error) {
      console.error('TenderService.getProjectTenders failed:', error);
      return [];
    }
  }

  /**
   * Get tender by ID
   */
  async getTenderById(id: string) {
    try {
      return await this.tenderRepository.findById(id);
    } catch (error) {
      console.error('TenderService.getTenderById failed:', error);
      return null;
    }
  }

  /**
   * Get all tenders
   */
  async getAllTenders() {
    try {
      return await this.tenderRepository.findAll();
    } catch (error) {
      console.error('TenderService.getAllTenders failed:', error);
      return [];
    }
  }
}
