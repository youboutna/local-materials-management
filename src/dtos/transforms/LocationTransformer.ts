/**
 * Location Transformer
 * Handles conversion between domain entities and DTOs
 * Following PROMPTS.md Rule #4: Centralized DTOs and transformers
 */

import { LocationDTO } from '@/dtos/shared';
import { Location } from '@/domain/entities/Location';

/**
 * Location Transformer
 * Converts between Location domain entities and LocationDTOs
 */
export class LocationTransformer {
  /**
   * Convert domain entity to DTO
   */
  static toDTO(entity: Location): LocationDTO {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      nameAr: entity.nameAr,
      type: entity.type,
      coordinates: entity.coordinates ? {
        lat: entity.coordinates.lat,
        lng: entity.coordinates.lng
      } : undefined,
      parentCode: entity.parentCode,
      economicImportance: entity.economicImportance,
      population: entity.population,
      createdAt: typeof entity.createdAt === 'string' ? entity.createdAt : entity.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: typeof entity.updatedAt === 'string' ? entity.updatedAt : entity.updatedAt?.toISOString?.() || new Date().toISOString()
    };
  }

  /**
   * Convert DTO to domain entity
   */
  static fromDTO(dto: LocationDTO): Location {
    return new Location({
      id: dto.id,
      code: dto.code,
      name: dto.name,
      nameAr: dto.nameAr,
      type: dto.type,
      coordinates: dto.coordinates ? {
        lat: dto.coordinates.lat,
        lng: dto.coordinates.lng
      } : undefined,
      parentCode: dto.parentCode,
      economicImportance: dto.economicImportance,
      population: dto.population,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined
    });
  }

  /**
   * Convert database row to domain entity
   */
  static fromDatabaseRow(row: any): Location {
    return new Location({
      id: row.id,
      code: row.code,
      name: row.name,
      nameAr: row.name_ar,
      type: row.type,
      coordinates: row.latitude && row.longitude ? {
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude)
      } : undefined,
      parentCode: row.parent_code,
      economicImportance: row.economic_importance,
      population: row.population ? parseInt(row.population) : undefined,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
    });
  }

  /**
   * Convert domain entity to database row
   */
  static toDatabaseRow(entity: Location): any {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      name_ar: entity.nameAr,
      type: entity.type,
      latitude: entity.coordinates?.lat,
      longitude: entity.coordinates?.lng,
      parent_code: entity.parentCode,
      economic_importance: entity.economicImportance,
      population: entity.population,
      created_at: entity.createdAt?.toISOString(),
      updated_at: entity.updatedAt?.toISOString()
    };
  }

  /**
   * Convert form data to DTO (UI → DTO)
   */
  static fromFormData(formData: any): LocationDTO {
    return {
      id: formData.id || '',
      code: formData.code || '',
      name: formData.name || '',
      nameAr: formData.nameAr || '',
      type: formData.type || 'city',
      coordinates: formData.latitude && formData.longitude ? {
        lat: parseFloat(formData.latitude),
        lng: parseFloat(formData.longitude)
      } : undefined,
      parentCode: formData.parentCode,
      economicImportance: formData.economicImportance,
      population: formData.population ? parseInt(formData.population) : undefined,
      createdAt: formData.createdAt,
      updatedAt: formData.updatedAt
    };
  }

  /**
   * Convert DTO to form data (DTO → UI)
   */
  static toFormData(dto: LocationDTO): any {
    return {
      id: dto.id,
      code: dto.code,
      name: dto.name,
      nameAr: dto.nameAr,
      type: dto.type,
      latitude: dto.coordinates?.lat,
      longitude: dto.coordinates?.lng,
      parentCode: dto.parentCode,
      economicImportance: dto.economicImportance,
      population: dto.population,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }

  /**
   * Convert Mauritania geographic unit to LocationDTO
   */
  static fromGeographicUnit(unit: any): LocationDTO {
    const now = new Date().toISOString();
    return {
      id: unit.code,
      code: unit.code,
      name: unit.name,
      nameAr: unit.nameAr || '',
      type: 'parentCode' in unit ? 'city' : 'region',
      coordinates: {
        lat: unit.lat,
        lng: unit.lng
      },
      parentCode: 'parentCode' in unit ? unit.parentCode : undefined,
      economicImportance: unit.economicImportance,
      population: unit.population
    };
  }

  /**
   * Batch convert multiple entities to DTOs
   */
  static toDTOs(entities: Location[]): LocationDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  /**
   * Batch convert multiple DTOs to entities
   */
  static fromDTOs(dtos: LocationDTO[]): Location[] {
    return dtos.map(dto => this.fromDTO(dto));
  }
}
