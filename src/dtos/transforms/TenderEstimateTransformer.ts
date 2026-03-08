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
      tender_id: entity.tenderId,
      submitted_by: entity.submittedBy || '',
      submission_date: entity.submissionDate,
      status: entity.status,
      total_amount: entity.totalAmount,
      currency: entity.currency,
      validity_period: entity.validityPeriod,
      notes: entity.notes,
      estimate_type: entity.estimateType,
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
      margin_rules: undefined,
      risk_assessment: entity.riskAssessment || undefined,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  /**
   * Transform DTO to Domain Entity
   */
  static toTenderEstimateEntity(dto: TenderEstimateDTO): TenderEstimate {
    return new TenderEstimate(
      dto.id,
      dto.tender_id,
      dto.status,
      dto.currency as CurrencyCode,
      dto.estimate_type || 'standard',
      dto.created_at,
      dto.updated_at,
      {
        submittedBy: dto.submitted_by,
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
      estimate_id: entity.estimateId,
      item_code: entity.itemCode,
      description: entity.description,
      unit: entity.unit,
      quantity: entity.quantity,
      unit_price: entity.unitPrice,
      total_price: entity.totalPrice,
      category: entity.category,
      specifications: entity.specifications,
      item_type: entity.itemType || 'material',
      materialId: entity.materialId,
      itemType: entity.itemType || 'material',
      margin_percentage: 0,
      line_total: entity.totalPrice,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Transform DTO to Domain Entity
   */
  static toTenderEstimateItemEntity(dto: TenderEstimateItemDTO): TenderEstimateItem {
    return new TenderEstimateItem(
      dto.id,
      dto.estimate_id,
      dto.item_code,
      dto.description,
      dto.unit,
      dto.quantity,
      dto.unit_price,
      dto.total_price,
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
      total_estimates: stats.totalEstimates,
      total_amount: stats.totalAmount,
      average_amount: stats.averageAmount,
      estimates_by_status: stats.byStatus,
      estimates_by_currency: stats.byCurrency,
      total_value: stats.totalValue,
      recent_estimates: stats.recentEstimates,
      estimates_by_submitter: {},
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
      is_valid: validation.isValid,
      errors: validation.errors.map(error => error.message),
      warnings: validation.warnings.map(warning => warning.message)
    };
  }

  /**
   * Transform comparison data to DTO
   */
  static toTenderEstimateComparisonDto(comparison: {
    estimate_1: TenderEstimateDTO;
    estimate_2: TenderEstimateDTO;
    price_difference: number;
    price_difference_percentage: number;
    item_differences: Array<{
      field: string;
      message: string;
      severity: "error" | "warning";
      recommendation?: string;
    }>;
  }): TenderEstimateComparisonDto {
    return {
      original_estimate: comparison.estimate_1,
      revised_estimate: comparison.estimate_2,
      differences: {
        amount_change: comparison.price_difference,
        percentage_change: comparison.price_difference_percentage,
        changed_fields: comparison.item_differences.map(d => d.field),
      },
      price_difference: comparison.price_difference,
      price_difference_percentage: comparison.price_difference_percentage
    };
  }

  /**
   * Calculate total amount from items
   */
  static calculateTotalAmount(items: TenderEstimateItemDTO[]): number {
    return items.reduce((total, item) => total + item.total_price, 0);
  }

  /**
   * Validate item calculations
   */
  static validateItemCalculations(item: TenderEstimateItemDTO): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const calculatedTotal = item.quantity * item.unit_price;

    if (Math.abs(calculatedTotal - item.total_price) > 0.01) {
      errors.push(`Item ${item.item_code}: Total price mismatch. Expected: ${calculatedTotal}, Got: ${item.total_price}`);
    }

    if (item.quantity <= 0) {
      errors.push(`Item ${item.item_code}: Quantity must be positive`);
    }

    if (item.unit_price <= 0) {
      errors.push(`Item ${item.item_code}: Unit price must be positive`);
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
