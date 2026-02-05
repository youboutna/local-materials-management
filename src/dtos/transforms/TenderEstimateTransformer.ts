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
  TenderEstimateValidationErrorDto,
  TenderEstimateValidationWarningDto,
  TenderEstimateRiskDto,
  TenderEstimateMarginRulesDto,
  EstimateTotalsDto
} from '@/dtos/entities/TenderEstimateDTO';

export class TenderEstimateTransformer {
  /**
   * Transform Domain Entity to DTO
   */
  static toTenderEstimateDTO(entity: TenderEstimate): TenderEstimateDTO {
    return {
      id: entity.id,
      tender_id: entity.tenderId,
      submitted_by: entity.submittedBy,
      submission_date: entity.submissionDate,
      status: entity.status,
      total_amount: entity.totalAmount,
      currency: entity.currency,
      validity_period: entity.validityPeriod,
      notes: entity.notes,
      // Financial fields (Entity camelCase → DTO camelCase - PROMPTS.md Rule #3)
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
      margin_rules: entity.marginRules || undefined,
      risk_assessment: entity.riskAssessment || undefined,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  /**
   * Transform DTO to Domain Entity
   */
  static toTenderEstimateEntity(dto: TenderEstimateDTO): TenderEstimate {
    return {
      id: dto.id,
      tenderId: dto.tender_id,
      status: dto.status,
      currency: dto.currency as CurrencyCode,
      estimateType: dto.estimateType || 'standard',
      totalAmount: dto.total_amount,
      validityPeriod: dto.validity_period,
      notes: dto.notes,
      // Financial fields (DTO camelCase → Entity camelCase - PROMPTS.md Rule #3)
      subtotal: dto.subtotal,
      taxRate: dto.taxRate,
      taxAmount: dto.taxAmount,
      totalWithTax: dto.totalWithTax,
      discountRate: dto.discountRate,
      discountAmount: dto.discountAmount,
      overheadPercentage: dto.overheadPercentage,
      overheadAmount: dto.overheadAmount,
      profitMarginPercentage: dto.profitMarginPercentage,
      profitMarginAmount: dto.profitMarginAmount,
      finalTotal: dto.finalTotal,
      // Cost breakdown fields
      totalMaterialsCost: dto.totalMaterialsCost,
      totalLaborCost: dto.totalLaborCost,
      totalEquipmentCost: dto.totalEquipmentCost,
      // Business logic fields
      marginRules: dto.margin_rules,
      riskAssessment: dto.risk_assessment,
      submittedBy: dto.submitted_by,
      submissionDate: dto.submission_date,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at
    };
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
      // Business logic calculated fields
      margin_percentage: 0, // Default value since method doesn't exist
      line_total: entity.totalPrice,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Transform DTO to Domain Entity
   */
  static toTenderEstimateItemEntity(dto: TenderEstimateItemDTO): TenderEstimateItem {
    return {
      id: dto.id,
      estimateId: dto.estimate_id,
      itemCode: dto.item_code,
      description: dto.description,
      unit: dto.unit,
      quantity: dto.quantity,
      unitPrice: dto.unit_price,
      totalPrice: dto.total_price,
      category: dto.category,
      specifications: dto.specifications,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at
    };
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
    recentEstimates: TenderEstimate[]
  }): TenderEstimateStatsDto {
    return {
      total_estimates: stats.totalEstimates,
      total_amount: stats.totalAmount,
      average_amount: stats.averageAmount,
      estimates_by_status: stats.byStatus,
      estimates_by_currency: stats.byCurrency,
      total_value: stats.totalValue,
      recent_estimates: stats.recentEstimates
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
      errors: validation.errors.map(error => ({
        field: error.field,
        message: error.message,
        severity: 'error' as const
      })),
      warnings: validation.warnings.map(warning => ({
        field: warning.field,
        message: warning.message,
        severity: 'warning' as const,
        recommendation: warning.recommendation
      }))
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
      differences: comparison.item_differences,
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

  /**
   * Format currency amount
   */
  static formatCurrency(amount: number, currency: string = 'MRU'): string {
    return new Intl.NumberFormat('fr-MR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Format date for display
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-MR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Calculate validity expiry date
   */
  static calculateExpiryDate(submissionDate: string, validityPeriod: number): string {
    const date = new Date(submissionDate);
    date.setDate(date.getDate() + validityPeriod);
    return date.toISOString();
  }

  /**
   * Check if estimate is expired
   */
  static isExpired(submissionDate: string, validityPeriod: number): boolean {
    const expiryDate = this.calculateExpiryDate(submissionDate, validityPeriod);
    return new Date() > new Date(expiryDate);
  }
}
