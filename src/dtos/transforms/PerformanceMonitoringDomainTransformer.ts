import { DatabaseMetrics, PerformanceMetrics, TenderEstimate, TenderEstimateItem } from '@/domain/entities/PerformanceMonitoring';
import { 
  DatabaseMetricsDTO, 
  PerformanceMetricsDTO,
  TenderEstimateDTO,
  TenderEstimateItemDTO,
  TenderEstimateCreateDTO,
  TenderEstimateItemCreateDTO,
  UpdateTenderEstimateRequestDto,
  UpdateTenderEstimateItemRequestDto
} from './shared';
import { EntityToDTOMapper } from './shared';

export class PerformanceMonitoringDomainTransformer implements EntityToDTOMapper<PerformanceMetrics, PerformanceMetricsDTO> {
  
  /**
   * Convert PerformanceMetrics entity to DTO
   */
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

  /**
   * Convert DTO to PerformanceMetrics entity
   */
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

  /**
   * Convert array of entities to DTOs
   */
  fromDtosToAdapter(dtos: PerformanceMetricsDTO[]): PerformanceMetricsDTO[] {
    return dtos;
  }

  /**
   * Convert entity to response DTO
   */
  toResponseDto(entity: PerformanceMetrics): PerformanceMetricsDTO {
    return this.toDTO(entity);
  }

  /**
   * Convert request DTO to entity
   */
  toRequestDto(dto: any): PerformanceMetricsDTO {
    return dto;
  }

  /**
   * Convert to update DTO
   */
  toUpdateDto(dto: any): Partial<PerformanceMetricsDTO> {
    return dto;
  }

