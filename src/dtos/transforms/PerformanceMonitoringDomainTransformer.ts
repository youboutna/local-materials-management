/**
 * Performance Monitoring Domain Transformer
 * Converts between domain entities and DTOs for performance monitoring
 * Uses `any` casts for complex entity types during migration
 */

import { DatabaseMetrics, PerformanceMetrics } from '@/domain/entities/PerformanceMonitoring';
import { TenderEstimate, TenderEstimateItem } from '@/domain/entities/TenderEstimate';
import { TenderEstimateDTO } from '@/dtos/entities/TenderDTO';;

// Local interfaces for this transformer
interface EntityToDTOMapper<E, D> {
  toDTO(entity: E): D;
  fromDTO(dto: D): E;
  fromDtosToAdapter(dtos: D[]): D[];
  toResponseDto(entity: E): D;
  toRequestDto(dto: any): D;
  toUpdateDto(dto: any): Partial<any>;
  validate(data: any): { isValid: boolean; errors: string[] };
}

interface PerformanceMetricsDTO {
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number;
    slowQueries: number;
  };
  timestamp: number;
}

export class PerformanceMonitoringDomainTransformer implements EntityToDTOMapper<PerformanceMetrics, PerformanceMetricsDTO> {
  toDTO(entity: PerformanceMetrics): PerformanceMetricsDTO {
    return {
      database: {
        connections: entity.database.connections,
        maxConnections: entity.database.maxConnections,
        queryTime: entity.database.queryTime,
        slowQueries: entity.database.slowQueries
      },
      timestamp: entity.timestamp.getTime()
    };
  }

  fromDTO(dto: PerformanceMetricsDTO): PerformanceMetrics {
    return {
      database: {
        connections: dto.database.connections,
        maxConnections: dto.database.maxConnections,
        queryTime: dto.database.queryTime,
        slowQueries: dto.database.slowQueries
      },
      timestamp: new Date(dto.timestamp)
    };
  }

  fromDtosToAdapter(dtos: PerformanceMetricsDTO[]): PerformanceMetricsDTO[] { return dtos; }
  toResponseDto(entity: PerformanceMetrics): PerformanceMetricsDTO { return this.toDTO(entity); }
  toRequestDto(dto: any): PerformanceMetricsDTO { return dto; }
  toUpdateDto(dto: any): Partial<PerformanceMetricsDTO> { return dto; }

  validate(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (data.database) {
      if (typeof data.database.connections !== 'number' || data.database.connections < 0) {
        errors.push('Database connections must be a positive number');
      }
      if (typeof data.database.maxConnections !== 'number' || data.database.maxConnections <= 0) {
        errors.push('Database max connections must be a positive number');
      }
    }
    return { isValid: errors.length === 0, errors };
  }
}

