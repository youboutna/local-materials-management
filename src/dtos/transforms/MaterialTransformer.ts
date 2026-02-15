/**
 * Material Transformer - Hexagonal Architecture
 * Transforms between Material entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * Includes BTP calculations and business logic from MaterialDomainTransformer
 */

import { Material } from '@/domain/entities/Material';
import { MaterialDTO, MaterialDetailDTO, MaterialSummaryDTO, MaterialListItemDTO, CreateMaterialRequestDto, UpdateMaterialRequestDto, MaterialUIDTO } from '@/dtos/transforms/shared';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';
export class MaterialTransformer implements EntityToDTOMapper<Material, MaterialDTO> {
  /**
   * Calculate material stock metrics
   * BTP-specific business logic for inventory management
   */
  static calculateStockMetrics(material: Material): {
    currentStock: number;
    minStock: number;
    maxStock: number;
    stockStatus: 'optimal' | 'low' | 'critical' | 'out_of_stock';
    reorderPoint: number;
    stockTurnover: number;
    daysUntilReorder: number;
  } {
    const currentStock = material.currentStock || 0;
    const minStock = material.minStock || 0;
    const maxStock = material.maxStock || 0;
    
    // Determine stock status
    let stockStatus: 'optimal' | 'low' | 'critical' | 'out_of_stock' = 'optimal';
    if (currentStock <= minStock) {
      stockStatus = 'critical';
    } else if (currentStock <= minStock * 0.2) {
      stockStatus = 'low';
    } else if (currentStock <= minStock * 0.5) {
      stockStatus = 'out_of_stock';
    }
    
    // Calculate reorder point (when to reorder)
    const reorderPoint = minStock * 1.2; // 20% above minimum
    
    // Calculate days until reorder
    const daysUntilReorder = reorderPoint > currentStock ? 
      Math.ceil((reorderPoint - currentStock) / (material.dailyUsage || 1)) : 0;
    
    // Calculate stock turnover (annual)
    const stockTurnover = material.dailyUsage ? 
      (material.dailyUsage * 365) / ((currentStock + maxStock) / 2) : 0;
    
    return {
      currentStock,
      minStock,
      maxStock,
      stockStatus,
      reorderPoint,
      stockTurnover,
      daysUntilReorder
    };
  }

  /**
   * Calculate material cost analysis
   * BTP-specific cost tracking and variance analysis
   */
  static calculateCostAnalysis(material: Material): {
    unitCost: number;
    totalValue: number;
    costPerUnit: number;
    costVariance: number;
    efficiency: number;
  } {
    const unitCost = material.unitCost || 0;
    const currentStock = material.currentStock || 0;
    const totalValue = unitCost * currentStock;
    const costPerUnit = unitCost;
    
    // Calculate cost variance (if we have expected vs actual cost)
    const expectedCost = material.expectedCost || 0;
    const costVariance = expectedCost > 0 ? (expectedCost - unitCost) : 0;
    
    // Calculate efficiency
    const efficiency = expectedCost > 0 ? (unitCost / expectedCost) : 1;
    
    return {
      unitCost,
      totalValue,
      costPerUnit,
      costVariance,
      efficiency
    };
  }

  /**
   * Calculate material quality metrics
   * BTP-specific quality control and recommendations
   */
  static calculateQualityMetrics(material: Material): {
    qualityScore: number;
    defectRate: number;
    supplierReliability: number;
    recommendations: string[];
  } {
    const qualityScore = material.qualityScore || 100;
    const defectRate = material.defectRate || 0;
    const supplierReliability = material.supplierReliability || 100;
    
    const recommendations: string[] = [];
    
    if (defectRate > 5) {
      recommendations.push('High defect rate detected - quality control needed');
    }
    
    if (supplierReliability < 80) {
      recommendations.push('Supplier reliability below threshold - consider alternative suppliers');
    }
    
    if (qualityScore < 70) {
      recommendations.push('Quality score below acceptable - review material specifications');
    }
    
    return {
      qualityScore,
      defectRate,
      supplierReliability,
      recommendations
    };
  }

