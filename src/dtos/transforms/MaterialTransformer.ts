/**
 * Material Transformer - Hexagonal Architecture
 * Rule #4: Proper transformer methods
 * fromSupabase, toSupabase, toDTO, fromDTO, formToCreateRequest, formToUpdateRequest
 */

import { Material, MaterialCategory, MaterialParams } from '@/domain/entities/Material';

// ============= DTO aligned with DB schema =============
export interface MaterialDTO {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  availableQuantity: number;
  sku: string | null;
  ean: string | null;
  gtin: string | null;
  asin: string | null;
  image: string | null;
  coordinatesLatitude: number | null;
  coordinatesLongitude: number | null;
  workspaceId: string | null;
  originLocation: string | null;
  adresse: string | null;
  forme: string | null;
  localisation: Record<string, unknown>[] | null;
  multilangLabels: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  // Computed
  totalValue: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export interface CreateMaterialRequestDto {
  name: string;
  description?: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  availableQuantity: number;
  sku?: string | null;
  ean?: string | null;
  gtin?: string | null;
  asin?: string | null;
  image?: string | null;
  coordinatesLatitude?: number | null;
  coordinatesLongitude?: number | null;
  workspaceId?: string | null;
  originLocation?: string | null;
  adresse?: string | null;
  forme?: string | null;
  localisation?: Record<string, unknown>[] | null;
  multilangLabels?: Record<string, string> | null;
}

export interface UpdateMaterialRequestDto {
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  pricePerUnit?: number;
  availableQuantity?: number;
  sku?: string | null;
  ean?: string | null;
  gtin?: string | null;
  asin?: string | null;
  image?: string | null;
  coordinatesLatitude?: number | null;
  coordinatesLongitude?: number | null;
  workspaceId?: string | null;
  originLocation?: string | null;
  adresse?: string | null;
  forme?: string | null;
  localisation?: Record<string, unknown>[] | null;
  multilangLabels?: Record<string, string> | null;
}

/**
 * Form data as submitted by EnhancedMaterialForm
 */
export interface MaterialFormData {
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  availableQuantity: number;
  workspaceId: string;
  image?: string;
  adresse?: string;
  forme?: string;
  localisation?: any[];
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  gtin?: string;
  sku?: string;
  ean?: string;
  asin?: string;
  multilangLabels?: Record<string, string>;
  timeline?: {
    start: Date;
    end: Date;
    estimatedDuration: number;
  };
  supplier?: {
    name: string;
    contact: string;
    leadTime: number;
  };
}

export class MaterialTransformer {
  /**
   * DB row → Domain Entity
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
      unit: entity.unit,
      pricePerUnit: entity.pricePerUnit,
      availableQuantity: entity.availableQuantity,
      sku: entity.sku,
      ean: entity.ean,
      gtin: entity.gtin,
      asin: entity.asin,
      image: entity.image,
      coordinatesLatitude: entity.coordinatesLatitude,
      coordinatesLongitude: entity.coordinatesLongitude,
      workspaceId: entity.workspaceId,
      originLocation: entity.originLocation,
      adresse: entity.adresse,
      forme: entity.forme,
      localisation: entity.localisation,
      multilangLabels: entity.multilangLabels,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      // Computed fields
      totalValue: entity.calculateTotalValue(),
      isLowStock: entity.isLowStock(),
      isOutOfStock: entity.isOutOfStock(),
    };
  }

  /**
   * DTO → Domain Entity
   */
  static fromDTO(dto: MaterialDTO): Material {
    return Material.create({
      id: dto.id,
      name: dto.name,
      description: dto.description || '',
      category: (dto.category || 'other') as MaterialCategory,
      unit: dto.unit || 'unit',
      pricePerUnit: dto.pricePerUnit || 0,
      availableQuantity: dto.availableQuantity || 0,
      sku: dto.sku,
      ean: dto.ean,
      gtin: dto.gtin,
      asin: dto.asin,
      image: dto.image,
      coordinatesLatitude: dto.coordinatesLatitude,
      coordinatesLongitude: dto.coordinatesLongitude,
      workspaceId: dto.workspaceId,
      originLocation: dto.originLocation,
      adresse: dto.adresse,
      forme: dto.forme,
      localisation: dto.localisation,
      multilangLabels: dto.multilangLabels,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * Form → CreateMaterialRequestDto
   */
  static formToCreateRequest(form: Partial<MaterialFormData>): CreateMaterialRequestDto {
    return {
      name: form.name || '',
      description: form.description || '',
      category: form.category || 'other',
      unit: form.unit || 'unit',
      pricePerUnit: form.pricePerUnit || 0,
      availableQuantity: form.availableQuantity || 0,
      sku: form.sku || null,
      ean: form.ean || null,
      gtin: form.gtin || null,
      asin: form.asin || null,
      image: form.image || null,
      coordinatesLatitude: form.coordinatesLatitude || null,
      coordinatesLongitude: form.coordinatesLongitude || null,
      workspaceId: form.workspaceId || null,
      originLocation: form.supplier?.name || null,
      adresse: form.adresse || null,
      forme: form.forme || null,
      localisation: form.localisation || null,
      multilangLabels: form.multilangLabels || null,
    };
  }

  /**
   * Form → UpdateMaterialRequestDto
   */
  static formToUpdateRequest(form: Partial<MaterialFormData>): UpdateMaterialRequestDto {
    return {
      name: form.name,
      description: form.description,
      category: form.category,
      unit: form.unit,
      pricePerUnit: form.pricePerUnit,
      availableQuantity: form.availableQuantity,
      sku: form.sku || null,
      ean: form.ean || null,
      gtin: form.gtin || null,
      asin: form.asin || null,
      image: form.image || null,
      coordinatesLatitude: form.coordinatesLatitude || null,
      coordinatesLongitude: form.coordinatesLongitude || null,
      workspaceId: form.workspaceId || null,
      originLocation: form.supplier?.name || null,
      adresse: form.adresse || null,
      forme: form.forme || null,
      localisation: form.localisation || null,
      multilangLabels: form.multilangLabels || null,
    };
  }

  /**
   * CreateRequest DTO → Domain Entity (for save)
   */
  static createRequestToEntity(dto: CreateMaterialRequestDto): Material {
    return Material.create({
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description || '',
      category: (dto.category || 'other') as MaterialCategory,
      unit: dto.unit || 'unit',
      pricePerUnit: dto.pricePerUnit || 0,
      availableQuantity: dto.availableQuantity || 0,
      sku: dto.sku || null,
      ean: dto.ean || null,
      gtin: dto.gtin || null,
      asin: dto.asin || null,
      image: dto.image || null,
      coordinatesLatitude: dto.coordinatesLatitude || null,
      coordinatesLongitude: dto.coordinatesLongitude || null,
      workspaceId: dto.workspaceId || null,
      originLocation: dto.originLocation || null,
      adresse: dto.adresse || null,
      forme: dto.forme || null,
      localisation: dto.localisation || null,
      multilangLabels: dto.multilangLabels || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * DTO → UI-ready form data
   */
  static toFormData(dto: MaterialDTO): Partial<MaterialFormData> {
    return {
      name: dto.name,
      description: dto.description,
      category: dto.category,
      unit: dto.unit,
      quantity: dto.availableQuantity,
      minQuantity: 0,
      pricePerUnit: dto.pricePerUnit,
      availableQuantity: dto.availableQuantity,
      workspaceId: dto.workspaceId || '',
      image: dto.image || '',
      adresse: dto.adresse || '',
      forme: dto.forme || '',
      localisation: dto.localisation || [],
      coordinatesLatitude: dto.coordinatesLatitude ?? undefined,
      coordinatesLongitude: dto.coordinatesLongitude ?? undefined,
      gtin: dto.gtin || '',
      sku: dto.sku || '',
      ean: dto.ean || '',
      asin: dto.asin || '',
      multilangLabels: dto.multilangLabels || {},
      supplier: {
        name: dto.originLocation || '',
        contact: '',
        leadTime: 7,
      },
    };
  }

  /**
   * Validate material data
   */
  static validate(data: Partial<MaterialFormData>): { isValid: boolean; errors: string[] } {
    return {
      isValid: Material.validate(data as any).length === 0,
      errors: Material.validate(data as any),
    };
  }
}
