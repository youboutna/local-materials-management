/**

 * TenderEstimateService - Hexagonal Architecture

 * Implements business logic for tender estimate management

 */



import { AppError, ErrorCode } from '@/utils/errorHandling';

import { ITenderEstimateRepository } from '@/domain/repositories/ITenderEstimateRepository';

import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';

import { TenderEstimateTransformer } from '@/dtos/transforms/TenderEstimateTransformer';

import { TenderEstimateValidation } from '@/dtos/utils/TenderEstimateValidation';


import { CurrencyCode, TenderEstimate, TenderEstimateStatus } from '@/domain/entities/TenderEstimate';

import { TenderEstimateItem } from '@/domain/entities/TenderEstimateItem';

import { TenderEstimateItem as TenderEstimateItemEntity } from '@/domain/repositories/ITenderEstimateRepository';

import {
    CalculateEstimateTotalsRequestDto,
    CreateTenderEstimateItemRequestDto,
    CreateTenderEstimateRequestDto,
    EstimateStatsDto,

    EstimateTotalsDto,
    GetEstimatesByProjectIdRequestDto,

    GetEstimateStatsRequestDto,
    GetMyEstimatesRequestDto,
    GetTenderEstimateByIdRequestDto,

    GetTenderEstimateItemsRequestDto,
    TenderEstimateDTO,

    TenderEstimateItemDTO
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

      TenderEstimateValidation.validateTenderId(request.tenderId);

      TenderEstimateValidation.validateCurrencyCode(request.currency);



      // 2. Business Logic - Check for duplicates

      const existingEstimates = await this.tenderEstimateRepository.findByTenderId(request.tenderId);

      if (existingEstimates.length > 0) {

        const hasDuplicate = existingEstimates.some(estimate => 

          estimate.submittedBy === request.submittedBy && 

          estimate.status !== 'rejected'

        );

        if (hasDuplicate) {

          throw new AppError(ErrorCode.VALIDATION_ERROR, 'An estimate from this submitter already exists for this tender');

        }

      }



      // 3. Business Logic - Totals are computed once items are persisted (step 5).


      // 4. Repository Layer - Create entity

      const estimateData = {

        tenderId: request.tenderId,

        status: 'draft' as TenderEstimateStatus,

        currency: request.currency as CurrencyCode,

        estimateType: 'standard',

        createdAt: new Date().toISOString(),

        updatedAt: new Date().toISOString(),

        options: {

          projectId: '',

          submittedBy: request.submittedBy,

          subtotal: 0,

          taxAmount: 0,

          taxRate: 0,

          totalWithTax: request.totalAmount,

          finalTotal: request.totalAmount,

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

            estimateId: createdEstimate.id,

            itemCode: itemRequest.itemCode,

            description: itemRequest.description,

            unit: itemRequest.unit,

            quantity: itemRequest.quantity,

            unitPrice: itemRequest.unitPrice,

            totalPrice: itemRequest.totalPrice,

            category: itemRequest.category,

            specifications: itemRequest.specifications,

            itemType: itemRequest.itemType

          });

        }

      }



      // 6. Business Logic - Recompute real totals from persisted items

      if (request.items && request.items.length > 0) {

        const totals = await this.calculateEstimateTotals({ estimateId: createdEstimate.id });

        const updatedEstimate = await this.tenderEstimateRepository.update(createdEstimate.id, {

          subtotal: totals.subtotal,

          taxAmount: totals.taxAmount,

          totalWithTax: totals.totalWithTax,

          finalTotal: totals.finalTotal

        } as Partial<TenderEstimate>);

        return this.transformEntityToDTO(updatedEstimate);

      }



      // 7. Transformer Layer - Convert to DTO

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
      if (!request.estimateId || request.quantity <= 0 || request.unitPrice <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate ID, quantity, and unit price are required');
      }
      const totalPrice = request.totalPrice ?? request.quantity * request.unitPrice;
      const created = await this.tenderEstimateRepository.createItem({
        estimateId: request.estimateId,
        itemCode: request.itemCode,
        description: request.description,
        unit: request.unit,
        quantity: request.quantity,
        unitPrice: request.unitPrice,
        totalPrice,
        category: request.category,
        specifications: request.specifications,
        materialId: request.materialId,
        itemType: request.itemType,
        // Resource anchoring (v10)
        resourceKind: request.resourceKind,
        employeeQualificationId: request.employeeQualificationId,
        supplierId: request.supplierId,
        supplierContractRef: request.supplierContractRef,
        estimatedHours: request.estimatedHours,
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
      if (!request.estimateId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate ID is required');
      }
      const items = await this.tenderEstimateRepository.findItemsByEstimateId(request.estimateId);
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
      if (!request.submittedBy) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'User ID is required');
      }
      const estimates = await this.tenderEstimateRepository.findBySubmittedBy(request.submittedBy);
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
      if (!request.projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }
      const estimates = await this.tenderEstimateRepository.findByProjectId(request.projectId);
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
      if (!request.tenderId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Tender ID is required');
      }
      const stats = await this.tenderEstimateRepository.getEstimateStats(request.tenderId);
      return {
        totalEstimates: stats.totalEstimates,
        totalAmount: stats.totalAmount,
        averageAmount: stats.averageAmount,
        byStatus: stats.byStatus,
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
      if (!request.estimateId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Estimate ID is required');
      }
      const estimate = await this.tenderEstimateRepository.findById(request.estimateId);
      const items = await this.tenderEstimateRepository.findItemsByEstimateId(request.estimateId);
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
   * Find the most recent draft estimate for a tender, or create one with
   * default financial parameters. Used by the DQE auto-import flow.
   */
  async findOrCreateDraftEstimateForTender(tenderId: string, projectId?: string | null): Promise<TenderEstimateDTO> {
    try {
      TenderEstimateValidation.validateTenderId(tenderId);

      const existingEstimates = await this.tenderEstimateRepository.findByTenderId(tenderId);
      if (existingEstimates.length > 0) {
        return this.transformEntityToDTO(existingEstimates[0]);
      }

      const estimateData = {
        tenderId,
        status: 'draft' as TenderEstimateStatus,
        currency: 'MRU' as CurrencyCode,
        estimateType: 'Métré quantitatif',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        options: {
          projectId: projectId || undefined,
          subtotal: 0,
          taxAmount: 0,
          taxRate: 14,
          totalWithTax: 0,
          finalTotal: 0,
          totalMaterialsCost: 0,
          totalLaborCost: 0,
          totalEquipmentCost: 0,
          overheadPercentage: 15,
          overheadAmount: 0,
          profitMarginPercentage: 10,
          profitMarginAmount: 0,
          items: []
        }
      } as any;

      const createdEstimate = await this.tenderEstimateRepository.create(estimateData);
      return this.transformEntityToDTO(createdEstimate);
    } catch (error) {
      console.error('TenderEstimateService.findOrCreateDraftEstimateForTender failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to find or create draft estimate');
    }
  }

  /**
   * Bulk-insert estimate items without the strict positive-price validation
   * applied by createTenderEstimateItem (used when importing raw DQE lines
   * that may legitimately carry a zero unit price pending manual pricing).
   */
  async addRawEstimateItems(items: Array<{
    estimate_id: string;
    material_id?: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
    description: string;
    item_type?: string;
  }>): Promise<TenderEstimateItemDTO[]> {
    try {
      const created: TenderEstimateItemDTO[] = [];
      for (const item of items) {
        const savedItem = await this.tenderEstimateRepository.createItem({
          estimateId: item.estimate_id,
          materialId: item.material_id ?? undefined,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          description: item.description,
          itemType: item.item_type,
        } as unknown as Parameters<typeof this.tenderEstimateRepository.createItem>[0]);
        created.push(this.mapItemEntityToDTO(savedItem));
      }
      return created;
    } catch (error) {
      console.error('TenderEstimateService.addRawEstimateItems failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add raw estimate items');
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
      resource_kind?: 'internal_qualification' | 'external_provider' | 'material';
      employee_qualification_id?: string;
      supplier_id?: string;
      supplier_contract_ref?: string;
      estimated_hours?: number;
    };
    const now = new Date().toISOString();
    return {
      id: e.id,
      estimateId: e.estimateId,
      materialId: e.materialId,
      itemCode: e.itemCode ?? '',
      description: e.description ?? '',
      unit: e.unit ?? 'unit',
      quantity: Number(e.quantity) || 0,
      unitPrice: Number(e.unitPrice) || 0,
      totalPrice: Number(e.totalPrice) || 0,
      category: e.category,
      specifications: e.specifications,
      itemType: e.itemType,
      lineTotal: Number(e.totalPrice) || 0,
      resourceKind: e.resource_kind,
      employeeQualificationId: e.employee_qualification_id,
      supplierId: e.supplier_id,
      supplierContractRef: e.supplier_contract_ref,
      estimatedHours: e.estimated_hours,
      createdAt: e.createdAt ?? now,
      updatedAt: e.updatedAt ?? now,
    };
  }
}

