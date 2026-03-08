/**
 * Advanced Tender Estimate Transformer - Hexagonal Architecture
 * Transforms between TenderEstimate entities and DTOs with advanced calculations
 */

import { TenderEstimate, CurrencyCode } from '@/domain/entities/TenderEstimate';
import { TenderEstimateDTO } from '@/dtos/entities/TenderEstimateDTO';

// Type for price range distribution
interface PriceRangeDistribution {
  min_price: number;
  max_price: number;
  item_count: number;
  percentage: number;
}

export class AdvancedTenderEstimateTransformer {
  /**
   * Transform TenderEstimate entity to DTO
   */
  static toDTO(entity: TenderEstimate): TenderEstimateDTO {
    return {
      id: entity.id,
      tender_id: entity.tenderId,
      submitted_by: entity.submittedBy || '',
      submission_date: entity.createdAt,
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
      finalTotal: entity.finalTotal,
      discountRate: entity.discountRate,
      discountAmount: entity.discountAmount,
      overheadPercentage: entity.overheadPercentage,
      overheadAmount: entity.overheadAmount,
      profitMarginPercentage: entity.profitMarginPercentage,
      profitMarginAmount: entity.profitMarginAmount,
      // Cost breakdown
      totalMaterialsCost: entity.totalMaterialsCost,
      totalLaborCost: entity.totalLaborCost,
      totalEquipmentCost: entity.totalEquipmentCost,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  /**
   * Transform DTO to TenderEstimate entity
   */
  static toEntity(dto: TenderEstimateDTO): TenderEstimate {
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
        subtotal: dto.subtotal,
        taxAmount: dto.taxAmount ?? (dto.tax_amount != null ? dto.tax_amount : undefined),
        taxRate: dto.taxRate ?? dto.tax_rate ?? undefined,
        totalWithTax: dto.totalWithTax ?? dto.total_with_tax ?? undefined,
        finalTotal: dto.finalTotal ?? dto.final_total ?? undefined,
        discountRate: dto.discountRate,
        discountAmount: dto.discountAmount,
        totalMaterialsCost: dto.totalMaterialsCost ?? dto.total_materials_cost ?? undefined,
        totalLaborCost: dto.totalLaborCost ?? dto.total_labor_cost ?? undefined,
        totalEquipmentCost: dto.totalEquipmentCost ?? dto.total_equipment_cost ?? undefined,
        overheadPercentage: dto.overheadPercentage ?? dto.overhead_percentage ?? undefined,
        overheadAmount: dto.overheadAmount ?? dto.overhead_amount ?? undefined,
        profitMarginPercentage: dto.profitMarginPercentage ?? dto.profit_margin_percentage ?? undefined,
        profitMarginAmount: dto.profitMarginAmount ?? dto.profit_margin_amount ?? undefined
      }
    );
  }

  /**
   * Batch transform entities to DTOs
   */
  static toDTOs(entities: TenderEstimate[]): TenderEstimateDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  /**
   * Batch transform DTOs to entities
   */
  static toEntities(dtos: TenderEstimateDTO[]): TenderEstimate[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  /**
   * Calculate summary statistics for estimates
   */
  static calculateSummary(estimates: TenderEstimate[]): {
    totalItems: number;
    totalValue: number;
    averageUnitPrice: number;
    categories: Record<string, number>;
    priceRanges: PriceRangeDistribution[];
  } {
    if (estimates.length === 0) {
      return {
        totalItems: 0,
        totalValue: 0,
        averageUnitPrice: 0,
        categories: {},
        priceRanges: []
      };
    }

    const totalValue = estimates.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    const avgPrice = totalValue / estimates.length;
    
    const categories: Record<string, number> = {};
    estimates.forEach(e => {
      const cat = e.estimateType || 'uncategorized';
      categories[cat] = (categories[cat] || 0) + (e.totalAmount || 0);
    });

    const priceRanges = this.calculatePriceDistribution(estimates);

    return {
      totalItems: estimates.length,
      totalValue,
      averageUnitPrice: avgPrice,
      categories,
      priceRanges
    };
  }

  /**
   * Calculate price distribution ranges
   */
  private static calculatePriceDistribution(estimates: TenderEstimate[]): PriceRangeDistribution[] {
    const prices = estimates.map(e => e.totalAmount || 0).filter(p => p > 0);
    
    if (prices.length === 0) return [];

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    
    if (range === 0) {
      return [{
        min_price: min,
        max_price: max,
        item_count: prices.length,
        percentage: 100
      }];
    }

    const bucketCount = 5;
    const bucketSize = range / bucketCount;

    const ranges: PriceRangeDistribution[] = [];
    for (let i = 0; i < bucketCount; i++) {
      const minPrice = min + (i * bucketSize);
      const maxPrice = min + ((i + 1) * bucketSize);
      const itemsInRange = prices.filter(p => p >= minPrice && (i === bucketCount - 1 ? p <= maxPrice : p < maxPrice));
      
      ranges.push({
        min_price: minPrice,
        max_price: maxPrice,
        item_count: itemsInRange.length,
        percentage: (itemsInRange.length / prices.length) * 100
      });
    }

    return ranges;
  }

  /**
   * Calculate complexity score based on metrics
   */
  static calculateComplexityScore(estimates: TenderEstimate[]): number {
    if (estimates.length === 0) return 0;

    let score = 0;

    // Factor 1: Number of items
    score += Math.min(estimates.length * 2, 30);

    // Factor 2: Category diversity
    const categories = new Set(estimates.map(e => e.estimateType).filter(Boolean));
    score += Math.min(categories.size * 5, 25);

    // Factor 3: Price variation
    const prices = estimates.map(e => e.totalAmount || 0);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgPrice > 0 ? stdDev / avgPrice : 0;
    score += Math.min(coefficientOfVariation * 20, 25);

    // Factor 4: Total value
    const totalValue = estimates.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
    if (totalValue > 1000000) score += 20;
    else if (totalValue > 100000) score += 15;
    else if (totalValue > 10000) score += 10;
    else score += 5;

    return Math.min(Math.round(score), 100);
  }

  /**
   * Transform from database row
   */
  static toEntityFromDatabaseRow(row: Record<string, unknown>): TenderEstimate {
    return new TenderEstimate(
      row.id as string,
      (row.tender_id as string) || '',
      (row.status as TenderEstimate['status']) || 'draft',
      (row.currency as CurrencyCode) || 'MRU',
      (row.estimate_type as string) || 'standard',
      (row.created_at as string) || new Date().toISOString(),
      (row.updated_at as string) || new Date().toISOString(),
      {
        submittedBy: row.submitted_by as string,
        subtotal: row.subtotal as number,
        taxAmount: row.tax_amount as number,
        taxRate: row.tax_rate as number,
        totalWithTax: row.total_with_tax as number,
        finalTotal: row.final_total as number,
        discountRate: row.discount_rate as number,
        discountAmount: row.discount_amount as number,
        totalMaterialsCost: row.total_materials_cost as number,
        totalLaborCost: row.total_labor_cost as number,
        totalEquipmentCost: row.total_equipment_cost as number,
        overheadPercentage: row.overhead_percentage as number,
        overheadAmount: row.overhead_amount as number,
        profitMarginPercentage: row.profit_margin_percentage as number,
        profitMarginAmount: row.profit_margin_amount as number
      }
    );
  }
}