  /**
   * Validate performance metrics data
   */
  validate(data: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (data.database) {
      if (typeof data.database.connections !== 'number' || data.database.connections < 0) {
        errors.push('Database connections must be a positive number');
      }
      if (typeof data.database.maxConnections !== 'number' || data.database.maxConnections <= 0) {
        errors.push('Database max connections must be a positive number');
      }
      if (typeof data.database.queryTime !== 'number' || data.database.queryTime < 0) {
        errors.push('Database query time must be a positive number');
      }
      if (typeof data.database.slowQueries !== 'number' || data.database.slowQueries < 0) {
        errors.push('Database slow queries must be a positive number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export class TenderEstimateDomainTransformer implements EntityToDTOMapper<TenderEstimate, TenderEstimateDTO> {
  
  /**
   * Convert TenderEstimate entity to DTO
   */
  toDTO(entity: TenderEstimate): TenderEstimateDTO {
    return {
      id: entity.id,
      tender_id: entity.tenderId,
      project_id: entity.projectId,
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
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
      submitted_by: entity.submittedBy
    };
  }

  /**
   * Convert DTO to TenderEstimate entity
   */
  fromDTO(dto: TenderEstimateDTO): TenderEstimate {
    return {
      id: dto.id,
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
      status: dto.status,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
      submittedBy: dto.submitted_by
    };
  }

  /**
   * Convert CreateTenderEstimateDTO to entity
   */
  fromCreateDtoToEntity(dto: TenderEstimateCreateDTO): Omit<TenderEstimate, 'id' | 'createdAt' | 'updatedAt'> {
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

  /**
   * Convert UpdateTenderEstimateRequestDto to partial entity
   */
  fromUpdateDtoToEntity(dto: UpdateTenderEstimateRequestDto): Partial<TenderEstimate> {
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

  /**
   * Convert array of entities to DTOs
   */
  fromDtosToAdapter(dtos: TenderEstimateDTO[]): TenderEstimateDTO[] {
    return dtos;
  }

  /**
   * Convert entity to response DTO
   */
  toResponseDto(entity: TenderEstimate): TenderEstimateDTO {
    return this.toDTO(entity);
  }

  /**
   * Convert request DTO to entity
   */
  toRequestDto(dto: any): TenderEstimateDTO {
    return dto;
  }

  /**
   * Convert to update DTO
   */
  toUpdateDto(dto: any): Partial<UpdateTenderEstimateRequestDto> {
    return dto;
  }

  /**
   * Validate tender estimate data
   */
  validate(data: TenderEstimateCreateDTO | UpdateTenderEstimateRequestDto): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.tender_id || data.tender_id.trim().length === 0) {
      errors.push('Tender ID is required');
    }

    if (!data.estimate_type || data.estimate_type.trim().length === 0) {
      errors.push('Estimate type is required');
    }

    if (data.total_materials_cost && (typeof data.total_materials_cost !== 'number' || data.total_materials_cost < 0)) {
      errors.push('Total materials cost must be a positive number');
    }

    if (data.total_labor_cost && (typeof data.total_labor_cost !== 'number' || data.total_labor_cost < 0)) {
      errors.push('Total labor cost must be a positive number');
    }

    if (data.total_equipment_cost && (typeof data.total_equipment_cost !== 'number' || data.total_equipment_cost < 0)) {
      errors.push('Total equipment cost must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export class TenderEstimateItemDomainTransformer implements EntityToDTOMapper<TenderEstimateItem, TenderEstimateItemDTO> {
  
  /**
   * Convert TenderEstimateItem entity to DTO
   */
  toDTO(entity: TenderEstimateItem): TenderEstimateItemDTO {
    return {
      id: entity.id,
      estimate_id: entity.estimateId,
      material_id: entity.materialId,
      quantity: entity.quantity,
      unit_price: entity.unitPrice,
      total_price: entity.totalPrice,
      description: entity.description,
      item_type: entity.itemType,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString()
    };
  }

  /**
   * Convert DTO to TenderEstimateItem entity
   */
  fromDTO(dto: TenderEstimateItemDTO): TenderEstimateItem {
    return {
      id: dto.id,
      estimateId: dto.estimate_id,
      materialId: dto.material_id,
      quantity: dto.quantity,
      unitPrice: dto.unit_price,
      totalPrice: dto.total_price,
      description: dto.description,
      itemType: dto.item_type,
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at)
    };
  }

  /**
   * Convert CreateTenderEstimateItemDTO to entity
   */
  fromCreateDtoToEntity(dto: TenderEstimateItemCreateDTO): Omit<TenderEstimateItem, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      estimateId: dto.estimate_id,
      materialId: dto.material_id,
      quantity: dto.quantity,
      unitPrice: dto.unit_price,
      totalPrice: dto.total_price,
      description: dto.description,
      itemType: dto.item_type
    };
  }

  /**
   * Convert UpdateTenderEstimateItemRequestDto to partial entity
   */
  fromUpdateDtoToEntity(dto: UpdateTenderEstimateItemRequestDto): Partial<TenderEstimateItem> {
    return {
      materialId: dto.material_id,
      quantity: dto.quantity,
      unitPrice: dto.unit_price,
      totalPrice: dto.total_price,
      description: dto.description,
      itemType: dto.item_type
    };
  }

  /**
   * Convert array of entities to DTOs
   */
  fromDtosToAdapter(dtos: TenderEstimateItemDTO[]): TenderEstimateItemDTO[] {
    return dtos;
  }

  /**
   * Convert entity to response DTO
   */
  toResponseDto(entity: TenderEstimateItem): TenderEstimateItemDTO {
    return this.toDTO(entity);
  }

  /**
   * Convert request DTO to entity
   */
  toRequestDto(dto: any): TenderEstimateItemDTO {
    return dto;
  }

  /**
   * Convert to update DTO
   */
  toUpdateDto(dto: any): Partial<UpdateTenderEstimateItemRequestDto> {
    return dto;
  }

  /**
   * Validate tender estimate item data
   */
  validate(data: TenderEstimateItemCreateDTO | UpdateTenderEstimateItemRequestDto): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.estimate_id || data.estimate_id.trim().length === 0) {
      errors.push('Estimate ID is required');
    }

    if (typeof data.quantity !== 'number' || data.quantity <= 0) {
      errors.push('Quantity must be a positive number');
    }

    if (typeof data.unit_price !== 'number' || data.unit_price < 0) {
      errors.push('Unit price must be a positive number');
    }

    if (typeof data.total_price !== 'number' || data.total_price < 0) {
      errors.push('Total price must be a positive number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
