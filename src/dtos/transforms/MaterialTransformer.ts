/**
 * Material Transformer - Hexagonal Architecture
 * Transforms between Material entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * Includes BTP calculations and business logic from MaterialDomainTransformer
 * Updated to handle EnhancedMaterialForm requirements
 */

import { Material } from '@/domain/entities/Material';
import {
  MaterialDTO,
  MaterialFormDataDTO,
  CreateMaterialDTO,
  UpdateMaterialDTO,
  MaterialCategory,
  MaterialUnit,
  MaterialStatus
} from '@/dtos/entities/MaterialDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export class MaterialTransformer implements EntityToDTOMapper<Material, MaterialDTO> {
  /**
   * Transform Material entity to MaterialDTO (Domain → DTO)
   * Converts domain entity to data transfer object for UI/API
  */
  static fromSupabase(row: Record<string, unknown>): Material {
    return Material.fromDatabase(row);
  }

  /**
   * Domain Entity → DB row
   */
  static toSupabase(entity: Material): Record<string, unknown> {
    return entity.toDatabase();
  }

  /**
   * Domain Entity → DTO (for UI)
   */
  static toDTO(entity: Material): MaterialDTO {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      category: entity.category,
      subcategory: entity.subcategory,
      status: MaterialStatus.AVAILABLE, // Default status, can be enhanced with business logic
      unit: entity.unit as MaterialUnit,
      quantity: entity.quantity,
      pricePerUnit: entity.pricePerUnit,
      availableQuantity: entity.availableQuantity,
      minQuantity: entity.minQuantity,
      totalValue: entity.calculateTotalValue(),
      workspaceId: entity.workspaceId || '',
      originLocation: entity.originLocation,
      coordinatesLatitude: entity.coordinatesLatitude,
      coordinatesLongitude: entity.coordinatesLongitude,
      adresse: entity.adresse,
      forme: entity.forme,
      localisation: entity.localisation,
      gtin: entity.gtin,
      sku: entity.sku,
      ean: entity.ean,
      asin: entity.asin,
      multilangLabels: entity.multilangLabels,
      timeline: entity.timeline,
      supplier: entity.supplier,
      image: entity.image,
      tags: [], // Can be enhanced with additional logic
      notes: undefined, // Can be enhanced with additional logic
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString()
    };
  }

  /**
   * DTO → Domain Entity
   */
  static fromDTO(dto: MaterialDTO): Material {
    return new Material(
      dto.id,
      dto.name,
      dto.quantity,
      dto.unit,
      dto.category,
      dto.workspaceId,
      { code: 'default', name: 'Default', nameAr: 'افتراضي', lat: 0, lng: 0 }, // Default location
      {
        description: dto.description || '',
        minQuantity: dto.minQuantity,
        timeline: dto.timeline,
        supplier: dto.supplier,
        pricePerUnit: dto.pricePerUnit,
        availableQuantity: dto.availableQuantity,
        originLocation: dto.originLocation,
        subcategory: dto.subcategory,
        localisation: dto.localisation,
        forme: dto.forme,
        adresse: dto.adresse,
        createdAt: new Date(dto.createdAt),
        updatedAt: new Date(dto.updatedAt),
        gtin: dto.gtin,
        sku: dto.sku,
        ean: dto.ean,
        asin: dto.asin,
        image: dto.image,
        coordinatesLatitude: dto.coordinatesLatitude,
        coordinatesLongitude: dto.coordinatesLongitude,
        multilangLabels: dto.multilangLabels
      }
    );
  }

  /**
   * Create Material entity from CreateMaterialDTO
   */
  static createEntityFromCreateDTO(dto: CreateMaterialDTO): Material {
    return new Material(
      crypto.randomUUID(), // Generate new ID
      dto.name,
      dto.quantity,
      dto.unit,
      dto.category,
      dto.workspaceId,
      { code: 'default', name: 'Default', nameAr: 'افتراضي', lat: dto.coordinatesLatitude || 0, lng: dto.coordinatesLongitude || 0 },
      {
        description: dto.description || '',
        timeline: dto.timeline,
        supplier: dto.supplier,
        pricePerUnit: dto.pricePerUnit,
        availableQuantity: dto.availableQuantity,
        originLocation: dto.originLocation,
        subcategory: dto.subcategory,
        localisation: dto.localisation || [],
        forme: dto.forme,
        adresse: dto.adresse,
        gtin: dto.gtin,
        sku: dto.sku,
        ean: dto.ean,
        asin: dto.asin,
        image: dto.image,
        coordinatesLatitude: dto.coordinatesLatitude,
        coordinatesLongitude: dto.coordinatesLongitude,
        multilangLabels: dto.multilangLabels,
        materialStatus: 'active'
      }
    );
  }

  /**
   * Convert MaterialFormDataDTO to UpdateMaterialDTO
   * Form data → Update request for service layer
   */
  static formToUpdateRequest(formData: MaterialFormDataDTO): UpdateMaterialDTO {
    return {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      subcategory: formData.subcategory,
      unit: formData.unit,
      pricePerUnit: formData.pricePerUnit,
      quantity: formData.quantity,
      availableQuantity: formData.availableQuantity,
      workspaceId: formData.workspaceId,
      gtin: formData.gtin,
      sku: formData.sku,
      ean: formData.ean,
      asin: formData.asin,
      image: formData.image,
      coordinatesLatitude: formData.coordinatesLatitude,
      coordinatesLongitude: formData.coordinatesLongitude,
      adresse: formData.adresse,
      forme: formData.forme,
      localisation: formData.localisation,
      multilangLabels: formData.multilangLabels,
      timeline: formData.timeline ? {
        start: formData.timeline.start,
        end: formData.timeline.end,
        estimatedDuration: formData.timeline.estimatedDuration
      } : undefined,
      supplier: formData.supplier
    };
  }

  // EntityToDTOMapper interface implementation
  toDTO(entity: Material): MaterialDTO {
    return MaterialTransformer.toDTO(entity);
  }

  fromDTO(dto: MaterialDTO): Material {
    return MaterialTransformer.fromDTO(dto);
  }

  fromEntityToDTO(entity: Material): MaterialDTO {
    return MaterialTransformer.toDTO(entity);
  }

  toResponseDto(entity: Material): MaterialDTO {
    return MaterialTransformer.toDTO(entity);
  }

  toRequestDto(dto: MaterialDTO): MaterialDTO {
    return dto; // For this implementation, request and response are the same
  }

  toUpdateDto(dto: MaterialDTO): Partial<MaterialDTO> {
    const { id, status, createdAt, updatedAt, ...updateFields } = dto;
    return updateFields;
  }

  fromDtosToAdapter(dtos: MaterialDTO[]): MaterialDTO[] | Record<string, unknown>[] {
    return dtos; // Return DTOs as-is for adapter
  }

  validate(dto: MaterialDTO): ValidationResult {
    // Basic validation - can be enhanced with more business rules
    const errors: string[] = [];

    if (!dto.name?.trim()) {
      errors.push('Material name is required');
    }

    if (dto.pricePerUnit < 0) {
      errors.push('Price per unit must be positive');
    }

    if (dto.availableQuantity < 0) {
      errors.push('Available quantity must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toDTOs(entities: Material[]): MaterialDTO[] {
    return entities.map(entity => MaterialTransformer.toDTO(entity));
  }

  toEntities(dtos: MaterialDTO[]): Material[] {
    return dtos.map(dto => MaterialTransformer.fromDTO(dto));
  }
}
