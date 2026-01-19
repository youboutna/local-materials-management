import { RepositoryFactory } from '@/repositories/RepositoryFactory';
import { ITenderRepository } from '@/domain/repositories/ITenderRepository';
import { Tender } from '@/domain/entities/Tender';
import { TenderDTO, TenderCreateDTO, TenderSubmissionDTO } from '@/dtos/transforms/shared';
import { TenderDomainTransformer } from '@/dtos/transforms/TenderDomainTransformer';

export class TenderServiceLegacy {
  private tenderRepository: ITenderRepository;
  private tenderTransformer: TenderDomainTransformer;

  constructor() {
    this.tenderRepository = RepositoryFactory.getTenderRepository();
    this.tenderTransformer = new TenderDomainTransformer();
  }

  /**
   * Get all tenders
   */
  async getAllTenders(): Promise<TenderDTO[]> {
    try {
      const tenders = await this.tenderRepository.findAll();
      return tenders.map(tender => this.tenderTransformer.toDTO(tender));
    } catch (error) {
      console.error('Error getting all tenders:', error);
      throw new Error(`Failed to get all tenders: ${error.message}`);
    }
  }

  /**
   * Get tender by ID
   */
  async getTenderById(id: string): Promise<TenderDTO | null> {
    try {
      const tender = await this.tenderRepository.findById(id);
      return tender ? this.tenderTransformer.toDTO(tender) : null;
    } catch (error) {
      console.error('Error getting tender by ID:', error);
      throw new Error(`Failed to get tender by ID: ${error.message}`);
    }
  }

  /**
   * Create a new tender
   */
  async createTender(tender: TenderCreateDTO): Promise<TenderDTO> {
    try {
      // Validate data
      const validation = this.tenderTransformer.validateCreateData(tender);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const entity = this.tenderTransformer.fromCreateDtoToEntity(tender);
      const createdTender = await this.tenderRepository.create(entity);
      return this.tenderTransformer.toDTO(createdTender);
    } catch (error) {
      console.error('Error creating tender:', error);
      throw new Error(`Failed to create tender: ${error.message}`);
    }
  }

  /**
   * Update tender
   */
  async updateTender(id: string, updates: Partial<TenderCreateDTO>): Promise<TenderDTO> {
    try {
      // Validate data
      const validation = this.tenderTransformer.validateUpdateData(updates);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const entityUpdates = this.tenderTransformer.fromUpdateDtoToEntity(updates);
      const updatedTender = await this.tenderRepository.update(id, entityUpdates);
      return this.tenderTransformer.toDTO(updatedTender);
    } catch (error) {
      console.error('Error updating tender:', error);
      throw new Error(`Failed to update tender: ${error.message}`);
    }
  }

  /**
   * Delete tender
   */
  async deleteTender(id: string): Promise<void> {
    try {
      await this.tenderRepository.delete(id);
    } catch (error) {
      console.error('Error deleting tender:', error);
      throw new Error(`Failed to delete tender: ${error.message}`);
    }
  }

  /**
   * Get tender submissions
   */
  async getTenderSubmissions(tenderId: string): Promise<TenderSubmissionDTO[]> {
    try {
      const submissions = await this.tenderRepository.getSubmissions(tenderId);
      return submissions.map(submission => this.tenderTransformer.submissionToDTO(submission));
    } catch (error) {
      console.error('Error getting tender submissions:', error);
      throw new Error(`Failed to get tender submissions: ${error.message}`);
    }
  }

  /**
   * Get tenders by status
   */
  async getTendersByStatus(status: 'draft' | 'published' | 'closed' | 'awarded'): Promise<TenderDTO[]> {
    try {
      const tenders = await this.tenderRepository.findByStatus(status);
      return tenders.map(tender => this.tenderTransformer.toDTO(tender));
    } catch (error) {
      console.error('Error getting tenders by status:', error);
      throw new Error(`Failed to get tenders by status: ${error.message}`);
    }
  }

  /**
   * Search tenders
   */
  async searchTenders(searchTerm: string): Promise<TenderDTO[]> {
    try {
      const tenders = await this.tenderRepository.search(searchTerm);
      return tenders.map(tender => this.tenderTransformer.toDTO(tender));
    } catch (error) {
      console.error('Error searching tenders:', error);
      throw new Error(`Failed to search tenders: ${error.message}`);
    }
  }

  /**
   * Get published tenders available for supplier submission (Phase 2 + valid deadline)
   */
  async getPublishedTendersForSubmission(): Promise<TenderDTO[]> {
    try {
      const tenders = await this.tenderRepository.findPublishedPhase2WithValidDeadline();
      return tenders.map(tender => this.tenderTransformer.toDTO(tender));
    } catch (error) {
      console.error('Error getting published tenders for submission:', error);
      throw new Error(`Failed to get published tenders for submission: ${error.message}`);
    }
  }

  /**
   * Get tenders by project
   */
  async getTendersByProject(projectId: string): Promise<TenderDTO[]> {
    try {
      const tenders = await this.tenderRepository.findByProjectId(projectId);
      return tenders.map(tender => this.tenderTransformer.toDTO(tender));
    } catch (error) {
      console.error('Error getting tenders by project:', error);
      throw new Error(`Failed to get tenders by project: ${error.message}`);
    }
  }

  /**
   * Get tender statistics
   * @returns Statistics object
   */
  async getTenderStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byMarketType: Record<string, number>;
    byFinancingSource: Record<string, number>;
    publishedThisMonth: number;
    closingThisMonth: number;
  }> {
    try {
      return await this.tenderRepository.getStats();
    } catch (error) {
      console.error('Error getting tender stats:', error);
      throw new Error(`Failed to get tender stats: ${error.message}`);
    }
  }

  /**
   * Validate tender data
   * @param data The tender data to validate
   * @returns Validation result
   */
  validateTenderData(data: TenderCreateDTO | Partial<TenderCreateDTO>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Tender title is required');
    }

    if (!data.description || data.description.trim().length === 0) {
      errors.push('Tender description is required');
    }

    if (data.deadline_date && isNaN(new Date(data.deadline_date).getTime())) {
      errors.push('Invalid deadline date format');
    }

    if (data.publication_date && isNaN(new Date(data.publication_date).getTime())) {
      errors.push('Invalid publication date format');
    }

    if (data.budget_min && data.budget_max && data.budget_min > data.budget_max) {
      errors.push('Minimum budget cannot be greater than maximum budget');
    }

    if (data.status && !['draft', 'published', 'closed', 'awarded'].includes(data.status)) {
      errors.push('Status must be one of: draft, published, closed, awarded');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
