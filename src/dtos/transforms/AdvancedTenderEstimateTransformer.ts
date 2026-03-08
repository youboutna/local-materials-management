/**
 * Advanced Tender Estimate Transformer - Hexagonal Architecture
 * Transforms between TenderEstimate entities and DTOs with advanced calculations
 */

import { TenderEstimate } from '@/domain/entities/TenderEstimate';
import { TenderEstimateDTO, CreateTenderEstimateDTO, UpdateTenderEstimateDTO } from '@/dtos/entities/TenderEstimateDTO';

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
      tenderId: entity.tenderId,
      description: entity.description,
      quantity: entity.quantity,
      unit: entity.unit,
      unitPrice: entity.unitPrice,
      totalPrice: entity.totalPrice,
      category: entity.category,
      notes: entity.notes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform DTO to TenderEstimate entity
   */
  static toEntity(dto: TenderEstimateDTO): TenderEstimate {
    return TenderEstimate.create({
      id: dto.id,
      tenderId: dto.tenderId,
      description: dto.description,
      quantity: dto.quantity,
      unit: dto.unit,
      unitPrice: dto.unitPrice,
      totalPrice: dto.totalPrice,
      category: dto.category,
      notes: dto.notes,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    });
  }

  /**
   * Transform CreateDTO to entity
   */
  static fromCreateDTO(dto: CreateTenderEstimateDTO): TenderEstimate {
    const now = new Date().toISOString();
    return TenderEstimate.create({
      id: crypto.randomUUID(),
      tenderId: dto.tenderId,
      description: dto.description,
      quantity: dto.quantity,
      unit: dto.unit,
      unitPrice: dto.unitPrice,
      totalPrice: dto.quantity * dto.unitPrice,
      category: dto.category,
      notes: dto.notes,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Transform UpdateDTO to partial entity
   */
  static fromUpdateDTO(dto: UpdateTenderEstimateDTO): Partial<TenderEstimate> {
    const result: Record<string, unknown> = {
      updatedAt: new Date().toISOString()
    };

    if (dto.description !== undefined) result.description = dto.description;
    if (dto.quantity !== undefined) result.quantity = dto.quantity;
    if (dto.unit !== undefined) result.unit = dto.unit;
    if (dto.unitPrice !== undefined) result.unitPrice = dto.unitPrice;
    if (dto.category !== undefined) result.category = dto.category;
    if (dto.notes !== undefined) result.notes = dto.notes;

    // Recalculate total if quantity or unitPrice changed
    if (dto.quantity !== undefined || dto.unitPrice !== undefined) {
      const quantity = dto.quantity ?? 0;
      const unitPrice = dto.unitPrice ?? 0;
      result.totalPrice = quantity * unitPrice;
    }

    return result as Partial<TenderEstimate>;
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

    const totalValue = estimates.reduce((sum, e) => sum + (e.totalPrice || 0), 0);
    const totalUnitPrice = estimates.reduce((sum, e) => sum + (e.unitPrice || 0), 0);
    
    const categories: Record<string, number> = {};
    estimates.forEach(e => {
      const cat = e.category || 'uncategorized';
      categories[cat] = (categories[cat] || 0) + (e.totalPrice || 0);
    });

    const priceRanges = this.calculatePriceDistribution(estimates);

    return {
      totalItems: estimates.length,
      totalValue,
      averageUnitPrice: totalUnitPrice / estimates.length,
      categories,
      priceRanges
    };
  }

  /**
   * Calculate price distribution ranges
   */
  private static calculatePriceDistribution(estimates: TenderEstimate[]): PriceRangeDistribution[] {
    const prices = estimates.map(e => e.unitPrice || 0).filter(p => p > 0);
    
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
    const categories = new Set(estimates.map(e => e.category).filter(Boolean));
    score += Math.min(categories.size * 5, 25);

    // Factor 3: Price variation
    const prices = estimates.map(e => e.unitPrice || 0);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = avgPrice > 0 ? stdDev / avgPrice : 0;
    score += Math.min(coefficientOfVariation * 20, 25);

    // Factor 4: Total value
    const totalValue = estimates.reduce((sum, e) => sum + (e.totalPrice || 0), 0);
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
    return TenderEstimate.create({
      id: row.id as string,
      tenderId: (row.tender_id as string) || '',
      description: (row.description as string) || '',
      quantity: Number(row.quantity) || 0,
      unit: (row.unit as string) || '',
      unitPrice: Number(row.unit_price) || 0,
      totalPrice: Number(row.total_price) || 0,
      category: (row.category as string) || undefined,
      notes: (row.notes as string) || undefined,
      createdAt: (row.created_at as string) || new Date().toISOString(),
      updatedAt: (row.updated_at as string) || new Date().toISOString()
    });
  }
}