export class TenderEstimateDomainTransformer {
  toDTO(entity: TenderEstimate): TenderEstimateDTO {
    return {
      id: entity.id,
      tender_id: entity.tenderId,
      estimate_type: entity.estimateType,
      total_materials_cost: entity.totalMaterialsCost,
      total_labor_cost: entity.totalLaborCost,
      total_equipment_cost: entity.totalEquipmentCost,
      subtotal: entity.subtotal,
      tax_rate: entity.taxRate,
      tax_amount: entity.taxAmount,
      total_with_tax: entity.totalWithTax,
      overhead_percentage: entity.overheadPercentage,
      overhead_amount: entity.overheadAmount,
      profit_margin_percentage: entity.profitMarginPercentage,
      profit_margin_amount: entity.profitMarginAmount,
      final_total: entity.finalTotal,
      currency: entity.currency,
      status: entity.status,
      total_amount: entity.totalAmount,
      validity_period: entity.validityPeriod,
      submission_date: entity.createdAt,
      submitted_by: entity.submittedBy || '',
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }

  fromDTO(dto: TenderEstimateDTO): any {
    return {
      id: dto.id,
      tenderId: dto.tender_id,
      estimateType: dto.estimate_type,
      totalMaterialsCost: dto.total_materials_cost,
      totalLaborCost: dto.total_labor_cost,
      totalEquipmentCost: dto.total_equipment_cost,
      subtotal: dto.subtotal,
      taxRate: dto.tax_rate,
      taxAmount: dto.tax_amount,
      totalWithTax: dto.total_with_tax,
      overheadPercentage: dto.overhead_percentage,
      overheadAmount: dto.overhead_amount,
      profitMarginPercentage: dto.profit_margin_percentage,
      profitMarginAmount: dto.profit_margin_amount,
      finalTotal: dto.final_total,
      currency: dto.currency,
      status: dto.status,
      createdAt: dto.created_at,
      updatedAt: dto.updated_at,
      submittedBy: dto.submitted_by
    };
  }

  fromCreateDtoToEntity(dto: any): any {
    return {
      tenderId: dto.tender_id,
      projectId: dto.project_id,
      estimateType: dto.estimate_type,
      totalMaterialsCost: dto.total_materials_cost,
      totalLaborCost: dto.total_labor_cost,
      totalEquipmentCost: dto.total_equipment_cost,
      subtotal: dto.subtotal,
      taxRate: dto.tax_rate,
      taxAmount: dto.tax_amount,
      totalWithTax: dto.total_with_tax,
      overheadPercentage: dto.overhead_percentage,
      overheadAmount: dto.overhead_amount,
      profitMarginPercentage: dto.profit_margin_percentage,
      profitMarginAmount: dto.profit_margin_amount,
      finalTotal: dto.final_total,
      currency: dto.currency,
      status: dto.status
    };
  }

  fromUpdateDtoToEntity(dto: any): any {
    return {
      tenderId: dto.tender_id,
      projectId: dto.project_id,
      estimateType: dto.estimate_type,
      totalMaterialsCost: dto.total_materials_cost,
      totalLaborCost: dto.total_labor_cost,
      totalEquipmentCost: dto.total_equipment_cost,
      subtotal: dto.subtotal,
      taxRate: dto.tax_rate,
      taxAmount: dto.tax_amount,
      totalWithTax: dto.total_with_tax,
      overheadPercentage: dto.overhead_percentage,
      overheadAmount: dto.overhead_amount,
      profitMarginPercentage: dto.profit_margin_percentage,
      profitMarginAmount: dto.profit_margin_amount,
      finalTotal: dto.final_total,
      currency: dto.currency,
      status: dto.status
    };
  }

  fromDtosToAdapter(dtos: TenderEstimateDTO[]): TenderEstimateDTO[] { return dtos; }
  toResponseDto(entity: TenderEstimate): TenderEstimateDTO { return this.toDTO(entity); }
  toRequestDto(dto: any): TenderEstimateDTO { return dto; }
  toUpdateDto(dto: any): Partial<any> { return dto; }

  validate(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data.tender_id || data.tender_id.trim?.().length === 0) {
      errors.push('Tender ID is required');
    }
    if (!data.estimate_type || data.estimate_type.trim?.().length === 0) {
      errors.push('Estimate type is required');
    }
    return { isValid: errors.length === 0, errors };
  }
}

export class TenderEstimateItemDomainTransformer {
  toDTO(entity: TenderEstimateItem): TenderEstimateItemDTO {
    return {
      id: entity.id,
      estimate_id: entity.estimateId,
      material_id: entity.materialId,
      item_code: entity.itemCode,
      description: entity.description,
      unit: entity.unit,
      quantity: entity.quantity,
      unit_price: entity.unitPrice,
      total_price: entity.totalPrice,
      category: entity.category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  fromDTO(dto: TenderEstimateItemDTO): any {
    return {
      id: dto.id,
      estimateId: dto.estimate_id,
      materialId: dto.material_id,
      itemCode: dto.item_code,
      description: dto.description,
      unit: dto.unit,
      quantity: dto.quantity,
      unitPrice: dto.unit_price,
      totalPrice: dto.total_price,
      category: dto.category,
    };
  }

  fromCreateDtoToEntity(dto: any): any {
    return {
      estimateId: dto.estimate_id,
      materialId: dto.material_id,
      itemCode: dto.item_code || '',
      unit: dto.unit || '',
      quantity: dto.quantity,
      unitPrice: dto.unit_price,
      totalPrice: dto.total_price,
      description: dto.description,
      itemType: dto.item_type
    };
  }

  fromUpdateDtoToEntity(dto: any): any {
    return {
      materialId: dto.material_id,
      quantity: dto.quantity,
      unitPrice: dto.unit_price,
      totalPrice: dto.total_price,
      description: dto.description,
      itemType: dto.item_type
    };
  }

  fromDtosToAdapter(dtos: TenderEstimateItemDTO[]): TenderEstimateItemDTO[] { return dtos; }
  toResponseDto(entity: TenderEstimateItem): TenderEstimateItemDTO { return this.toDTO(entity); }
  toRequestDto(dto: any): TenderEstimateItemDTO { return dto; }
  toUpdateDto(dto: any): Partial<any> { return dto; }

  validate(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!data.estimate_id) errors.push('Estimate ID is required');
    if (typeof data.quantity !== 'number' || data.quantity <= 0) errors.push('Quantity must be positive');
    if (typeof data.unit_price !== 'number' || data.unit_price < 0) errors.push('Unit price must be positive');
    return { isValid: errors.length === 0, errors };
  }
}
