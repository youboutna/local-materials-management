/**
 * Supplier Transformer - Hexagonal Architecture
 * Transforms between Supplier entities and DTOs
 * 
 * KEY RULE: Never call `new Supplier()` — always use `Supplier.create(props)`
 * This ensures domain entities are decoupled from infrastructure
 */

import { Supplier, SupplierCategory, SupplierStatus, SupplierProps } from '@/domain/entities/Supplier';
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

export interface SearchSuppliersOptions { limit?: number; }
export interface SearchSuppliersResult { suppliers: SupplierDTO[]; total: number; }

export class SupplierTransformer implements EntityToDTOMapper<Supplier, SupplierDTO> {

  // =================== DATABASE ↔ DOMAIN ===================

  /**
   * Supabase Row (snake_case) → Domain Entity via Props
   * This is the ONLY method adapters should use
   */
  static fromDatabaseRow(row: Record<string, unknown>): Supplier {
    const props: SupplierProps = {
      id: row.id as string,
      name: row.name as string,
      email: (row.email as string) || null,
      phone: (row.phone as string) || null,
      address: (row.address as string) || null,
      nif: (row.nif as string) || null,
      category: (row.category as SupplierCategory) || null,
      status: (row.is_active ? 'active' : 'inactive') as SupplierStatus,
      rating: row.rating ? {
        quality: Number(row.rating),
        delivery: Number(row.rating),
        price: Number(row.rating),
        communication: Number(row.rating),
        overall: Number(row.rating)
      } : null,
      contacts: [],
      isVerified: Boolean(row.is_verified) || false,
      verifiedAt: (row.verified_at as string) || null,
      workspaceId: (row.workspace_id as string) || (row.user_id as string) || null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string
    };
    return Supplier.create(props);
  }

  /**
   * Domain Entity → Supabase Insert/Update Object (snake_case)
   */
  static toSupabase(entity: Supplier): Record<string, unknown> {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      address: entity.address,
      nif: entity.nif,
      category: entity.category,
      is_active: entity.status === 'active',
      rating: entity.rating?.overall,
      user_id: entity.workspaceId,
    };
  }

  // Legacy alias
  static toEntityFromDatabaseRow(row: Record<string, unknown>): Supplier {
    return this.fromDatabaseRow(row);
  }

  // =================== DOMAIN ↔ DTO ===================

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
      updatedAt: entity.updatedAt,
      accountNumber: undefined,
      bankName: undefined,
      defaultPasswordResetRequired: undefined,
      rib: undefined,
      userId: undefined,
    };
  }

  static toEntity(dto: SupplierDTO): Supplier {
    return Supplier.create({
      id: dto.id,
      name: dto.name,
      email: dto.email || null,
      phone: dto.phone || null,
      address: dto.address || null,
      nif: dto.nif || null,
      category: dto.category as SupplierCategory || null,
      status: dto.isActive ? 'active' : 'inactive',
      rating: dto.rating ? {
        quality: dto.rating, delivery: dto.rating, price: dto.rating, communication: dto.rating, overall: dto.rating
      } : null,
      contacts: dto.contactPerson ? [{ name: dto.contactPerson, email: dto.email || '', phone: dto.phone || '' }] : [],
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    });
  }

  static toLegacyDTO(entity: Supplier): SupplierLegacyDTO {
    return {
      id: entity.id, name: entity.name,
      contact_person: entity.contacts[0]?.name || undefined,
      email: entity.email || undefined, phone: entity.phone || undefined
    };
  }

  static fromLegacyDTO(dto: SupplierLegacyDTO): Supplier {
    return Supplier.create({
      id: dto.id, name: dto.name,
      email: dto.email || null, phone: dto.phone || null,
      contacts: dto.contact_person ? [{ name: dto.contact_person, email: dto.email || '', phone: dto.phone || '' }] : [],
    });
  }

  static toDTOList(entities: Supplier[]): SupplierDTO[] { return entities.map(entity => this.toDTO(entity)); }
  static toEntityList(dtos: SupplierDTO[]): Supplier[] { return dtos.map(dto => this.toEntity(dto)); }

  // EntityToDTOMapper interface implementation
  toDTO(entity: Supplier): SupplierDTO { return SupplierTransformer.toDTO(entity); }
  fromDTO(dto: SupplierDTO): Supplier { return SupplierTransformer.toEntity(dto); }
  fromEntityToDTO(entity: Supplier): SupplierDTO { return SupplierTransformer.toDTO(entity); }
  fromDtosToAdapter(dtos: SupplierDTO[]): Record<string, unknown>[] {
    return dtos.map(dto => ({
      id: dto.id, name: dto.name, email: dto.email, phone: dto.phone,
      address: dto.address, contact_person: dto.contactPerson, category: dto.category,
      rating: dto.rating, is_active: dto.isActive, nif: dto.nif,
      commerce_register_ref: dto.commerceRegisterRef,
      account_number: dto.accountNumber, bank_name: dto.bankName,
      default_password_reset_required: dto.defaultPasswordResetRequired,
      rib: dto.rib, user_id: dto.userId,
      created_at: dto.createdAt, updated_at: dto.updatedAt,
    }));
  }
  toResponseDto(entity: Supplier): SupplierDTO { return SupplierTransformer.toDTO(entity); }
  toRequestDto(dto: SupplierDTO): SupplierDTO { return dto; }
  toUpdateDto(dto: SupplierDTO): Partial<SupplierDTO> {
    return {
      name: dto.name, email: dto.email, phone: dto.phone, address: dto.address,
      contactPerson: dto.contactPerson, category: dto.category, rating: dto.rating,
      isActive: dto.isActive, nif: dto.nif, commerceRegisterRef: dto.commerceRegisterRef,
      accountNumber: dto.accountNumber, bankName: dto.bankName,
      defaultPasswordResetRequired: dto.defaultPasswordResetRequired, rib: dto.rib, userId: dto.userId,
    };
  }
  validate(dto: SupplierDTO): ValidationResult {
    const errors: string[] = [];
    if (!dto.name || dto.name.trim() === '') errors.push('Supplier name is required');
    if (dto.email && !dto.email.includes('@')) errors.push('Invalid email format');
    if (dto.rating && (dto.rating < 0 || dto.rating > 5)) errors.push('Rating must be between 0 and 5');
    return { isValid: errors.length === 0, errors };
  }
  toDTOs(entities: Supplier[]): SupplierDTO[] { return entities.map(entity => SupplierTransformer.toDTO(entity)); }
  toEntities(dtos: SupplierDTO[]): Supplier[] { return dtos.map(dto => SupplierTransformer.toEntity(dto)); }
  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Supplier[] { return rows.map(row => SupplierTransformer.fromDatabaseRow(row)); }

  static validateSearchOptions(options: SearchSuppliersOptions): ValidationResult {
    const errors: string[] = [];
    if (options.limit && options.limit < 0) errors.push('Limit must be positive');
    return { isValid: errors.length === 0, errors };
  }

  static toSearchResultDTO(entities: Supplier[], total: number): SearchSuppliersResult {
    return { suppliers: this.toDTOList(entities), total };
  }

  static toSummaryDTO(entity: Supplier): SupplierSummaryDTO {
    return { id: entity.id, name: entity.name, category: entity.category || undefined, isActive: entity.status === 'active', rating: entity.rating?.overall || undefined };
  }

  static toSummaryDTOList(entities: Supplier[]): SupplierSummaryDTO[] {
    return entities.map(entity => this.toSummaryDTO(entity));
  }
}
