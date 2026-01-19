/**
 * Material Domain Transformer with BTP Calculations and Business Logic
 * Implements hexagonal architecture principles with enriched calculations
 * Flow: UI => Supabase/API => Database | Database => Supabase/API => UI
 */

import { Material } from '@/domain/entities/Material';
import { MaterialDTO, MaterialDetailDTO, MaterialSummaryDTO, MaterialListItemDTO, CreateMaterialRequestDto, UpdateMaterialRequestDto } from '@/dtos/transforms/shared';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms/shared';

export class MaterialDomainTransformer implements EntityToDTOMapper<Material, MaterialDTO> {
  /**
   * Calculate material stock metrics
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
    let stockStatus: 'optimal';
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
   * Transform Material entity to MaterialDTO
   */
  static toResponseDto(material: Material): MaterialDTO {
    const stockMetrics = this.calculateStockMetrics(material);
    const costAnalysis = this.calculateCostAnalysis(material);
    const qualityMetrics = this.calculateQualityMetrics(material);
    
    return {
      id: material.id,
      name: material.name,
      description: material.description || '',
      category: material.category || '',
      unit: material.unit || 'unit',
      currentStock: material.currentStock || 0,
      minStock: material.minStock || 0,
      maxStock: material.maxStock || 0,
      unitCost: material.unitCost || 0,
      
      // Enriched fields
      stockMetrics,
      costAnalysis,
      qualityMetrics,
      
      // BTP specific fields
      specifications: material.specifications || '',
      dimensions: material.dimensions || { length: 0, width: 0, height: 0, thickness: 0 },
      weight: material.weight || 0,
      density: material.density || 0,
      
      // Supplier information
      supplierId: material.supplierId || '',
      supplierName: material.supplierName || '',
      leadTime: material.leadTime || 0,
      
      // Quality and compliance
      qualityCertificate: material.qualityCertificate || '',
      complianceStandards: material.complianceStandards || [],
      
      // Usage tracking
      dailyUsage: material.dailyUsage || 0,
      monthlyUsage: material.monthlyUsage || 0,
      lastUsed: material.lastUsed || null,
      
      // Cost tracking
      expectedCost: material.expectedCost || 0,
      actualCost: material.actualCost || 0,
      costVariance: material.costVariance || 0,
      
      // Location information
      storageLocation: material.storageLocation || '',
      storageConditions: material.storageConditions || '',
      
      // Metadata
      createdAt: material.createdAt,
      updatedAt: material.updatedAt
    };
  }

  /**
   * Transform CreateMaterialRequestDto to Material entity
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
}
