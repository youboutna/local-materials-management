/**
 * TenderEstimateService - Hexagonal Architecture
 * Implements business logic for tender estimate management
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { ITenderEstimateRepository } from '@/domain/repositories/ITenderEstimateRepository';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
import { TenderEstimateTransformer } from '@/dtos/transforms/TenderEstimateTransformer';
import { TenderEstimateValidation } from '@/dtos/utils/TenderEstimateValidation';
import { TenderEstimateItemTransformer } from '@/dtos/transforms/TenderEstimateItemTransformer';
import { TenderEstimate, TenderEstimateStatus, CurrencyCode } from '@/domain/entities/TenderEstimate';
import { TenderEstimateItem } from '@/domain/entities/TenderEstimateItem';
import { TenderEstimate as TenderEstimateEntity, TenderEstimateItem as TenderEstimateItemEntity } from '@/domain/repositories/ITenderEstimateRepository';
import {
  TenderEstimateDTO,
  TenderEstimateItemDTO,
  CreateTenderEstimateRequestDto,
  CreateTenderEstimateItemRequestDto,
  UpdateTenderEstimateRequestDto,
  UpdateTenderEstimateItemRequestDto,
  GetTenderEstimatesRequestDto,
  GetTenderEstimateByIdRequestDto,
  GetTenderEstimateItemsRequestDto,
  GetMyEstimatesRequestDto,
  GetEstimatesByProjectIdRequestDto,
  GetEstimateStatsRequestDto,
  CalculateEstimateTotalsRequestDto,
  TenderEstimateStatsDto,
  EstimateStatsDto,
  EstimateTotalsDto,
  TenderEstimateValidationDto,
  TenderEstimateComparisonDto
} from '@/dtos/entities/TenderEstimateDTO';

export class TenderEstimateService {
  private tenderEstimateRepository: ITenderEstimateRepository;

  constructor() {
    this.tenderEstimateRepository = RepositoryFactory.getTenderEstimateRepository();
  }

  /**
   * Transform entity to DTO
   */
  private transformEntityToDTO(entity: TenderEstimate): TenderEstimateDTO {
    return TenderEstimateTransformer.toTenderEstimateDTO(entity);
  }

  /**
   * Create a new tender estimate
   * Repository + Validation + Transformer + Business Logic
   */
  async createTenderEstimate(request: CreateTenderEstimateRequestDto): Promise<TenderEstimateDTO> {
    try {
      // 1. Validation Layer
      TenderEstimateValidation.validateCreateTenderEstimateRequest(request);
      TenderEstimateValidation.validateTenderId(request.tender_id);
      TenderEstimateValidation.validateCurrencyCode(request.currency);

      // 2. Business Logic - Check for duplicates
      const existingEstimates = await this.tenderEstimateRepository.findByTenderId(request.tender_id);
      if (existingEstimates.length > 0) {
        const hasDuplicate = existingEstimates.some(estimate => 
          estimate.submittedBy === request.submitted_by && 
          estimate.status !== 'rejected'
        );
        if (hasDuplicate) {
          throw new AppError(ErrorCode.VALIDATION_ERROR, 'An estimate from this submitter already exists for this tender');
        }
      }

      // 3. Business Logic - Calculate business rules
      // TODO: Implement business rules calculation when needed

      // 4. Repository Layer - Create entity
      const estimateData = {
        tenderId: request.tender_id,
        status: 'draft' as TenderEstimateStatus,
        currency: request.currency as CurrencyCode,
        estimateType: 'standard',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        options: {
          projectId: '',
          submittedBy: request.submitted_by,
          subtotal: 0,
          taxAmount: 0,
          taxRate: 0,
          totalWithTax: request.total_amount,
          finalTotal: request.total_amount,
          totalMaterialsCost: 0,
          totalLaborCost: 0,
          totalEquipmentCost: 0,
          overheadPercentage: 0,
          overheadAmount: 0,
          profitMarginPercentage: 0,
          profitMarginAmount: 0,
          items: []
        }
      } as any;

      const createdEstimate = await this.tenderEstimateRepository.create(estimateData);

      // 5. Create items if provided
      if (request.items && request.items.length > 0) {
        for (const itemRequest of request.items) {
          await this.createTenderEstimateItem({
            estimate_id: createdEstimate.id,
            item_code: itemRequest.item_code,
            description: itemRequest.description,
            unit: itemRequest.unit,
            quantity: itemRequest.quantity,
            unit_price: itemRequest.unit_price,
            total_price: itemRequest.total_price,
            category: itemRequest.category,
            specifications: itemRequest.specifications,
            item_type: itemRequest.item_type
          });
        }
      }

      // 6. Transformer Layer - Convert to DTO
      return this.transformEntityToDTO(createdEstimate);
    } catch (error) {
      console.error('TenderEstimateService.createTenderEstimate failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create tender estimate');
    }
  }

  /**
   * Get tender estimates by tender ID
   * Repository + Transformer
   */
  async getTenderEstimatesByTender(tenderId: string): Promise<TenderEstimateDTO[]> {
    try {
      // Validation Layer
      TenderEstimateValidation.validateTenderId(tenderId);

      // Repository Layer
      const estimates = await this.tenderEstimateRepository.findByTenderId(tenderId);

      // Transformer Layer
      return estimates.map(estimate => this.transformEntityToDTO(estimate));
    } catch (error) {
      console.error('TenderEstimateService.getTenderEstimatesByTender failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get tender estimates');
    }
  }

  /**
   * Get estimate by ID
   */
  async getEstimateById(request: GetTenderEstimateByIdRequestDto): Promise<TenderEstimateDTO | null> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate ID is required');
      }

      // Get estimate using repository
      const estimate = await this.tenderEstimateRepository.findById(request.id);

      if (!estimate) {
        return null;
      }

      // Transform entity to DTO
      return this.transformEntityToDTO(estimate);
    } catch (error) {
      console.error('TenderEstimateService.getEstimateById failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get estimate by ID');
    }
  }

  /**
   * Update tender estimate status
   * Validation + Repository + Transformer + Business Logic
   */
  async updateTenderEstimateStatus(estimateId: string, newStatus: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected'): Promise<TenderEstimateDTO> {
    try {
      // 1. Validation Layer
      TenderEstimateValidation.validateEstimateId(estimateId);
      TenderEstimateValidation.validateUpdateTenderEstimateRequest({ status: newStatus });

      // 2. Repository Layer - Get current estimate
      const currentEstimate = await this.tenderEstimateRepository.findById(estimateId);
      if (!currentEstimate) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Tender estimate not found');
      }

      // 3. Business Logic - Validate status transition
      TenderEstimateValidation.validateStatusTransition(currentEstimate.status, newStatus);

      // 4. Repository Layer - Update
      const updatedEstimate = await this.tenderEstimateRepository.update(estimateId, { status: newStatus });

      // 5. Transformer Layer
      return this.transformEntityToDTO(updatedEstimate);
    } catch (error) {
      console.error('TenderEstimateService.updateTenderEstimateStatus failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update tender estimate status');
    }
  }

  /**
   * Create tender estimate item
   */
  async createTenderEstimateItem(request: CreateTenderEstimateItemRequestDto): Promise<TenderEstimateItemDTO> {
    try {
      if (!request.estimate_id || request.quantity <= 0 || request.unit_price <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate ID, quantity, and unit price are required');
      }

      // For now, simulate creation as tender estimate repository is not available
      // TODO: Implement proper tender estimate item creation when repository is available
      console.warn('TenderEstimateService.createTenderEstimateItem: Tender estimate repository not available');

      const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      const newItem: TenderEstimateItemDTO = {
        id,
        estimate_id: request.estimate_id,
        material_id: request.material_id || undefined as string | undefined,
        item_code: request.item_code,
        description: request.description,
        unit: request.unit,
        quantity: request.quantity,
        unit_price: request.unit_price,
        total_price: request.total_price,
        category: request.category,
        specifications: request.specifications,
        item_type: request.item_type,
        created_at: now,
        updated_at: now
      };

      return newItem;
    } catch (error) {
      console.error('TenderEstimateService.createTenderEstimateItem failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create estimate item');
    }
  }

  /**
   * Get estimate items by estimate ID
   */
  async getEstimateItems(request: GetTenderEstimateItemsRequestDto): Promise<TenderEstimateItemDTO[]> {
    try {
      if (!request.estimate_id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate ID is required');
      }

      // For now, return mock data as tender estimate repository is not available
      // TODO: Implement proper tender estimate item retrieval when repository is available
      console.warn('TenderEstimateService.getEstimateItems: Tender estimate repository not available');

      return [];
    } catch (error) {
      console.error('TenderEstimateService.getEstimateItems failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get estimate items');
    }
  }

  /**
   * Update estimate item
   */
  async updateEstimateItem(request: { id: string; updates: Partial<TenderEstimateItem> }): Promise<TenderEstimateItemDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate item ID is required');
      }
      if (!request.updates || Object.keys(request.updates).length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Update data is required');
      }

      // For now, return mock data as tender estimate repository is not available
      // TODO: Implement proper tender estimate item update when repository is available
      console.warn('TenderEstimateService.updateEstimateItem: Tender estimate repository not available');

      const now = new Date().toISOString();
      const mockItem: TenderEstimateItemDTO = {
        id: request.id,
        estimate_id: 'mock-estimate-id',
        material_id: undefined,
        item_code: 'mock-item',
        description: 'Mock item',
        unit: 'unit',
        quantity: 1,
        unit_price: 0,
        total_price: 0,
        created_at: now,
        updated_at: now,
        ...request.updates
      };

      return mockItem;
    } catch (error) {
      console.error('TenderEstimateService.updateEstimateItem failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update estimate item');
    }
  }

  /**
   * Delete estimate item
   */
  async deleteEstimateItem(request: { id: string }): Promise<void> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate item ID is required');
      }

      // For now, simulate deletion as tender estimate repository is not available
      // TODO: Implement proper tender estimate item deletion when repository is available
      console.warn('TenderEstimateService.deleteEstimateItem: Tender estimate repository not available');
      console.log(`Deleting estimate item: ${request.id}`);
    } catch (error) {
      console.error('TenderEstimateService.deleteEstimateItem failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete estimate item');
    }
  }

  /**
   * Get user's own estimates
   */
  async getMyEstimates(request: GetMyEstimatesRequestDto): Promise<TenderEstimateDTO[]> {
    try {
      if (!request.submitted_by) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'User ID is required');
      }

      // For now, return mock data as tender estimate repository is not available
      // TODO: Implement proper user estimates retrieval when repository is available
      console.warn('TenderEstimateService.getMyEstimates: Tender estimate repository not available');
      
      return [];
    } catch (error) {
      console.error('TenderEstimateService.getMyEstimates failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get user estimates');
    }
  }

  /**
   * Get estimates by project ID
   */
  async getEstimatesByProjectId(request: GetEstimatesByProjectIdRequestDto): Promise<TenderEstimateDTO[]> {
    try {
      if (!request.project_id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // For now, return mock data as tender estimate repository is not available
      // TODO: Implement proper project estimates retrieval when repository is available
      console.warn('TenderEstimateService.getEstimatesByProjectId: Tender estimate repository not available');
      
      return [];
    } catch (error) {
      console.error('TenderEstimateService.getEstimatesByProjectId failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get estimates by project ID');
    }
  }

  /**
   * Get all estimates
   */
  async getAllEstimates(): Promise<TenderEstimateDTO[]> {
    try {
      // For now, return mock data as tender estimate repository is not available
      // TODO: Implement proper all estimates retrieval when repository is available
      console.warn('TenderEstimateService.getAllEstimates: Tender estimate repository not available');
      
      return [];
    } catch (error) {
      console.error('TenderEstimateService.getAllEstimates failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get all estimates');
    }
  }

  /**
   * Get estimate statistics
   */
  async getEstimateStats(request: GetEstimateStatsRequestDto): Promise<EstimateStatsDto> {
    try {
      if (!request.tender_id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }

      // For now, return mock data as tender estimate repository is not available
      // TODO: Implement proper estimate statistics when repository is available
      console.warn('TenderEstimateService.getEstimateStats: Tender estimate repository not available');
      
      return {
        total_estimates: 0,
        total_amount: 0,
        average_amount: 0,
        by_status: {}
      };
    } catch (error) {
      console.error('TenderEstimateService.getEstimateStats failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get estimate stats');
    }
  }

  /**
   * Calculate estimate totals
   */
  async calculateEstimateTotals(request: CalculateEstimateTotalsRequestDto): Promise<EstimateTotalsDto> {
    try {
      if (!request.estimate_id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate ID is required');
      }

      // For now, return mock data as tender estimate repository is not available
      // TODO: Implement proper estimate totals calculation when repository is available
      console.warn('TenderEstimateService.calculateEstimateTotals: Tender estimate repository not available');
      
      return {
        subtotal: 0,
        tax_amount: 0,
        total_with_tax: 0,
        final_total: 0
      };
    } catch (error) {
      console.error('TenderEstimateService.calculateEstimateTotals failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to calculate estimate totals');
    }
  }
}
