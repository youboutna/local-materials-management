// @ts-nocheck
/**
 * Supplier Mapper / Transformer (Legacy Infrastructure Layer)
 * DEPRECATED: Use SupplierTransformer from src/dtos/transforms/ instead
 * Kept for backward compatibility - delegates to SupplierTransformer
 */

import { Supplier, SupplierStatus, SupplierCategory, SupplierProps } from '@/domain/entities/Supplier';
import { SupplierTransformer } from '@/dtos/transforms/SupplierTransformer';

export interface SupplierContact {
  name: string;
  email?: string;
  phone?: string;
  position?: string;
}

export class SupplierMapper {
  static toDomain(supabaseSupplier: any): Supplier {
    return SupplierTransformer.fromDatabaseRow(supabaseSupplier);
  }

  static toDomainArray(supabaseSuppliers: any[]): Supplier[] {
    return supabaseSuppliers.map(s => SupplierTransformer.fromDatabaseRow(s));
  }

  static toResponseDto(supplier: Supplier): any {
    return SupplierTransformer.toDTO(supplier);
  }

  static toResponseDtoArray(suppliers: Supplier[]): any[] {
    return suppliers.map(s => SupplierTransformer.toDTO(s));
  }
}
