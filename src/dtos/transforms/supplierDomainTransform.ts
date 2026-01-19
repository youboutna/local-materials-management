/**
 * Supplier Domain Transformer - Consolidated & Unified
 * Implements EntityToDTOMapper interface for Supplier domain entity
 * Centralizes all supplier transformation logic following hexagonal architecture
 */

import { Supplier } from '@/domain/entities/Supplier';
import { SupplierDTO, CreateSupplierDTO, UpdateSupplierDTO } from '@/dtos/entities/SupplierDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms';

// API Request/Response DTOs for UI and Supabase integration
export class SupplierResponseDto {
  constructor(
    public id: string,
    public name: string,
    public email: string,
    public phone: string,
    public address: string,
    public contactPerson: string,
    public category: string,
    public rating: number | null,
    public isActive: boolean,
    public contacts: any[],
    public isVerified: boolean,
    public verifiedAt: string | null,
    public nif: string,
    public commerceRegisterRef: string,
    public workspaceId: string,
    public createdAt?: string,
    public updatedAt?: string
  ) {}
}

export class CreateSupplierRequestDto {
  constructor(
    public name: string,
    public email: string,
    public phone: string,
    public address: string,
    public specialization: string,
    public status: string,
    public rating?: {
      quality: number;
      delivery: number;
      price: number;
      communication: number;
      overall: number;
    },
    public isActive?: boolean,
    public contacts?: any[],
    public isVerified?: boolean,
    public verifiedAt?: string | null,
    public nif?: string,
    public registrationNumber?: string,
    public website?: string,
    public category?: string,
    public workspaceId?: string
  ) {}
}

export class UpdateSupplierRequestDto {
  constructor(
    public name?: string,
    public email?: string,
    public phone?: string,
    public address?: string,
    public specialization?: string,
    public status?: string,
    public rating?: {
      quality: number;
      delivery: number;
      price: number;
      communication: number;
      overall: number;
    },
    public isActive?: boolean,
    public contacts?: any[],
    public isVerified?: boolean,
    public verifiedAt?: string | null,
    public nif?: string,
    public registrationNumber?: string,
    public website?: string,
    public category?: string,
    public workspaceId?: string
  ) {}
}

export class SupplierDomainTransformer implements EntityToDTOMapper<Supplier, SupplierDTO> {
  
