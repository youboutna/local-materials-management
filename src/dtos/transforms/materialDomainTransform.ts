/**
 * Material Domain Transformer - Consolidated & Unified
 * Implements EntityToDTOMapper interface for Material domain entity
 * Centralizes all material transformation logic following hexagonal architecture
 */

import { Material, MaterialCategory } from '@/domain/entities/Material';
import { MaterialDTO, CreateMaterialDTO, UpdateMaterialDTO } from '@/dtos/entities/MaterialDTO';
import { EntityToDTOMapper, ValidationResult } from '@/dtos/transforms';
import { btpCalculations } from '@/utils/btpCalculations';

// API Request/Response DTOs for UI and Supabase integration
export class MaterialResponseDto {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public category: string,
    public unit: string,
    public pricePerUnit: number,
    public availableQuantity: number,
    public sku?: string,
    public coordinatesLatitude?: number,
    public coordinatesLongitude?: number,
    public workspaceId?: string,
    public image?: string,
    public originLocation?: string,
    public adresse?: string,
    public forme?: string,
    public createdAt?: string,
    public updatedAt?: string
  ) {}
}

export class CreateMaterialRequestDto {
  constructor(
    public name: string,
    public description: string,
    public category: string,
    public unit: string,
    public pricePerUnit: number,
    public availableQuantity?: number,
    public sku?: string,
    public coordinatesLatitude?: number,
    public coordinatesLongitude?: number,
    public workspaceId?: string,
    public image?: string,
    public originLocation?: string,
    public adresse?: string,
    public forme?: string
  ) {}
}

export class UpdateMaterialRequestDto {
  constructor(
    public name?: string,
    public description?: string,
    public category?: string,
    public unit?: string,
    public pricePerUnit?: number,
    public availableQuantity?: number,
    public sku?: string,
    public coordinatesLatitude?: number,
    public coordinatesLongitude?: number,
    public workspaceId?: string,
    public image?: string,
    public originLocation?: string,
    public adresse?: string,
    public forme?: string
  ) {}
}

export class MaterialDomainTransformer implements EntityToDTOMapper<Material, MaterialDTO> {
  
  /**
   * Transform Material domain entity to MaterialDTO
   */
  toDTO(entity: Material): MaterialDTO {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      category: entity.category,
      unit: entity.unit,
      pricePerUnit: entity.pricePerUnit,
      availableQuantity: entity.availableQuantity,
      sku: entity.sku || undefined,
      coordinatesLatitude: entity.coordinatesLatitude || undefined,
      coordinatesLongitude: entity.coordinatesLongitude || undefined,
      workspaceId: entity.workspaceId || undefined,
      image: entity.image || undefined,
      originLocation: entity.originLocation || undefined,
      adresse: entity.adresse || undefined,
      forme: entity.forme || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Transform MaterialDTO to partial Material domain entity
   */
  fromDTO(dto: Partial<MaterialDTO>): Partial<Material> {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      category: dto.category,
      unit: dto.unit,
      pricePerUnit: dto.pricePerUnit,
      availableQuantity: dto.availableQuantity,
      sku: dto.sku,
      ean: null,
      gtin: null,
      asin: null,
      image: dto.image || null,
      coordinates: dto.coordinatesLatitude && dto.coordinatesLongitude ? {
        latitude: dto.coordinatesLatitude,
        longitude: dto.coordinatesLongitude
      } : null,
      workspaceId: dto.workspaceId,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
      originLocation: dto.originLocation || null,
      adresse: dto.adresse || null,
      coordinatesLatitude: dto.coordinatesLatitude || null,
      coordinatesLongitude: dto.coordinatesLongitude || null,
      forme: dto.forme || null,
      localisation: null
    };
  }

  /**
   * Transform array of MaterialDTOs to array of MaterialResponseDTOs (for UI/API)
   */
  fromDtosToAdapter(dtos: MaterialDTO[]): MaterialResponseDto[] {
    return dtos.map(dto => this.toResponseDto(dto));
  }

  /**
   * Transform single MaterialDTO to MaterialResponseDto (for UI/API)
   */
  toResponseDto(dto: MaterialDTO): MaterialResponseDto {
    return new MaterialResponseDto(
      dto.id,
      dto.name,
      dto.description,
      dto.category,
      dto.unit,
      dto.pricePerUnit,
      dto.availableQuantity,
      dto.sku,
      dto.coordinatesLatitude,
      dto.coordinatesLongitude,
      dto.workspaceId,
      dto.image,
      dto.originLocation,
      dto.adresse,
      dto.forme,
      dto.createdAt,
      dto.updatedAt
    );
  }

