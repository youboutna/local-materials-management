/**
 * Material Transformer - Hexagonal Architecture
 * Transforms between Material entities and DTOs
 * Following clean architecture principles with proper separation of concerns
 * Includes BTP calculations and business logic from MaterialDomainTransformer
 */

import { Material } from '@/domain/entities/Material';
import { MaterialDTO, MaterialDetailDTO, MaterialSummaryDTO, MaterialListItemDTO, CreateMaterialRequestDto, UpdateMaterialRequestDto } from '@/dtos/transforms/shared';
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
   * Transform Material entity to MaterialDTO (Domain Entity → DTO)
   * Converts domain entity to data transfer object for UI layer
   * Following hexagonal architecture: Domain → Application → Presentation
   */
  static toDTO(entity: Material): MaterialDTO {
    const stockMetrics = this.calculateStockMetrics(entity);
    const costAnalysis = this.calculateCostAnalysis(entity);
    const qualityMetrics = this.calculateQualityMetrics(entity);
    
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description || '',
      type: entity.type,
      category: entity.category,
      unit: entity.unit,
      quantity: entity.quantity,
      unitPrice: entity.unitPrice,
      totalPrice: entity.totalPrice || (entity.quantity * entity.unitPrice),
      supplierId: entity.supplierId,
      projectId: entity.projectId,
      phaseId: entity.phaseId,
      taskId: entity.taskId,
      
      // Enriched fields from MaterialDomainTransformer
      stockMetrics,
      costAnalysis,
      qualityMetrics,
      
      // BTP specific fields
      specifications: entity.specifications || {},
      brand: entity.brand || '',
      model: entity.model || '',
      reference: entity.reference || '',
      quality: entity.quality || 'standard',
      availability: entity.availability || 'available',
      deliveryTime: entity.deliveryTime || 0,
      storageLocation: entity.storageLocation || '',
      
      // Additional BTP fields from MaterialDomainTransformer
      currentStock: entity.currentStock || 0,
      minStock: entity.minStock || 0,
      maxStock: entity.maxStock || 0,
      dimensions: entity.dimensions || { length: 0, width: 0, height: 0, thickness: 0 },
      weight: entity.weight || 0,
      density: entity.density || 0,
      supplierName: entity.supplierName || '',
      leadTime: entity.leadTime || 0,
      qualityCertificate: entity.qualityCertificate || '',
      complianceStandards: entity.complianceStandards || [],
      dailyUsage: entity.dailyUsage || 0,
      monthlyUsage: entity.monthlyUsage || 0,
      lastUsed: entity.lastUsed || null,
      expectedCost: entity.expectedCost || 0,
      actualCost: entity.actualCost || 0,
      costVariance: entity.costVariance || 0,
      storageConditions: entity.storageConditions || '',
      
      // Metadata
      createdAt: entity.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: entity.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Transform MaterialDTO to Material entity (DTO → Domain Entity)
   * Converts data transfer object to domain entity
   * Following hexagonal architecture: Presentation → Application → Domain
   */
  static toEntity(dto: MaterialDTO): Material {
    return new Material(
      dto.id,
      dto.name,
      dto.type,
      dto.category,
      dto.unit,
      dto.quantity,
      dto.unitPrice,
      dto.supplierId,
      dto.projectId,
      dto.description,
      dto.phaseId,
      dto.taskId,
      // Additional fields
      dto.specifications || {},
      dto.brand || '',
      dto.model || '',
      dto.reference || '',
      dto.quality || 'standard',
      dto.availability || 'available',
      dto.deliveryTime || 0,
      dto.storageLocation || '',
      dto.createdAt ? new Date(dto.createdAt) : new Date(),
      dto.updatedAt ? new Date(dto.updatedAt) : new Date()
    );
  }

  /**
   * Transform CreateMaterialRequestDto to Material entity
   * Enhanced with BTP-specific fields from MaterialDomainTransformer
   */
  static fromCreateDtoToEntity(dto: CreateMaterialRequestDto): Material {
    return Material.create({
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      category: dto.category || '',
      unit: dto.unit || 'unit',
      currentStock: dto.currentStock || 0,
      minStock: dto.minStock || 0,
      maxStock: dto.maxStock || 0,
      unitCost: dto.unitCost || 0,
      
      // BTP specific fields
      specifications: dto.specifications || '',
      dimensions: dto.dimensions || { length: 0, width: 0, height: 0, thickness: 0 },
      weight: dto.weight || 0,
      density: dto.density || 0,
      
      // Supplier information
      supplierId: dto.supplierId || '',
      supplierName: dto.supplierName || '',
      leadTime: dto.leadTime || 0,
      
      // Quality and compliance
      qualityCertificate: dto.qualityCertificate || '',
      complianceStandards: dto.complianceStandards || [],
      
      // Usage tracking
      dailyUsage: dto.dailyUsage || 0,
      monthlyUsage: dto.monthlyUsage || 0,
      
      // Cost tracking
      expectedCost: dto.expectedCost || 0,
      
      // Location information
      storageLocation: dto.storageLocation || '',
      storageConditions: dto.storageConditions || '',
      
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Transform UpdateMaterialRequestDto to partial Material entity
   */
  static fromUpdateDtoToEntity(dto: UpdateMaterialRequestDto): Partial<Material> {
    return {
      name: dto.name,
      description: dto.description,
      category: dto.category,
      unit: dto.unit,
      currentStock: dto.currentStock,
      minStock: dto.minStock,
      maxStock: dto.maxStock,
      unitCost: dto.unitCost,
      
      // BTP specific fields
      specifications: dto.specifications,
      dimensions: dto.dimensions,
      weight: dto.weight,
      density: dto.density,
      
      // Supplier information
      supplierId: dto.supplierId,
      supplierName: dto.supplierName,
      leadTime: dto.leadTime,
      
      // Quality and compliance
      qualityCertificate: dto.qualityCertificate,
      complianceStandards: dto.complianceStandards,
      
      // Usage tracking
      dailyUsage: dto.dailyUsage,
      monthlyUsage: dto.monthlyUsage,
      
      // Cost tracking
      expectedCost: dto.expectedCost,
      actualCost: dto.actualCost,
      costVariance: dto.costVariance,
      
      // Location information
      storageLocation: dto.storageLocation,
      storageConditions: dto.storageConditions,
      
      // Metadata
      updatedAt: new Date()
    };
  }

  /**
   * Validate material data for business rules
   * BTP-specific validation logic
   */
  static validateMaterialData(material: Partial<Material>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate required fields
    if (!material.name || material.name.trim() === '') {
      errors.push('Material name is required');
    }
    
    if (!material.category || material.category.trim() === '') {
      errors.push('Material category is required');
    }
    
    if (material.unitCost !== undefined && material.unitCost <= 0) {
      errors.push('Unit cost must be greater than 0');
    }
    
    if (material.currentStock !== undefined && material.currentStock < 0) {
      errors.push('Current stock cannot be negative');
    }
    
    if (material.minStock !== undefined && material.maxStock !== undefined && material.minStock > material.maxStock) {
      errors.push('Minimum stock cannot be greater than maximum stock');
    }
    
    // Validate BTP specific fields
    if (material.weight !== undefined && material.weight <= 0) {
      errors.push('Material weight must be greater than 0');
    }
    
    if (material.density !== undefined && material.density <= 0) {
      errors.push('Material density must be greater than 0');
    }
    
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

  toEntitiesFromDatabaseRows(rows: Record<string, unknown>[]): Material[] {
    return rows.map(row => MaterialTransformer.toEntityFromDatabaseRow(row));
  }

  toEntityFromDatabaseRow(row: Record<string, unknown>): Material {
    // Implementation for database row to entity transformation
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
  }
}