  /**
   * Safely convert a value to ISO string
   * Handles Date objects, string dates, and undefined/null values
   */
  private static safeToISOString(date: Date | string | null | undefined): string | undefined {
    if (!date) return undefined;
    if (date instanceof Date) {
      return date.toISOString();
    }
    if (typeof date === 'string') {
      const parsedDate = new Date(date);
      return isNaN(parsedDate.getTime()) ? undefined : parsedDate.toISOString();
    }
    return undefined;
  }

  /**
   * Transform Material entity to MaterialDTO (Domain → DTO)
   * Converts domain entity to data transfer object
   * Following hexagonal architecture: Domain → Application → Presentation
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
      description: entity.description || '',
      type: entity.type,
      category: typeof entity.category === 'string' ? entity.category : (entity.category as any)?.id || 'construction',
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
      isValid: errors.length === 0,
      errors
    };
  }

  // EntityToDTOMapper interface implementation
  toDTO(entity: Material): MaterialDTO {
    return MaterialTransformer.toDTO(entity);
  }

  fromDTO(dto: MaterialDTO): Material {
    return MaterialTransformer.toEntity(dto);
  }

  fromEntityToDTO(entity: Material): MaterialDTO {
    return MaterialTransformer.toDTO(entity);
  }

  toResponseDto(entity: Material): MaterialDTO {
    return MaterialTransformer.toDTO(entity);
  }

  validate(dto: MaterialDTO): ValidationResult {
    const material = MaterialTransformer.toEntity(dto);
    const validation = MaterialTransformer.validateMaterialData(material);
    return {
      isValid: validation.isValid,
      errors: validation.errors
    };
  }

  toDTOs(entities: Material[]): MaterialDTO[] {
    return entities.map(entity => MaterialTransformer.toDTO(entity));
  }

  toEntities(dtos: MaterialDTO[]): Material[] {
    return dtos.map(dto => MaterialTransformer.toEntity(dto));
  }

  /**
   * Transform database row to Material entity
   * Used for database query results
   */
  static toEntityFromDatabaseRow(row: Record<string, unknown>): Material {
    return Material.create({
      id: row.id as string,
      name: row.name as string,
      description: row.description as string,
      category: row.category as string, // Cast to string, will be validated by Material.create
      unit: row.unit as string,
      currentStock: Number(row.current_stock) || 0,
      minStock: Number(row.min_stock) || 0,
      maxStock: Number(row.max_stock) || 0,
      unitCost: Number(row.unit_cost) || 0,
      // ... map other fields
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string)
    });
      isValid: Material.validate(data as any).length === 0,
      errors: Material.validate(data as any),
    };
  }

  /**
   * Transform MaterialDTO to MaterialUIDTO (DTO → UI DTO)
   * Converts domain DTO to UI-appropriate format
   * Following RULE #4: UI should use appropriate DTOs
   */
  static toUIDTO(dto: MaterialDTO): MaterialUIDTO {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description || '',
      category: typeof dto.category === 'string' ? dto.category : (dto.category as any)?.id || 'construction',
      unit: typeof dto.unit === 'string' ? dto.unit : dto.unit.toString(),
      quantity: dto.quantity,
      pricePerUnit: dto.pricePerUnit,
      availableQuantity: dto.quantity, // Map to available quantity for UI
      image: dto.images?.[0] || undefined, // Take first image
      originLocation: dto.location || undefined,
      coordinatesLatitude: undefined, // Will be set from additional data
      coordinatesLongitude: undefined, // Will be set from additional data
      forme: undefined, // Will be set from additional data
      adresse: undefined, // Will be set from additional data
      localisation: dto.location || undefined,
      isActive: true, // Default for UI
      minimumQuantity: dto.reorderLevel || undefined,
      localType: undefined, // Will be set from additional data
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt
    };
  }
