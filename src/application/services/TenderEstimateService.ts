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
      const totalPrice = request.total_price ?? request.quantity * request.unit_price;
      const created = await this.tenderEstimateRepository.createItem({
        estimateId: request.estimate_id,
        itemCode: request.item_code,
        description: request.description,
        unit: request.unit,
        quantity: request.quantity,
        unitPrice: request.unit_price,
        totalPrice,
        category: request.category,
        specifications: request.specifications,
        materialId: request.material_id,
        itemType: request.item_type,
      } as unknown as Parameters<typeof this.tenderEstimateRepository.createItem>[0]);
      return this.mapItemEntityToDTO(created);
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
      const items = await this.tenderEstimateRepository.findItemsByEstimateId(request.estimate_id);
      return items.map(i => this.mapItemEntityToDTO(i));
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
      const updated = await this.tenderEstimateRepository.updateItem(request.id, request.updates as Partial<TenderEstimateItemEntity>);
      return this.mapItemEntityToDTO(updated);
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
      await this.tenderEstimateRepository.deleteItem(request.id);
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
      const estimates = await this.tenderEstimateRepository.findBySubmittedBy(request.submitted_by);
      return estimates.map(e => this.transformEntityToDTO(e));
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
      const estimates = await this.tenderEstimateRepository.findByProjectId(request.project_id);
      return estimates.map(e => this.transformEntityToDTO(e));
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
      const estimates = await this.tenderEstimateRepository.findAll();
      return estimates.map(e => this.transformEntityToDTO(e));
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
      const stats = await this.tenderEstimateRepository.getEstimateStats(request.tender_id);
      return {
        total_estimates: stats.totalEstimates,
        total_amount: stats.totalAmount,
        average_amount: stats.averageAmount,
        by_status: stats.byStatus,
      };
    } catch (error) {
      console.error('TenderEstimateService.getEstimateStats failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get estimate stats');
    }
  }

  /**
   * Calculate estimate totals from persisted items
   */
  async calculateEstimateTotals(request: CalculateEstimateTotalsRequestDto): Promise<EstimateTotalsDto> {
    try {
      if (!request.estimate_id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate ID is required');
      }
      const estimate = await this.tenderEstimateRepository.findById(request.estimate_id);
      const items = await this.tenderEstimateRepository.findItemsByEstimateId(request.estimate_id);
      const subtotal = items.reduce((acc, it) => acc + (Number(it.totalPrice) || 0), 0);
      const discountRate = (estimate as unknown as { discountRate?: number })?.discountRate ?? 0;
      const discountAmount = subtotal * (discountRate / 100);
      const taxableBase = subtotal - discountAmount;
      const taxRate = (estimate as unknown as { taxRate?: number })?.taxRate ?? 0;
      const taxAmount = taxableBase * (taxRate / 100);
      const totalWithTax = taxableBase + taxAmount;
      return {
        subtotal,
        discountAmount,
        taxAmount,
        totalWithTax,
        finalTotal: totalWithTax,
      };
    } catch (error) {
      console.error('TenderEstimateService.calculateEstimateTotals failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to calculate estimate totals');
    }
  }

  /**
   * Map repository TenderEstimateItem entity (from TenderEstimate.ts) to DTO
   */
  private mapItemEntityToDTO(entity: unknown): TenderEstimateItemDTO {
    const e = entity as {
      id: string; estimateId: string; itemCode?: string; description?: string;
      unit?: string; quantity: number; unitPrice: number; totalPrice: number;
      category?: string; specifications?: string; materialId?: string; itemType?: string;
      createdAt?: string; updatedAt?: string;
    };
    const now = new Date().toISOString();
    return {
      id: e.id,
      estimate_id: e.estimateId,
      material_id: e.materialId,
      item_code: e.itemCode ?? '',
      description: e.description ?? '',
      unit: e.unit ?? 'unit',
      quantity: Number(e.quantity) || 0,
      unit_price: Number(e.unitPrice) || 0,
      total_price: Number(e.totalPrice) || 0,
      category: e.category,
      specifications: e.specifications,
      item_type: e.itemType,
      line_total: Number(e.totalPrice) || 0,
      created_at: e.createdAt ?? now,
      updated_at: e.updatedAt ?? now,
    };
  }
}

