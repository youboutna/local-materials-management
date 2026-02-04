/**
 * TenderServiceLegacy - Hexagonal Architecture
 * Implements business logic for tender management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { ITenderRepository } from '@/domain/repositories/ITenderRepository';
import { 
  TenderDTO,
  TenderCreateDTO,
  TenderUpdateDTO,
  GetAllTendersRequestDTO,
  GetTenderByIdRequestDTO,
  GetTenderSubmissionsRequestDTO,
  GetTendersByStatusRequestDTO,
  SearchTendersRequestDTO,
  GetPublishedTendersForSubmissionRequestDTO,
  GetTendersByProjectRequestDTO,
  GetTenderStatsRequestDTO,
  TenderValidationResultDTO,
  TenderDocumentDTO,
  TenderSubmissionDTO
} from '@/dtos/entities/TenderDTO';

export class TenderServiceLegacy {
  constructor(
    private tenderRepository: ITenderRepository = RepositoryFactory.getTenderRepository()
  ) {}
  /**
   * Get all tenders
   */
  async getAllTenders(request?: GetAllTendersRequestDTO): Promise<TenderDTO[]> {
    try {
      // For now, return mock data as repository methods are not available
      // TODO: Implement proper repository methods when available
      console.warn('TenderServiceLegacy.getAllTenders: Repository methods not available');
      
      return [];
    } catch (error) {
      console.error('TenderServiceLegacy.getAllTenders failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all tenders');
    }
  }

  /**
   * Get tender by ID
   */
  async getTenderById(request: GetTenderByIdRequestDTO): Promise<TenderDTO | null> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }

      // For now, return mock data as repository methods are not available
      // TODO: Implement proper repository methods when available
      console.warn('TenderServiceLegacy.getTenderById: Repository methods not available');
      
      return null;
    } catch (error) {
      console.error('TenderServiceLegacy.getTenderById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get tender by ID');
    }
  }

  /**
   * Create a new tender
   */
  async createTender(request: TenderCreateDTO): Promise<TenderDTO> {
    try {
      if (!request.title || !request.description) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Title and description are required');
      }

      // Validate tender data
      const validation = this.validateTenderData(request);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, validation.errors.join(', '));
      }

      const tenderNumber = request.tender_number || `AO-${Date.now()}`;
      
      const tenderData: TenderDTO = {
        id: `tender_${Date.now()}`,
        ...request,
        tender_number: tenderNumber,
        status: request.status || 'draft'
      };

      // For now, return mock data as create method is not available in repository
      // TODO: Implement proper tender creation when repository supports it
      console.warn('TenderServiceLegacy.createTender: Create method not available in repository');
      
      const mockTender: TenderDTO = {
        id: `tender_${Date.now()}`,
        title: request.title,
        description: request.description,
        project_id: request.project_id || null,
        tender_number: tenderNumber,
        status: request.status || 'draft',
        market_type: request.market_type,
        financing_source: request.financing_source,
        budget_min: request.budget_min,
        budget_max: request.budget_max,
        publication_date: request.publication_date,
        deadline_date: request.deadline_date,
        opening_date: request.opening_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return mockTender;
    } catch (error) {
      console.error('TenderServiceLegacy.createTender failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create tender');
    }
  }

  /**
   * Update tender
   */
  async updateTender(request: { id: string; updates: TenderUpdateDTO }): Promise<TenderDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }
      if (!request.updates || Object.keys(request.updates).length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Update data is required');
      }

      // Validate update data
      const validation = this.validateTenderData(request.updates);
      if (!validation.isValid) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, validation.errors.join(', '));
      }

      // For now, return mock data as update method is not available in repository
      // TODO: Implement proper tender update when repository supports it
      console.warn('TenderServiceLegacy.updateTender: Update method not available in repository');
      
      const mockTender: TenderDTO = {
        id: request.id,
        title: 'Updated Tender',
        description: 'Updated Description',
        project_id: null,
        tender_number: 'AO-UPDATED',
        status: 'draft',
        market_type: 'Construction',
        financing_source: 'Self-funded',
        budget_min: 100000,
        budget_max: 200000,
        publication_date: new Date().toISOString(),
        deadline_date: new Date().toISOString(),
        opening_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...request.updates
      };
      
      return mockTender;
    } catch (error) {
      console.error('TenderServiceLegacy.updateTender failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update tender');
    }
  }

  /**
   * Delete tender
   */
  async deleteTender(request: { id: string }): Promise<void> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }

      await this.tenderRepository.delete(request.id);
    } catch (error) {
      console.error('TenderServiceLegacy.deleteTender failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete tender');
    }
  }

  /**
   * Get tender submissions
   */
  async getTenderSubmissions(request: GetTenderSubmissionsRequestDTO): Promise<TenderSubmissionDTO[]> {
    try {
      if (!request.tenderId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }

      // For now, return mock data as tender submission repository is not available
      // TODO: Implement proper tender submission retrieval when repository is available
      console.warn('TenderServiceLegacy.getTenderSubmissions: Tender submission repository not available');
      
      return [];
    } catch (error) {
      console.error('TenderServiceLegacy.getTenderSubmissions failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get tender submissions');
    }
  }

  /**
   * Get tenders by status
   */
  async getTendersByStatus(request: GetTendersByStatusRequestDTO): Promise<TenderDTO[]> {
    try {
      if (!request.status) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Status is required');
      }

      // For now, return mock data as repository methods are not available
      // TODO: Implement proper repository methods when available
      console.warn('TenderServiceLegacy.getTendersByStatus: Repository methods not available');
      
      return [];
    } catch (error) {
      console.error('TenderServiceLegacy.getTendersByStatus failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get tenders by status');
    }
  }

  /**
   * Search tenders
   */
  async searchTenders(request: SearchTendersRequestDTO): Promise<TenderDTO[]> {
    try {
      if (!request.searchTerm || request.searchTerm.trim().length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Search term is required');
      }

      // For now, return mock data as search functionality is not available in repository
      // TODO: Implement proper search when repository supports it
      console.warn('TenderServiceLegacy.searchTenders: Search functionality not available in repository');
      
      return [];
    } catch (error) {
      console.error('TenderServiceLegacy.searchTenders failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to search tenders');
    }
  }

  /**
   * Get published tenders available for submission
   */
  async getPublishedTendersForSubmission(request?: GetPublishedTendersForSubmissionRequestDTO): Promise<TenderDTO[]> {
    try {
      const now = new Date().toISOString();
      
      // For now, return mock data as date filtering is not available in repository
      // TODO: Implement proper date filtering when repository supports it
      console.warn('TenderServiceLegacy.getPublishedTendersForSubmission: Date filtering not available in repository');
      
      // For now, return mock data as repository methods are not available
      // TODO: Implement proper repository methods when available
      console.warn('TenderServiceLegacy.getPublishedTendersForSubmission: Repository methods not available');
      
      return [];
    } catch (error) {
      console.error('TenderServiceLegacy.getPublishedTendersForSubmission failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get published tenders for submission');
    }
  }

  /**
   * Get tenders by project
   */
  async getTendersByProject(request: GetTendersByProjectRequestDTO): Promise<TenderDTO[]> {
    try {
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // For now, return mock data as project filtering is not available in repository
      // TODO: Implement proper project filtering when repository supports it
      console.warn('TenderServiceLegacy.getTendersByProject: Project filtering not available in repository');
      
      return [];
    } catch (error) {
      console.error('TenderServiceLegacy.getTendersByProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get tenders by project');
    }
  }

  /**
   * Get tender statistics
   */
  async getTenderStats(request?: GetTenderStatsRequestDTO): Promise<{ total: number; byStatus: Record<string, number>; byMarketType: Record<string, number>; byFinancingSource: Record<string, number>; publishedThisMonth: number; closingThisMonth: number; }> {
    try {
      const tenders = await this.getAllTenders();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const byStatus: Record<string, number> = {};
      const byMarketType: Record<string, number> = {};
      const byFinancingSource: Record<string, number> = {};
      let publishedThisMonth = 0;
      let closingThisMonth = 0;

      tenders.forEach(tender => {
        // By status
        byStatus[tender.status] = (byStatus[tender.status] || 0) + 1;

        // By market type
        if (tender.market_type) {
          byMarketType[tender.market_type] = (byMarketType[tender.market_type] || 0) + 1;
        }

        // By financing source
        if (tender.financing_source) {
          byFinancingSource[tender.financing_source] = (byFinancingSource[tender.financing_source] || 0) + 1;
        }

        // Published this month
        if (tender.publication_date) {
          const pubDate = new Date(tender.publication_date);
          if (pubDate >= startOfMonth && pubDate <= endOfMonth) {
            publishedThisMonth++;
          }
        }

        // Closing this month
        if (tender.deadline_date) {
          const deadlineDate = new Date(tender.deadline_date);
          if (deadlineDate >= startOfMonth && deadlineDate <= endOfMonth) {
            closingThisMonth++;
          }
        }
      });

      return {
        total: tenders.length,
        byStatus,
        byMarketType,
        byFinancingSource,
        publishedThisMonth,
        closingThisMonth
      };
    } catch (error) {
      console.error('TenderServiceLegacy.getTenderStats failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get tender stats');
    }
  }

  /**
   * Validate tender data
   */
  validateTenderData(data: TenderCreateDTO | Partial<TenderCreateDTO>): TenderValidationResultDTO {
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
