/**
 * Tender Estimate Transformer - Hexagonal Architecture
 * Converts between Domain Entities and DTOs
 */

import { TenderEstimate, TenderEstimateItem } from '@/domain/repositories/ITenderEstimateRepository';
import { 
  TenderEstimateDTO, 
  TenderEstimateItemDTO,
  TenderEstimateStatsDto,
  TenderEstimateValidationDto,
  TenderEstimateComparisonDto,
  TenderEstimateItemDifferenceDto,
  TenderEstimateValidationErrorDto,
  TenderEstimateValidationWarningDto
} from '@/dtos/entities/TenderEstimateDTO';

export class TenderEstimateTransformer {
  /**
   * Transform Domain Entity to DTO
   */
  static toTenderEstimateDTO(entity: TenderEstimate): TenderEstimateDTO {
    return {
      id: entity.id,
      tender_id: entity.tender_id,
      submitted_by: entity.submitted_by,
      submission_date: entity.submission_date,
      status: entity.status,
      total_amount: entity.total_amount,
      currency: entity.currency,
      validity_period: entity.validity_period,
      notes: entity.notes,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    };
  }

  /**
   * Transform DTO to Domain Entity
   */
  static toTenderEstimateEntity(dto: TenderEstimateDTO): TenderEstimate {
    return {
      id: dto.id,
      tender_id: dto.tender_id,
      submitted_by: dto.submitted_by,
      submission_date: dto.submission_date,
      status: dto.status,
      total_amount: dto.total_amount,
      currency: dto.currency,
      validity_period: dto.validity_period,
      notes: dto.notes,
      created_at: dto.created_at,
      updated_at: dto.updated_at
    };
  }

  /**
   * Transform Domain Entity to DTO
   */
  static toTenderEstimateItemDTO(entity: TenderEstimateItem): TenderEstimateItemDTO {
    return {
      id: entity.id,
      estimate_id: entity.estimate_id,
      item_code: entity.item_code,
      description: entity.description,
      unit: entity.unit,
      quantity: entity.quantity,
      unit_price: entity.unit_price,
      total_price: entity.total_price,
      category: entity.category,
      specifications: entity.specifications,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    };
  }

  /**
   * Transform DTO to Domain Entity
   */
  static toTenderEstimateItemEntity(dto: TenderEstimateItemDTO): TenderEstimateItem {
    return {
      id: dto.id,
      estimate_id: dto.estimate_id,
      item_code: dto.item_code,
      description: dto.description,
      unit: dto.unit,
      quantity: dto.quantity,
      unit_price: dto.unit_price,
      total_price: dto.total_price,
      category: dto.category,
      specifications: dto.specifications,
      created_at: dto.created_at,
      updated_at: dto.updated_at
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
  static toTenderEstimateStatsDTO(stats: {
    totalEstimates: number;
    estimatesByStatus: Record<string, number>;
    totalValue: number;
    averageAmount: number;
    estimatesBySubmitter: Record<string, number>;
  }): TenderEstimateStatsDto {
    return {
      total_estimates: stats.totalEstimates,
      estimates_by_status: stats.estimatesByStatus,
      total_value: stats.totalValue,
      average_amount: stats.averageAmount,
      estimates_by_submitter: stats.estimatesBySubmitter
    };
  }

  /**
   * Transform validation result to DTO
   */
  static toTenderEstimateValidationDTO(validation: {
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
  static toTenderEstimateComparisonDTO(comparison: {
    estimate1: TenderEstimate;
    estimate2: TenderEstimate;
    priceDifference: number;
    priceDifferencePercentage: number;
    itemDifferences: Array<{
      itemCode: string;
      description: string;
      estimate1Price: number;
      estimate2Price: number;
      priceDifference: number;
      priceDifferencePercentage: number;
    }>;
  }): TenderEstimateComparisonDto {
    return {
      estimate_1: this.toTenderEstimateDTO(comparison.estimate1),
      estimate_2: this.toTenderEstimateDTO(comparison.estimate2),
      price_difference: comparison.priceDifference,
      price_difference_percentage: comparison.priceDifferencePercentage,
      item_differences: comparison.itemDifferences.map(diff => ({
        item_code: diff.itemCode,
        description: diff.description,
        estimate_1_price: diff.estimate1Price,
        estimate_2_price: diff.estimate2Price,
        price_difference: diff.priceDifference,
        price_difference_percentage: diff.priceDifferencePercentage
      }))
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
