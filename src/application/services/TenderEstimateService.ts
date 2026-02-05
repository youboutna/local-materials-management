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
import { TenderEstimate, TenderEstimateStatus, CurrencyCode, ITenderEstimateItem } from '@/domain/entities/TenderEstimate';
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
import { TenderEstimateBusinessLogic } from '@/dtos/transforms/shared';

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
   * Calculate margin rules based on amount and currency
   */
  private calculateMarginRules(amount: number, currency: CurrencyCode): {
    overheadPercentage: number;
    profitMarginPercentage: number;
    riskMultiplier: number;
  } {
    // Base margins by amount ranges
    let overheadPercentage = 10; // Default 10%
    let profitMarginPercentage = 15; // Default 15%
    let riskMultiplier = 1.0;

    if (amount > 1000000) {
      // Large projects: lower margins, higher risk
      overheadPercentage = 8;
      profitMarginPercentage = 12;
      riskMultiplier = 1.2;
    } else if (amount > 500000) {
      // Medium projects: standard margins
      overheadPercentage = 10;
      profitMarginPercentage = 15;
      riskMultiplier = 1.1;
    } else if (amount < 100000) {
      // Small projects: higher margins, lower risk
      overheadPercentage = 15;
      profitMarginPercentage = 20;
      riskMultiplier = 0.9;
    }

    // Currency adjustments
    if (currency === 'USD' || currency === 'EUR') {
      profitMarginPercentage += 2; // International projects get extra margin
    }

    return {
      overheadPercentage,
      profitMarginPercentage,
      riskMultiplier
    };
  }

  /**
   * Assess estimate risk based on amount and type
   */
  private assessEstimateRisk(amount: number, estimateType: string): TenderEstimateBusinessLogic['risk_assessment'] {
    const factors: string[] = [];
    let score = 0;

    // Amount-based risk assessment
    if (amount > 2000000) {
      score += 50;
      factors.push('Very high value amount');
    } else if (amount > 1000000) {
      score += 35;
      factors.push('High value amount');
    } else if (amount > 500000) {
      score += 20;
      factors.push('Medium-high value amount');
    } else if (amount < 50000) {
      score += 10;
      factors.push('Low value amount (may indicate missing items)');
    }

    // Estimate type risk
    if (estimateType === 'expedited') {
      score += 25;
      factors.push('Expedited timeline');
    } else if (estimateType === 'complex') {
      score += 20;
      factors.push('Complex project type');
    }

    // Determine risk level
    let level: 'low' | 'medium' | 'high' | 'critical';
    if (score >= 80) level = 'critical';
    else if (score >= 60) level = 'high';
    else if (score >= 30) level = 'medium';
    else level = 'low';

    return { level, factors, score };
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
      // Apply margin calculations based on estimate type and total amount
      const marginRules = this.calculateMarginRules(request.total_amount, request.currency as CurrencyCode);
      
      // Apply risk assessment based on amount and validity period
      const riskAssessment = this.assessEstimateRisk(request.total_amount, 'standard');

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

      const createdItem = await this.tenderEstimateRepository.createItem({
        estimateId: request.estimate_id,
        itemCode: request.item_code,
        description: request.description,
        unit: request.unit,
        quantity: request.quantity,
        unitPrice: request.unit_price,
        totalPrice: request.total_price || request.quantity * request.unit_price,
        category: request.category,
        specifications: request.specifications
      } as Omit<TenderEstimateItemEntity, 'id' | 'createdAt' | 'updatedAt'>);

      return {
        id: createdItem.id,
        estimate_id: createdItem.estimateId,
        material_id: undefined, // Not available in TenderEstimateItem entity
        item_code: createdItem.itemCode,
        description: createdItem.description,
        unit: createdItem.unit,
        quantity: createdItem.quantity,
        unit_price: createdItem.unitPrice,
        total_price: createdItem.totalPrice,
        category: createdItem.category,
        specifications: createdItem.specifications,
        item_type: 'material', // Default item type
        materialId: createdItem.materialId,
        itemType: createdItem.itemType || 'material',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
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
      return items.map(item => ({
        id: item.id,
        estimate_id: item.estimateId,
        material_id: undefined, // Not available in TenderEstimateItem entity
        item_code: item.itemCode,
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        category: item.category,
        specifications: item.specifications,
        item_type: 'material', // Default item type
        materialId: item.materialId,
        itemType: item.itemType || 'material',
        created_at: new Date().toISOString(), // ✅ Current timestamp - entity doesn't have createdAt
        updated_at: new Date().toISOString()  // ✅ Current timestamp - entity doesn't have updatedAt
      }));
    } catch (error) {
      console.error('TenderEstimateService.getEstimateItems failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get estimate items');
    }
  }

  /**
   * Update estimate item
   */
  async updateEstimateItem(request: { id: string; updates: Partial<ITenderEstimateItem> }): Promise<TenderEstimateItemDTO> {
    try {
      if (!request.id) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate item ID is required');
      }
      if (!request.updates || Object.keys(request.updates).length === 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Update data is required');
      }

      const updatedItem = await this.tenderEstimateRepository.updateItem(request.id, request.updates);
      
      // Transform entity to DTO manually using getter methods
      return {
        id: updatedItem.id,
        estimate_id: updatedItem.estimateId,
        material_id: undefined, // Not available in TenderEstimateItem entity
        item_code: updatedItem.itemCode,
        description: updatedItem.description,
        unit: updatedItem.unit,
        quantity: updatedItem.quantity,
        unit_price: updatedItem.unitPrice,
        total_price: updatedItem.totalPrice,
        category: updatedItem.category,
        specifications: updatedItem.specifications,
        item_type: 'material', // Default item type
        materialId: updatedItem.materialId,
        itemType: updatedItem.itemType || 'material',
        created_at: new Date().toISOString(), // ✅ Current timestamp - entity doesn't have createdAt
        updated_at: new Date().toISOString()  // ✅ Current timestamp - entity doesn't have updatedAt
      };
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

      // Repository Layer - Get estimates by submitted user
      const estimates = await this.tenderEstimateRepository.findBySubmittedBy(request.submitted_by);
      
      // Transformer Layer
      return estimates.map(estimate => this.transformEntityToDTO(estimate));
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

      // Repository Layer - Get estimates by project ID
      const estimates = await this.tenderEstimateRepository.findByProjectId(request.project_id);
      
      // Transformer Layer
      return estimates.map(estimate => this.transformEntityToDTO(estimate));
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
      // Repository Layer - Get all estimates
      const estimates = await this.tenderEstimateRepository.findAll();
      
      // Transformer Layer
      return estimates.map(estimate => this.transformEntityToDTO(estimate));
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

      // Repository Layer - Get estimate statistics
      const stats = await this.tenderEstimateRepository.getEstimateStats(request.tender_id);
      
      // Transform to DTO format
      return {
        total_estimates: stats.totalEstimates,
        total_amount: stats.totalAmount,
        average_amount: stats.averageAmount,
        by_status: stats.byStatus
      };
    } catch (error) {
      console.error('TenderEstimateService.getEstimateStats failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get estimate stats');
    }
  }

  /**
   * Calculate estimate totals
   */
  async calculateEstimateTotals(estimateId: string): Promise<EstimateTotalsDto> {
    try {
      const estimate = await this.tenderEstimateRepository.findById(estimateId);
      if (!estimate) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Tender estimate not found');
      }

      // Calculate subtotal from all items
      const subtotal = estimate.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice),
        0
      );

      // Apply discount if any (using tax_rate from DTO/UI)
      const discountRate = estimate.discountRate || 0;
      const discountAmount = discountRate > 0 ? subtotal * (discountRate / 100) : 0;
      
      // Calculate tax if applicable (using tax_rate from DTO/UI)
      const taxRate = estimate.taxRate || 0;
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxRate > 0 ? taxableAmount * (taxRate / 100) : 0;
      
      // Calculate grand total
      const total = subtotal - discountAmount + taxAmount;
      const totalWithTax = total;
      const finalTotal = total;

      return {
        subtotal,
        discountAmount,    // ✅ Changed from discount_amount
        taxAmount,         // ✅ Changed from tax_amount
        totalWithTax,      // ✅ Changed from total_with_tax
        finalTotal,        // ✅ Changed from final_total
      };
    } catch (error) {
      console.error('TenderEstimateService.calculateEstimateTotals failed:', error);
      throw error instanceof AppError 
        ? error 
        : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to calculate estimate totals');
    }
  }
}