  /**
   * Transform Supplier domain entity to SupplierDTO
   */
  toDTO(entity: Supplier): SupplierDTO {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email || undefined,
      phone: entity.phone || undefined,
      address: entity.address || undefined,
      contactPerson: entity.contacts?.[0]?.name || undefined,
      category: entity.category || undefined,
      rating: entity.rating ? entity.rating.overall : undefined,
      isActive: entity.isActive(),
      nif: entity.nif || undefined,
      commerceRegisterRef: entity.nif || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform SupplierDTO to partial Supplier domain entity
   */
  fromDTO(dto: Partial<SupplierDTO>): Partial<Supplier> {
    return {
      id: dto.id,
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      nif: dto.nif,
      category: dto.category,
      status: dto.isActive !== undefined ? (dto.isActive ? 'active' : 'inactive') : undefined,
      rating: dto.rating ? {
        quality: dto.rating,
        delivery: dto.rating,
        price: dto.rating,
        communication: dto.rating,
        overall: dto.rating
      } : undefined,
      contacts: dto.contactPerson ? [{ name: dto.contactPerson, email: dto.email || '', phone: dto.phone || '', role: 'primary' }] : [],
      isVerified: dto.isVerified !== undefined ? dto.isVerified : false,
      verifiedAt: dto.verifiedAt ? new Date(dto.verifiedAt) : undefined,
      workspaceId: dto.workspaceId,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined
    };
  }

  /**
   * Transform array of SupplierDTOs to array of SupplierResponseDTOs (for UI/API)
   */
  fromDtosToAdapter(dtos: SupplierDTO[]): SupplierResponseDto[] {
    return dtos.map(dto => this.toResponseDto(dto));
  }

  /**
   * Transform single SupplierDTO to SupplierResponseDto (for UI/API)
   */
  toResponseDto(dto: SupplierDTO): SupplierResponseDto {
    return new SupplierResponseDto(
      dto.id,
      dto.name,
      dto.email || '',
      dto.phone || '',
      dto.address || '',
      dto.contactPerson || '',
      dto.category || '',
      dto.rating || null,
      dto.isActive,
      dto.contacts || [],
      dto.isVerified || false,
      dto.verifiedAt || null,
      dto.nif || '',
      dto.commerceRegisterRef || '',
      dto.workspaceId || '',
      dto.createdAt,
      dto.updatedAt
    );
  }

  /**
   * Transform CreateSupplierRequestDto to SupplierDTO
   */
  toRequestDto(requestDto: CreateSupplierRequestDto): SupplierDTO {
    return {
      id: crypto.randomUUID(),
      name: requestDto.name,
      email: requestDto.email,
      phone: requestDto.phone,
      address: requestDto.address,
      contactPerson: requestDto.contacts?.[0]?.name,
      category: requestDto.category,
      rating: requestDto.rating || {
        quality: 3,
        delivery: 3,
        price: 3,
        communication: 3,
        overall: 3
      },
      isActive: requestDto.isActive !== undefined ? requestDto.isActive : true,
      nif: requestDto.nif,
      commerceRegisterRef: requestDto.nif,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform UpdateSupplierRequestDto to partial SupplierDTO
   */
  toUpdateDto(requestDto: UpdateSupplierRequestDto): Partial<SupplierDTO> {
    return {
      name: requestDto.name,
      email: requestDto.email,
      phone: requestDto.phone,
      address: requestDto.address,
      contactPerson: requestDto.contacts?.[0]?.name,
      category: requestDto.category,
      rating: requestDto.rating,
      isActive: requestDto.isActive,
      contacts: requestDto.contacts ? [{ name: requestDto.contacts[0]?.name, email: requestDto.email, phone: requestDto.phone, role: 'primary' }] : [],
      isVerified: requestDto.isVerified,
      verifiedAt: requestDto.verifiedAt,
      nif: requestDto.nif,
      commerceRegisterRef: requestDto.nif,
      workspaceId: requestDto.workspaceId,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform Supplier domain entity to SupplierResponseDto (direct path)
   */
  fromDomainToResponseDto(entity: Supplier): SupplierResponseDto {
    const dto = this.toDTO(entity);
    return this.toResponseDto(dto);
  }

  /**
   * Validate SupplierDTO data
   */
  validate(dto: Partial<SupplierDTO>): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Name validation
    if (!dto.name || dto.name.trim() === '') {
      errors.push('Supplier name is required');
      fieldErrors.name = ['Supplier name is required'];
    }

    // Email validation
    if (dto.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      errors.push('Invalid email format');
      fieldErrors.email = ['Invalid email format'];
    }

    // Phone validation
    if (dto.phone && dto.phone.trim() === '') {
      errors.push('Supplier phone is required');
      fieldErrors.phone = ['Supplier phone is required'];
    }

    // Rating validation
    if (dto.rating && (dto.rating < 1 || dto.rating > 5)) {
      errors.push('Rating must be between 1 and 5');
      fieldErrors.rating = ['Rating must be between 1 and 5'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  // Utility methods for supplier operations
  static calculateSupplierScore(supplier: SupplierDTO): number {
    if (!supplier.rating) return 0;
    return supplier.rating; // Simple rating since DTO uses number
  }

  static isSupplierPreferred(supplier: SupplierDTO): boolean {
    return supplier.isVerified && supplier.isActive && 
           supplier.rating && supplier.rating >= 4;
  }

  static getSupplierStatus(supplier: SupplierDTO): 'preferred' | 'active' | 'inactive' | 'unverified' {
    if (!supplier.isVerified) return 'unverified';
    if (!supplier.isActive) return 'inactive';
    if (SupplierDomainTransformer.calculateSupplierScore(supplier) >= 4) return 'preferred';
    return 'active';
  }
}
