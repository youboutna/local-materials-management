/**
 * TenderEstimateItemTransformer - Hexagonal Architecture
 * Transforms between TenderEstimateItem entities and DTOs
 */

import { TenderEstimateItem } from '@/domain/entities/TenderEstimateItem';
import { TenderEstimateItemDTO } from '@/dtos/entities/TenderDTO';;

export class TenderEstimateItemTransformer {
  /**
   * Transform TenderEstimateItem entity to TenderEstimateItemDTO
   */
  static toTenderEstimateItemDTO(entity: TenderEstimateItem): TenderEstimateItemDTO {
    return {
      id: entity.id,
      estimate_id: entity.estimateId,
      material_id: undefined, // Will be set by service if needed
      item_code: entity.itemCode,
      description: entity.description,
      unit: entity.unit,
      quantity: entity.quantity,
      unit_price: entity.unitPrice,
      total_price: entity.totalPrice,
      category: entity.category,
      specifications: entity.specifications,
      item_type: 'material', // Default item type
      // Business logic calculated fields
      margin_percentage: entity.calculateMarginPercentage(),
      line_total: entity.totalPrice,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  /**
   * Transform CreateTenderEstimateItemRequestDto to TenderEstimateItem entity
   */
  static toTenderEstimateItem(
    request: CreateTenderEstimateItemRequestDto,
    estimateId: string
  ): TenderEstimateItem {
    const id = `item_${Date.now()}_${crypto.randomUUID().slice(0, 9)}`;
    const totalPrice = request.quantity * request.unit_price;

    return new TenderEstimateItem(
      id,
      estimateId,
      request.item_code || `ITEM-${id}`,
      request.description || 'Item description',
      request.unit || 'unit',
      request.quantity,
      request.unit_price,
      totalPrice,
      request.category || 'general',
      request.specifications
    );
  }

  /**
   * Update TenderEstimateItem entity from UpdateTenderEstimateItemRequestDto
   */
  static updateEntity(
    entity: TenderEstimateItem,
    request: UpdateTenderEstimateItemRequestDto
  ): TenderEstimateItem {
    if (request.description !== undefined) {
      entity.updateDescription(request.description);
    }
    
    if (request.quantity !== undefined) {
      entity.updateQuantity(request.quantity);
    }
    
    if (request.unit_price !== undefined) {
      entity.updateUnitPrice(request.unit_price);
    }
    
    if (request.category !== undefined) {
      entity.updateCategory(request.category);
    }
    
    if (request.specifications !== undefined) {
      entity.updateSpecifications(request.specifications);
    }

    return entity;
  }

  /**
   * Transform TenderEstimateItem entity to plain object for repository
   */
  static toRepositoryData(entity: TenderEstimateItem) {
    return entity.toPlainObject();
  }

  /**
   * Transform array of TenderEstimateItem entities to DTOs
   */
  static toTenderEstimateItemDTOs(entities: TenderEstimateItem[]): TenderEstimateItemDTO[] {
    return entities.map(entity => this.toTenderEstimateItemDTO(entity));
  }

  /**
   * Validate TenderEstimateItem entity
   */
  static validate(entity: TenderEstimateItem): { isValid: boolean; errors: string[] } {
    return entity.validate();
  }

  /**
   * Calculate business metrics for TenderEstimateItem
   */
  static calculateMetrics(entity: TenderEstimateItem) {
    return {
      marginPercentage: entity.calculateMarginPercentage(),
      profitMargin: entity.totalPrice - (entity.quantity * entity.unitPrice),
      isValid: entity.validate().isValid
    };
  }
}
