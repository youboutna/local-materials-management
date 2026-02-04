/**
 * Supplier Transformer - Hexagonal Architecture
 * Transforms between Supplier entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * Includes functionality from SupplierDomainTransformer
 */

import { Supplier, SupplierCategory, SupplierStatus } from '@/domain/entities/Supplier';
import { SupplierDTO, CreateSupplierDTO, UpdateSupplierDTO, SupplierSummaryDTO } from '@/dtos/entities/SupplierDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

// DTO legacy compatible avec le code existant
export interface SupplierLegacyDTO {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
}

export interface SearchSuppliersOptions {
  limit?: number;
}

export interface SearchSuppliersResult {
  suppliers: SupplierDTO[];
  total: number;
}

export class SupplierTransformer implements EntityToDTOMapper<Supplier, SupplierDTO> {
  /**
   * Transform Supplier entity to SupplierDTO (Domain Entity → DTO)
   * Converts domain entity to data transfer object for UI layer
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(entity: Supplier): SupplierDTO {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email || undefined,
      phone: entity.phone || undefined,
      address: entity.address || undefined,
      contactPerson: entity.contacts[0]?.name || undefined,
      category: entity.category || undefined,
      rating: entity.rating?.overall || undefined,
      isActive: entity.status === 'active',
      nif: entity.nif || undefined,
      commerceRegisterRef: undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform SupplierDTO to Supplier entity (DTO → Domain Entity)
   * Converts data transfer object to domain entity
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static toEntity(dto: SupplierDTO): Supplier {
    return new Supplier(
      dto.id,
      dto.name,
      dto.email || null,
      dto.phone || null,
      dto.address || null,
      dto.nif || null,
      dto.category as SupplierCategory || null,
      dto.isActive ? 'active' : 'inactive' as SupplierStatus,
      dto.rating ? {
        quality: dto.rating,
        delivery: dto.rating,
        price: dto.rating,
        communication: dto.rating,
        overall: dto.rating
      } : null,
      dto.contactPerson ? [{ name: dto.contactPerson, email: dto.email || '', phone: dto.phone || '' }] : [],
      false, // isVerified
      null, // verifiedAt
      null, // workspaceId
      dto.createdAt,
      dto.updatedAt
    );
  }

  /**
   * Transform Supplier entity to legacy DTO (for backward compatibility)
   */
  static toLegacyDTO(entity: Supplier): SupplierLegacyDTO {
    return {
      id: entity.id,
      name: entity.name,
      contact_person: entity.contacts[0]?.name || undefined,
      email: entity.email || undefined,
      phone: entity.phone || undefined
    };
  }

  /**
   * Transform legacy DTO to Supplier entity
   */
  static fromLegacyDTO(dto: SupplierLegacyDTO): Supplier {
    return new Supplier(
      dto.id,
      dto.name,
      dto.email || null,
      dto.phone || null,
      null, // address
      null, // nif
      null, // category
      'active' as SupplierStatus, // status par défaut
      null, // rating
      dto.contact_person ? [{ name: dto.contact_person, email: dto.email || '', phone: dto.phone || '' }] : [], // contacts
      false, // isVerified
      null, // verifiedAt
      null, // workspaceId
      new Date().toISOString(), // createdAt
      new Date().toISOString()  // updatedAt
    );
  }

  /**
   * Transformer un tableau d'entités en tableau de DTOs
   */
  static toDTOList(entities: Supplier[]): SupplierDTO[] {
    return entities.map(entity => this.toDTO(entity));
  }

  /**
   * Transformer un tableau de DTOs en tableau d'entités
   */
  static toEntityList(dtos: SupplierDTO[]): Supplier[] {
    return dtos.map(dto => this.toEntity(dto));
  }

  // EntityToDTOMapper interface implementation
  toDTO(entity: Supplier): SupplierDTO {
    return SupplierTransformer.toDTO(entity);
  }

  fromDTO(dto: SupplierDTO): Supplier {
    return SupplierTransformer.toEntity(dto);
  }

  fromEntityToDTO(entity: Supplier): SupplierDTO {
    return SupplierTransformer.toDTO(entity);
  }

  fromDtosToAdapter(dtos: SupplierDTO[]): SupplierDTO[] {
    return dtos;
  }

  toResponseDto(entity: Supplier): SupplierDTO {
    return SupplierTransformer.toDTO(entity);
  }

  toRequestDto(dto: SupplierDTO): SupplierDTO {
    return dto;
  }

  toUpdateDto(dto: SupplierDTO): Partial<SupplierDTO> {
    return {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      contactPerson: dto.contactPerson,
      category: dto.category,
      rating: dto.rating,
      isActive: dto.isActive,
      nif: dto.nif,
      commerceRegisterRef: dto.commerceRegisterRef
    };
  }

  validate(dto: SupplierDTO): ValidationResult {
    const errors: string[] = [];
    
    if (!dto.name || dto.name.trim() === '') {
      errors.push('Supplier name is required');
    }
    
    if (dto.email && !dto.email.includes('@')) {
      errors.push('Invalid email format');
    }
    
    if (dto.rating && (dto.rating < 0 || dto.rating > 5)) {
      errors.push('Rating must be between 0 and 5');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toDTOs(entities: Supplier[]): SupplierDTO[] {
    return entities.map(entity => SupplierTransformer.toDTO(entity));
  }

  toEntities(dtos: SupplierDTO[]): Supplier[] {
    return dtos.map(dto => SupplierTransformer.toEntity(dto));
  }

  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Supplier[] {
    return rows.map(row => SupplierTransformer.toEntityFromDatabaseRow(row));
  }

  static toEntityFromDatabaseRow(row: Record<string, unknown>): Supplier {
    return new Supplier(
      row.id as string,
      row.name as string,
      row.email as string || null,
      row.phone as string || null,
      row.address as string || null,
      row.nif as string || null,
      row.category as SupplierCategory || null,
      (row.is_active ? 'active' : 'inactive') as SupplierStatus,
      row.rating ? {
        quality: Number(row.rating),
        delivery: Number(row.rating),
        price: Number(row.rating),
        communication: Number(row.rating),
        overall: Number(row.rating)
      } : null,
      [], // contacts would need to be loaded separately
      Boolean(row.is_verified) || false,
      row.verified_at as string || null,
      row.workspace_id as string || null,
      row.created_at as string,
      row.updated_at as string
    );
  }

  /**
   * Validate search options
   */
  static validateSearchOptions(options: SearchSuppliersOptions): ValidationResult {
    const errors: string[] = [];
    
    if (options.limit && options.limit < 0) {
      errors.push('Limit must be positive');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convert search results to DTO format
   */
  static toSearchResultDTO(entities: Supplier[], total: number): SearchSuppliersResult {
    return {
      suppliers: this.toDTOList(entities),
      total
    };
  }

  static toSummaryDTO(entity: Supplier): SupplierSummaryDTO {
    return {
      id: entity.id,
      name: entity.name,
      category: entity.category || undefined,
      isActive: entity.status === 'active',
      rating: entity.rating?.overall || undefined
    };
  }

  static toSummaryDTOList(entities: Supplier[]): SupplierSummaryDTO[] {
    return entities.map(entity => this.toSummaryDTO(entity));
  }
}
