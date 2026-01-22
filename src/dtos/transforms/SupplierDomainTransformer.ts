/**
 * Supplier Domain Transformer
 * Transforms between domain entities and DTOs for suppliers
 * Following hexagonal architecture principles
 */

import { Supplier } from '@/domain/entities/Supplier';
import { SupplierDTO, CreateSupplierRequestDto, UpdateSupplierRequestDto } from '@/dtos/entities';

export class SupplierDomainTransformer {
  /**
   * Transform domain entity to DTO
   */
  static toDTO(supplier: Supplier): SupplierDTO {
    return {
      id: supplier.id,
      name: supplier.name,
      contact_person: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      specialization: supplier.specialization,
      rating: supplier.rating,
      is_active: supplier.isActive,
      created_at: supplier.createdAt,
      updated_at: supplier.updatedAt
    };
  }

  /**
   * Transform DTO to domain entity
   */
  static toEntity(dto: SupplierDTO): Supplier {
    return {
      id: dto.id,
      name: dto.name,
      contactPerson: dto.contact_person,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      specialization: dto.specialization,
      rating: dto.rating,
      isActive: dto.is_active,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at
    };
  }

  /**
   * Transform CreateSupplierRequestDto to domain entity
   */
  static toEntityFromCreateDto(dto: CreateSupplierRequestDto): Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      name: dto.name,
      contactPerson: dto.contact_person,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      specialization: dto.specialization,
      rating: 0,
      isActive: true
    };
  }

  /**
   * Transform UpdateSupplierRequestDto to partial domain entity
   */
  static toEntityFromUpdateDto(dto: UpdateSupplierRequestDto): Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>> {
    return {
      name: dto.name,
      contactPerson: dto.contact_person,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      specialization: dto.specialization,
      rating: dto.rating,
      isActive: dto.is_active
    };
  }

  /**
   * Transform domain entity to database row
   */
  static toDatabaseRow(supplier: Supplier): any {
    return {
      id: supplier.id,
      name: supplier.name,
      contact_person: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      specialization: supplier.specialization,
      rating: supplier.rating,
      is_active: supplier.isActive,
      created_at: supplier.createdAt,
      updated_at: supplier.updatedAt
    };
  }

  /**
   * Transform database row to domain entity
   */
  static toEntityFromDatabaseRow(row: any): Supplier {
    return {
      id: row.id,
      name: row.name,
      contactPerson: row.contact_person,
      email: row.email,
      phone: row.phone,
      address: row.address,
      specialization: row.specialization,
      rating: row.rating || 0,
      isActive: row.is_active ?? true,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Transform array of domain entities to DTOs
   */
  static toDTOs(suppliers: Supplier[]): SupplierDTO[] {
    return suppliers.map(supplier => this.toDTO(supplier));
  }

  /**
   * Transform array of DTOs to domain entities
   */
  static toEntities(dtos: SupplierDTO[]): Supplier[] {
    return dtos.map(dto => this.toEntity(dto));
  }
}
