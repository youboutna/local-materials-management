/**
 * Tender Estimate Transformer - Hexagonal Architecture
 * Converts between Domain Entities and DTOs
 */

import { TenderEstimate, TenderEstimateItem, CurrencyCode } from '@/domain/entities/TenderEstimate';
import { 
  TenderEstimateDTO,
  TenderEstimateItemDTO,
  TenderEstimateStatsDto,
  TenderEstimateValidationDto,
  TenderEstimateComparisonDto,
} from '@/dtos/entities/TenderEstimateDTO';

export class TenderEstimateTransformer {
  /**
   * Transform Domain Entity to DTO
   */
  static toTenderEstimateDTO(entity: TenderEstimate): TenderEstimateDTO {
    return {
      id: entity.id,
      tenderId: entity.tenderId,
      submittedBy: entity.submittedBy || '',
      submissionDate: entity.submissionDate,
      status: entity.status,
      totalAmount: entity.totalAmount,
      currency: entity.currency,
      validityPeriod: entity.validityPeriod,
      notes: entity.notes,
      estimateType: entity.estimateType,
      // Financial fields
      subtotal: entity.subtotal,
      taxRate: entity.taxRate,
      taxAmount: entity.taxAmount,
      totalWithTax: entity.totalWithTax,
      discountRate: entity.discountRate,
      discountAmount: entity.discountAmount,
      overheadPercentage: entity.overheadPercentage,
      overheadAmount: entity.overheadAmount,
      profitMarginPercentage: entity.profitMarginPercentage,
      profitMarginAmount: entity.profitMarginAmount,
      finalTotal: entity.finalTotal,
      // Cost breakdown fields
      totalMaterialsCost: entity.totalMaterialsCost,
      totalLaborCost: entity.totalLaborCost,
      totalEquipmentCost: entity.totalEquipmentCost,
      // Business logic calculated fields
      marginRules: undefined,
      riskAssessment: entity.riskAssessment || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform DTO to Domain Entity
   */
  static toTenderEstimateEntity(dto: TenderEstimateDTO): TenderEstimate {
    return new TenderEstimate(
      dto.id,
      dto.tenderId,
      dto.status,
      dto.currency as CurrencyCode,
      dto.estimateType || 'standard',
      dto.createdAt,
      dto.updatedAt,
      {
        submittedBy: dto.submittedBy,
        subtotal: dto.subtotal ?? undefined,
        taxRate: dto.taxRate ?? undefined,
        taxAmount: dto.taxAmount ?? undefined,
        totalWithTax: dto.totalWithTax ?? undefined,
        finalTotal: dto.finalTotal ?? undefined,
        discountRate: dto.discountRate ?? undefined,
        discountAmount: dto.discountAmount ?? undefined,
        totalMaterialsCost: dto.totalMaterialsCost ?? undefined,
        totalLaborCost: dto.totalLaborCost ?? undefined,
        totalEquipmentCost: dto.totalEquipmentCost ?? undefined,
        overheadPercentage: dto.overheadPercentage ?? undefined,
        overheadAmount: dto.overheadAmount ?? undefined,
        profitMarginPercentage: dto.profitMarginPercentage ?? undefined,
        profitMarginAmount: dto.profitMarginAmount ?? undefined,
      }
    );
  }

  /**
   * Transform Domain Entity to DTO
   */
  static toTenderEstimateItemDTO(entity: TenderEstimateItem): TenderEstimateItemDTO {
    return {
      id: entity.id,
      estimateId: entity.estimateId,
      itemCode: entity.itemCode,
      description: entity.description,
      unit: entity.unit,
      quantity: entity.quantity,
      unitPrice: entity.unitPrice,
      totalPrice: entity.totalPrice,
      category: entity.category,
      specifications: entity.specifications,
      itemType: entity.itemType || 'material',
      materialId: entity.materialId,
      marginPercentage: 0,
      lineTotal: entity.totalPrice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform DTO to Domain Entity
   */
  static toTenderEstimateItemEntity(dto: TenderEstimateItemDTO): TenderEstimateItem {
    return new TenderEstimateItem(
      dto.id,
      dto.estimateId,
      dto.itemCode,
      dto.description,
      dto.unit,
      dto.quantity,
      dto.unitPrice,
      dto.totalPrice,
      dto.category,
      dto.specifications,
      dto.materialId,
      dto.itemType
    );
  }

  /**
   * Transform Domain Entities array to DTOs array
   */
  static toTenderEstimateDTOs(entities: TenderEstimate[]): TenderEstimateDTO[] {
    return entities.map(entity => this.toTenderEstimateDTO(entity));
  }

  /**
   * Transform DTOs array to Domain Entities array
   */
  static toTenderEstimateEntities(dtos: TenderEstimateDTO[]): TenderEstimate[] {
    return dtos.map(dto => this.toTenderEstimateEntity(dto));
  }

  /**
   * Transform Domain Entities array to DTOs array
   */
  static toTenderEstimateItemDTOs(entities: TenderEstimateItem[]): TenderEstimateItemDTO[] {
    return entities.map(entity => this.toTenderEstimateItemDTO(entity));
  }

  /**
   * Transform DTOs array to Domain Entities array
   */
  static toTenderEstimateItemEntities(dtos: TenderEstimateItemDTO[]): TenderEstimateItem[] {
    return dtos.map(dto => this.toTenderEstimateItemEntity(dto));
  }

  /**
   * Transform stats data to DTO
   */
  static toTenderEstimateStatsDto(stats: {
    totalEstimates: number,
    totalAmount: number,
    averageAmount: number,
    byStatus: Record<string, number>,
    byCurrency: Record<string, number>,
    totalValue: number,
    recentEstimates: TenderEstimateDTO[]
  }): TenderEstimateStatsDto {
    return {
      totalEstimates: stats.totalEstimates,
      totalAmount: stats.totalAmount,
      averageAmount: stats.averageAmount,
      estimatesByStatus: stats.byStatus,
      estimatesByCurrency: stats.byCurrency,
      totalValue: stats.totalValue,
      recentEstimates: stats.recentEstimates,
      estimatesBySubmitter: {},
    };
  }

  /**
   * Transform validation result to DTO
   */
  static toTenderEstimateValidationDto(validation: {
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
    warnings: Array<{ field: string; message: string; recommendation?: string }>;
  }): TenderEstimateValidationDto {
    return {
      isValid: validation.isValid,
      errors: validation.errors.map(error => error.message),
      warnings: validation.warnings.map(warning => warning.message)
    };
  }

  /**
   * Transform comparison data to DTO
   */
  static toTenderEstimateComparisonDto(comparison: {
    estimate1: TenderEstimateDTO;
    estimate2: TenderEstimateDTO;
    priceDifference: number;
    priceDifferencePercentage: number;
    itemDifferences: Array<{
      field: string;
      message: string;
      severity: "error" | "warning";
      recommendation?: string;
    }>;
  }): TenderEstimateComparisonDto {
    return {
      estimate1: comparison.estimate1,
      estimate2: comparison.estimate2,
      priceDifference: comparison.priceDifference,
      priceDifferencePercentage: comparison.priceDifferencePercentage,
      itemDifferences: comparison.itemDifferences.map(d => ({
        itemCode: d.field,
        description: d.message,
        estimate1Price: 0,
        estimate2Price: 0,
        priceDifference: 0,
        priceDifferencePercentage: 0,
      })),
    } as TenderEstimateComparisonDto;
  }

  /**
   * Calculate total amount from items
   */
  static calculateTotalAmount(items: TenderEstimateItemDTO[]): number {
    return items.reduce((total, item) => total + item.totalPrice, 0);
  }

  /**
   * Validate item calculations
   */
  static validateItemCalculations(item: TenderEstimateItemDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const calculatedTotal = item.quantity * item.unitPrice;

    if (Math.abs(calculatedTotal - item.totalPrice) > 0.01) {
      errors.push(`Item ${item.itemCode}: Total price mismatch. Expected: ${calculatedTotal}, Got: ${item.totalPrice}`);
    }

    if (item.quantity <= 0) {
      errors.push(`Item ${item.itemCode}: Quantity must be positive`);
    }

    if (item.unitPrice <= 0) {
      errors.push(`Item ${item.itemCode}: Unit price must be positive`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static formatCurrency(amount: number, currency: string = 'MRU'): string {
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-MR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  static calculateExpiryDate(submissionDate: string, validityPeriod: number): string {
    const date = new Date(submissionDate);
    date.setDate(date.getDate() + validityPeriod);
    return date.toISOString();
  }

  static isExpired(submissionDate: string, validityPeriod: number): boolean {
    const expiryDate = this.calculateExpiryDate(submissionDate, validityPeriod);
    return new Date() > new Date(expiryDate);
  }
}
