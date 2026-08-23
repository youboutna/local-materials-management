/**
 * TenderEstimateItemTransformer - Hexagonal Architecture
 * Transforms between TenderEstimateItem entities and DTOs
 */

import { TenderEstimateItem } from '@/domain/entities/TenderEstimateItem';
import { TenderEstimateItemDTO, CreateTenderEstimateItemRequestDto, UpdateTenderEstimateItemRequestDto } from '@/dtos/entities/TenderEstimateDTO';

export class TenderEstimateItemTransformer {
  /**
   * Transform TenderEstimateItem entity to TenderEstimateItemDTO
   */
  static toTenderEstimateItemDTO(entity: TenderEstimateItem): TenderEstimateItemDTO {
    return {
      id: entity.id,
      estimateId: entity.estimateId,
      materialId: undefined, // Will be set by service if needed
      itemCode: entity.itemCode,
      description: entity.description,
      unit: entity.unit,
      quantity: entity.quantity,
      unitPrice: entity.unitPrice,
      totalPrice: entity.totalPrice,
      category: entity.category,
      specifications: entity.specifications,
      itemType: 'material', // Default item type
      // Business logic calculated fields
      marginPercentage: entity.calculateMarginPercentage(),
      lineTotal: entity.totalPrice,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
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
    const totalPrice = request.quantity * request.unitPrice;

    return new TenderEstimateItem(
      id,
      estimateId,
      request.itemCode || `ITEM-${id}`,
      request.description || 'Item description',
      request.unit || 'unit',
      request.quantity,
      request.unitPrice,
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
    
    if (request.unitPrice !== undefined) {
      entity.updateUnitPrice(request.unitPrice);
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