  /**
   * Transform CreateMaterialRequestDto to MaterialDTO
   */
  toRequestDto(requestDto: CreateMaterialRequestDto): MaterialDTO {
    return {
      id: crypto.randomUUID(),
      name: requestDto.name,
      description: requestDto.description,
      category: requestDto.category,
      unit: requestDto.unit,
      pricePerUnit: requestDto.pricePerUnit,
      availableQuantity: requestDto.availableQuantity || 0,
      sku: requestDto.sku,
      coordinatesLatitude: requestDto.coordinatesLatitude,
      coordinatesLongitude: requestDto.coordinatesLongitude,
      workspaceId: requestDto.workspaceId,
      image: requestDto.image,
      originLocation: requestDto.originLocation,
      adresse: requestDto.adresse,
      forme: requestDto.forme,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform UpdateMaterialRequestDto to partial MaterialDTO
   */
  toUpdateDto(requestDto: UpdateMaterialRequestDto): Partial<MaterialDTO> {
    return {
      name: requestDto.name,
      description: requestDto.description,
      category: requestDto.category,
      unit: requestDto.unit,
      pricePerUnit: requestDto.pricePerUnit,
      availableQuantity: requestDto.availableQuantity,
      sku: requestDto.sku,
      coordinatesLatitude: requestDto.coordinatesLatitude,
      coordinatesLongitude: requestDto.coordinatesLongitude,
      workspaceId: requestDto.workspaceId,
      image: requestDto.image,
      originLocation: requestDto.originLocation,
      adresse: requestDto.adresse,
      forme: requestDto.forme,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Transform Material domain entity to MaterialResponseDto (direct path)
   */
  fromDomainToResponseDto(entity: Material): MaterialResponseDto {
    const dto = this.toDTO(entity);
    return this.toResponseDto(dto);
  }

  /**
   * Validate MaterialDTO data
   */
  validate(dto: Partial<MaterialDTO>): ValidationResult {
    const errors: string[] = [];
    const fieldErrors: Record<string, string[]> = {};

    // Name validation
    if (!dto.name || dto.name.trim() === '') {
      errors.push('Material name is required');
      fieldErrors.name = ['Material name is required'];
    }

    // Description validation
    if (!dto.description || dto.description.trim() === '') {
      errors.push('Material description is required');
      fieldErrors.description = ['Material description is required'];
    }

    // Category validation
    if (!dto.category || dto.category.trim() === '') {
      errors.push('Material category is required');
      fieldErrors.category = ['Material category is required'];
    }

    // Unit validation
    if (!dto.unit || dto.unit.trim() === '') {
      errors.push('Material unit is required');
      fieldErrors.unit = ['Material unit is required'];
    }

    // Price validation
    if (dto.pricePerUnit !== undefined && dto.pricePerUnit <= 0) {
      errors.push('Price per unit must be greater than 0');
      fieldErrors.pricePerUnit = ['Price per unit must be greater than 0'];
    }

    // Quantity validation
    if (dto.availableQuantity !== undefined && dto.availableQuantity < 0) {
      errors.push('Available quantity cannot be negative');
      fieldErrors.availableQuantity = ['Available quantity cannot be negative'];
    }

    return {
      isValid: errors.length === 0,
      errors,
      fieldErrors
    };
  }

  // Utility methods for material operations
  static calculateMaterialCost(material: MaterialResponseDto, quantity: number): number {
    return material.pricePerUnit * quantity;
  }

  static calculateTotalCost(materials: MaterialResponseDto[], quantities: number[]): number {
    return materials.reduce((total, material, index) => {
      const quantity = quantities[index] || 0;
      return total + (material.pricePerUnit * quantity);
    }, 0);
  }

  static formatMaterialPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(price);
  }

  static getMaterialStockStatus(quantity: number): 'in-stock' | 'low-stock' | 'out-of-stock' {
    if (quantity <= 0) return 'out-of-stock';
    if (quantity < 10) return 'low-stock';
    return 'in-stock';
  }

  static getStockStatusColor(status: 'in-stock' | 'low-stock' | 'out-of-stock'): string {
    const colors = {
      'in-stock': 'green',
      'low-stock': 'yellow',
      'out-of-stock': 'red'
    };
    return colors[status] || 'gray';
  }

  static calculateMaterialWeight(material: MaterialResponseDto, volume?: number): number {
    // Calculate weight based on material type and volume
    const densityMap: Record<string, number> = {
      'béton': 2400, // kg/m³
      'acier': 7850,  // kg/m³
      'bois': 600,    // kg/m³
      'brique': 1800,  // kg/m³
      'sable': 1600,   // kg/m³
      'gravier': 1500  // kg/m³
    };

    const density = densityMap[material.category.toLowerCase()] || 1000;
    const materialVolume = volume || 1; // Default to 1m³ if not provided
    
    return density * materialVolume;
  }

  static formatMaterialQuantity(quantity: number, unit: string): string {
    if (quantity >= 1000) {
      return `${(quantity / 1000).toFixed(2)} ${unit} (1000+)`;
    }
    return `${quantity} ${unit}`;
  }

  static getMaterialAvailabilityText(quantity: number): string {
    if (quantity <= 0) return 'Indisponible';
    if (quantity < 10) return 'Stock limité';
    if (quantity < 50) return 'Stock modéré';
    return 'Disponible';
  }

  static calculateMaterialValue(material: MaterialResponseDto): number {
    return material.pricePerUnit * material.availableQuantity;
  }

  static calculateTotalInventoryValue(materials: MaterialResponseDto[]): number {
    return materials.reduce((total, material) => {
      return total + this.calculateMaterialValue(material);
    }, 0);
  }

  static getMaterialCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'béton': '🏗️',
      'acier': '🔧',
      'bois': '🪵',
      'brique': '🧱',
      'sable': '🏖️',
      'gravier': '🪨',
      'ciment': '🪣',
      'peinture': '🎨',
      'isolation': '🏠',
      'plomberie': '🔧',
      'électricité': '⚡'
    };
    
    return iconMap[category.toLowerCase()] || '📦';
  }

  static filterMaterialsByCategory(materials: MaterialResponseDto[], category: string): MaterialResponseDto[] {
    return materials.filter(material => 
      material.category.toLowerCase() === category.toLowerCase()
    );
  }

  static searchMaterials(materials: MaterialResponseDto[], searchTerm: string): MaterialResponseDto[] {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return materials.filter(material =>
      material.name.toLowerCase().includes(lowerSearchTerm) ||
      material.description.toLowerCase().includes(lowerSearchTerm) ||
      material.category.toLowerCase().includes(lowerSearchTerm) ||
      material.sku?.toLowerCase().includes(lowerSearchTerm)
    );
  }

  static sortMaterialsByPrice(materials: MaterialResponseDto[], ascending: boolean = true): MaterialResponseDto[] {
    return [...materials].sort((a, b) => 
      ascending ? a.pricePerUnit - b.pricePerUnit : b.pricePerUnit - a.pricePerUnit
    );
  }

  static sortMaterialsByQuantity(materials: MaterialResponseDto[], ascending: boolean = false): MaterialResponseDto[] {
    return [...materials].sort((a, b) => 
      ascending ? a.availableQuantity - b.availableQuantity : b.availableQuantity - a.availableQuantity
    );
  }

  static getMaterialDimensions(material: MaterialResponseDto): { width: number; height: number; depth: number } | null {
    // Extract dimensions from description if available
    const dimensionRegex = /(\d+)x(\d+)x(\d+)/;
    const match = material.description.match(dimensionRegex);
    
    if (match) {
      return {
        width: parseInt(match[1]),
        height: parseInt(match[2]),
        depth: parseInt(match[3])
      };
    }
    
    return null;
  }

  static calculateMaterialVolume(material: MaterialResponseDto): number {
    const dimensions = this.getMaterialDimensions(material);
    if (dimensions) {
      return (dimensions.width * dimensions.height * dimensions.depth) / 1000000; // Convert to m³
    }
    
    // Default volume estimation based on category
    const volumeEstimates: Record<string, number> = {
      'sable': 0.001,  // 1L per kg
      'gravier': 0.0006, // 0.6L per kg
      'ciment': 0.0008,  // 0.8L per kg
      'brique': 0.0015,  // 1.5L per brick
      'bois': 0.002
    };
    
    return volumeEstimates[material.category.toLowerCase()] || 0.001;
  }
}
