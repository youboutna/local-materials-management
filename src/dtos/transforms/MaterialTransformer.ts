/**
 * Material Domain Transformer - Hexagonal Architecture
 * Transforms between Material entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 */

import { Material } from '@/domain/entities/Material';
import { MaterialDTO } from '@/dtos/entities/MaterialDTO';

/**
 * Material Transformer - Hexagonal Architecture
 * Handles transformation between Material entities and DTOs
 */
export class MaterialTransformer {
  /**
   * Transform Material entity to MaterialDTO (Domain Entity → DTO)
   * Converts domain entity to data transfer object for UI layer
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(entity: Material): MaterialDTO {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      type: entity.type,
      category: entity.category,
      unit: entity.unit,
      quantity: entity.quantity,
      unitPrice: entity.unitPrice,
      totalPrice: entity.totalPrice || (entity.quantity * entity.unitPrice),
      supplierId: entity.supplierId,
      projectId: entity.projectId,
      phaseId: entity.phaseId,
      taskId: entity.taskId,
      // Additional fields
      specifications: entity.specifications || {},
      brand: entity.brand || '',
      model: entity.model || '',
      reference: entity.reference || '',
      quality: entity.quality || 'standard',
      availability: entity.availability || 'available',
      deliveryTime: entity.deliveryTime || 0,
      storageLocation: entity.storageLocation || '',
      // Metadata
      createdAt: entity.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: entity.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Transform MaterialDTO to Material entity (DTO → Domain Entity)
   * Converts data transfer object to domain entity
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static toEntity(dto: MaterialDTO): Material {
    return new Material(
      dto.id,
      dto.name,
      dto.type,
      dto.category,
      dto.unit,
      dto.quantity,
      dto.unitPrice,
      dto.supplierId,
      dto.projectId,
      dto.description,
      dto.phaseId,
      dto.taskId,
      // Additional fields
      dto.specifications || {},
      dto.brand || '',
      dto.model || '',
      dto.reference || '',
      dto.quality || 'standard',
      dto.availability || 'available',
      dto.deliveryTime || 0,
      dto.storageLocation || '',
      dto.createdAt ? new Date(dto.createdAt) : new Date(),
      dto.updatedAt ? new Date(dto.updatedAt) : new Date()
    );
  }

  /**
   * Transform CreateMaterialDTO to Material entity
   * Used for creating new materials from form data
   */
  static fromCreateDTOToEntity(dto: Partial<MaterialDTO>): Material {
    return new Material(
      dto.id || crypto.randomUUID(),
      dto.name || '',
      dto.type || 'raw',
      dto.category || 'general',
      dto.unit || 'unit',
      dto.quantity || 0,
      dto.unitPrice || 0,
      dto.supplierId || '',
      dto.projectId || '',
      dto.description || '',
      dto.phaseId,
      dto.taskId,
      dto.specifications || {},
      dto.brand || '',
      dto.model || '',
      dto.reference || '',
      dto.quality || 'standard',
      dto.availability || 'available',
      dto.deliveryTime || 0,
      dto.storageLocation || '',
      new Date(),
      new Date()
    );
  }

  /**
   * Transform array of Material entities to array of MaterialDTOs
   */
  static toDTOList(entities: Material[]): MaterialDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  /**
   * Transform array of MaterialDTOs to array of Material entities
   */
  static toEntityList(dtos: MaterialDTO[]): Material[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  /**
   * Transform Material entity to Update DTO (partial)
   * Used for partial updates in form workflows
   */
  static toUpdateDTO(entity: Partial<Material>): Partial<MaterialDTO> {
    const dto: Partial<MaterialDTO> = {};

    if (entity.id !== undefined) dto.id = entity.id;
    if (entity.name !== undefined) dto.name = entity.name;
    if (entity.description !== undefined) dto.description = entity.description;
    if (entity.type !== undefined) dto.type = entity.type;
    if (entity.category !== undefined) dto.category = entity.category;
    if (entity.unit !== undefined) dto.unit = entity.unit;
    if (entity.quantity !== undefined) dto.quantity = entity.quantity;
    if (entity.unitPrice !== undefined) dto.unitPrice = entity.unitPrice;
    if (entity.supplierId !== undefined) dto.supplierId = entity.supplierId;
    if (entity.projectId !== undefined) dto.projectId = entity.projectId;
    if (entity.phaseId !== undefined) dto.phaseId = entity.phaseId;
    if (entity.taskId !== undefined) dto.taskId = entity.taskId;
    if (entity.specifications !== undefined) dto.specifications = entity.specifications;
    if (entity.brand !== undefined) dto.brand = entity.brand;
    if (entity.model !== undefined) dto.model = entity.model;
    if (entity.reference !== undefined) dto.reference = entity.reference;
    if (entity.quality !== undefined) dto.quality = entity.quality;
    if (entity.availability !== undefined) dto.availability = entity.availability;
    if (entity.deliveryTime !== undefined) dto.deliveryTime = entity.deliveryTime;
    if (entity.storageLocation !== undefined) dto.storageLocation = entity.storageLocation;

    // Calculate total price if quantity and unit price are available
    if (entity.quantity !== undefined && entity.unitPrice !== undefined) {
      dto.totalPrice = entity.quantity * entity.unitPrice;
    }

    return dto;
  }

  /**
   * Transform simple material selection to Material entity
   * Used in project creation workflow for material selection
   */
  static fromSelectionToEntity(selection: { materialId: string; quantity: number }): Material {
    return new Material(
      selection.materialId,
      '', // name - will be populated from material catalog
      'raw', // type
      'general', // category
      'unit', // unit
      selection.quantity,
      0, // unitPrice - will be populated from material catalog
      '', // supplierId
      '', // projectId
      '', // description
      undefined, // phaseId
      undefined, // taskId
      {}, // specifications
      '', // brand
      '', // model
      '', // reference
      'standard', // quality
      'available', // availability
      0, // deliveryTime
      '', // storageLocation
      new Date(),
      new Date()
    );
  }
}
