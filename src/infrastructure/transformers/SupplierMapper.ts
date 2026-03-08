// @ts-nocheck
/**
 * Supplier Mapper / Transformer
 * Maps between Supabase data, Domain entities, and DTOs
 * Following hexagonal architecture principles
 */

import { Supplier, SupplierStatus, SupplierCategory } from '@/domain/entities/Supplier';

// DTOs d'API (Adapter Layer)
export class SupplierResponseDto {
  constructor(
    public id: string,
    public name: string,
    public email?: string,
    public phone?: string,
    public address?: string,
    public nif?: string,
    public category: SupplierCategory,
    public status: SupplierStatus,
    public rating?: number,
    public contacts: SupplierContact[],
    public isVerified: boolean,
    public verifiedAt?: string,
    public workspaceId: string,
    public createdAt: string,
    public updatedAt: string
  ) {}
}

export class CreateSupplierRequestDto {
  constructor(
    public name: string,
    public email?: string,
    public phone?: string,
    public address?: string,
    public nif?: string,
    public category: SupplierCategory,
    public rating?: number,
    public contacts?: SupplierContact[],
    public workspaceId: string
  ) {}
}

export class UpdateSupplierRequestDto {
  constructor(
    public name?: string,
    public email?: string,
    public phone?: string,
    public address?: string,
    public nif?: string,
    public category?: SupplierCategory,
    public status?: SupplierStatus,
    public rating?: number,
    public contacts?: SupplierContact[],
    public isVerified?: boolean
  ) {}
}

export interface SupplierContact {
  name: string;
  email?: string;
  phone?: string;
  position?: string;
}

// Transformer/Mapper (Adapter Layer)
export class SupplierMapper {
  /**
   * Transforme les données brutes Supabase vers l'entité du domaine
   */
  static toDomain(supabaseSupplier: any): Supplier {
    return new Supplier(
      supabaseSupplier.id,
      supabaseSupplier.name,
      supabaseSupplier.email || null,
      supabaseSupplier.phone || null,
      supabaseSupplier.address || null,
      supabaseSupplier.nif || null,
      supabaseSupplier.category as SupplierCategory,
      supabaseSupplier.status as SupplierStatus,
      supabaseSupplier.rating || null,
      supabaseSupplier.contacts || [],
      supabaseSupplier.is_verified || false,
      supabaseSupplier.verified_at || null,
      supabaseSupplier.workspace_id,
      supabaseSupplier.created_at,
      supabaseSupplier.updated_at
    );
  }

  /**
   * Transforme l'entité du domaine vers le DTO de réponse API
   */
  static toResponseDto(supplier: Supplier): SupplierResponseDto {
    return new SupplierResponseDto(
      supplier.id,
      supplier.name,
      supplier.email,
      supplier.phone,
      supplier.address,
      supplier.nif,
      supplier.category,
      supplier.status,
      supplier.rating,
      supplier.contacts,
      supplier.isVerified,
      supplier.verifiedAt,
      supplier.workspaceId,
      supplier.createdAt,
      supplier.updatedAt
    );
  }

  /**
   * Transforme le DTO de requête vers l'entité du domaine
   */
  static toDomainFromCreateDto(requestDto: CreateSupplierRequestDto): Supplier {
    return new Supplier(
      crypto.randomUUID(), // ID généré
      requestDto.name,
      requestDto.email || null,
      requestDto.phone || null,
      requestDto.address || null,
      requestDto.nif || null,
      requestDto.category,
      'active' as SupplierStatus, // Statut initial
      requestDto.rating || null,
      requestDto.contacts || [],
      false, // isVerified initial
      null, // verifiedAt initial
      requestDto.workspaceId,
      new Date().toISOString(),
      new Date().toISOString()
    );
  }

  /**
   * Transforme le DTO de mise à jour vers les données partielles de l'entité
   */
  static toUpdateData(requestDto: UpdateSupplierRequestDto): Partial<Supplier> {
    return {
      name: requestDto.name,
      email: requestDto.email,
      phone: requestDto.phone,
      address: requestDto.address,
      nif: requestDto.nif,
      category: requestDto.category,
      status: requestDto.status,
      rating: requestDto.rating,
      contacts: requestDto.contacts,
      isVerified: requestDto.isVerified,
      updatedAt: new Date().toISOString()
    } as Partial<Supplier>;
  }

  /**
   * Transforme un tableau de données Supabase vers les entités du domaine
   */
  static toDomainArray(supabaseSuppliers: any[]): Supplier[] {
    return supabaseSuppliers.map(supplier => SupplierMapper.toDomain(supplier));
  }

  /**
   * Transforme un tableau d'entités du domaine vers les DTOs de réponse
   */
  static toResponseDtoArray(suppliers: Supplier[]): SupplierResponseDto[] {
    return suppliers.map(supplier => SupplierMapper.toResponseDto(supplier));
  }
}
