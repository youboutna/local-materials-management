/**
 * Material Service - Hexagonal Architecture
 * Business logic for material management
 * Rule #1: Form → DTO → Service → Domain → Adapter → DB
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { Material, MaterialCategory } from '@/domain/entities/Material';
import { MATERIAL_CATEGORIES, MaterialDTO, MaterialStatus, MaterialUnit, MaterialTransformer, CreateMaterialRequestDto, UpdateMaterialRequestDto, MaterialUIDTO } from '@/dtos/transforms/MaterialDTO';

// Service DTOs for data exchange
export interface CreateMaterialDTO {
  name: string;
  description?: string;
  category: MaterialCategory;
  unit: string;
  pricePerUnit: number;
  availableQuantity: number;
  minStockLevel?: number;
  workspaceId: string;
  supplierId?: string;
}

export interface UpdateMaterialDTO {
  name?: string;
  description?: string;
  category?: MaterialCategory;
  unit?: string;
  pricePerUnit?: number;
  availableQuantity?: number;
  minStockLevel?: number;
  supplierId?: string;
}

export interface ProjectMaterialDTO {
  id: string;
  projectId: string;
  materialId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  addedAt: string;
  addedBy: string;
}

interface MaterialWithPhase {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  phaseId?: string;
  phase_id?: string;
  description: string;
  category: MaterialCategory;
  pricePerUnit: number;
  availableQuantity: number;
  minStockLevel: number;
  workspaceId: string;
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
}

// Enhanced type guard for MaterialCategory
function isMaterialCategory(category: MaterialCategory): category is 'construction' | 'building' | 'pierre' | 'electrical' | 'plumbing' | 'finishing' | 'equipment' | 'safety' | 'tools' | 'other' {
  return MATERIAL_CATEGORIES.some(cat => cat.id === category);
}

export class MaterialService {
  constructor(private materialRepository: IMaterialRepository) {}

  // Improved validateMaterialData method
  private validateMaterialData(data: CreateMaterialDTO | UpdateMaterialDTO): void {
    const errors: Record<string, string[]> = {};

    if ('name' in data && (!data.name || data.name.trim().length === 0)) {
      errors.name = ['Material name is required'];
    }

      if ('category' in data && data.category && !isMaterialCategory(data.category)) {
        errors.category = [`Invalid material category. Valid values: ${MATERIAL_CATEGORIES.map(cat => cat.id).join(', ')}`];
      }

    if ('pricePerUnit' in data && data.pricePerUnit !== undefined) {
      if (data.pricePerUnit < 0) {
        errors.pricePerUnit = ['Price per unit must be non-negative'];
      }
      if (data.pricePerUnit > 1000000) {
        errors.pricePerUnit = ['Price per unit exceeds maximum value (1,000,000)'];
      }
    }

    if ('availableQuantity' in data && data.availableQuantity !== undefined) {
      if (data.availableQuantity < 0) {
        errors.availableQuantity = ['Available quantity must be non-negative'];
      }
      if (data.availableQuantity > 1000000) {
        errors.availableQuantity = ['Available quantity exceeds maximum value (1,000,000)'];
      }
    }

    if ('minStockLevel' in data && data.minStockLevel !== undefined) {
      if (data.minStockLevel < 0) {
        errors.minStockLevel = ['Minimum stock level must be non-negative'];
      }
      if (data.minStockLevel > 1000000) {
        errors.minStockLevel = ['Minimum stock level exceeds maximum value (1,000,000)'];
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Material validation failed', errors);
    }
  }

  /**
   * Get materials by phase ID
   */
  async getMaterialsByPhase(phaseId: string): Promise<MaterialDTO[]> {
    try {
      if (!phaseId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Phase ID is required');
      }

      // Get all materials and filter by phase
      const materials = await this.materialRepository.findAll();
      const phaseMaterials = materials.filter((material) => {
        const m = material as unknown as MaterialWithPhase;
        return m.phaseId === phaseId || m.phase_id === phaseId;
      });
      
      return phaseMaterials.map(material => this.mapToDTO(material));
    } catch (error) {
      console.error('MaterialService.getMaterialsByPhase failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get materials by phase');
    }
  }

  /**
   * Get all materials for UI consumption
   * Returns MaterialUIDTO with category as string for UI components
   */
  async getMaterialsForUI(): Promise<MaterialUIDTO[]> {
  async getAllMaterials(): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findAll();
      const dtos = materials.map(material => this.mapToDTO(material));
      return dtos.map(dto => MaterialTransformer.toUIDTO(dto));
    } catch (error) {
      console.error('MaterialService.getMaterialsForUI failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch materials for UI');
    }
  }

  /**
   * Get material by ID for UI consumption
   */
  async getMaterialForUI(id: string): Promise<MaterialUIDTO | null> {
    try {
      const material = await this.materialRepository.findById(id);
      if (!material) return null;
      const dto = this.mapToDTO(material);
      return MaterialTransformer.toUIDTO(dto);
      return materials.map(m => MaterialTransformer.toDTO(m));
    } catch (error) {
      console.error('MaterialService.getMaterialForUI failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch material for UI');
    }
  }

  async getMaterialById(id: string): Promise<MaterialDTO | null> {
    try {
      const material = await this.materialRepository.findById(id);
      return material ? MaterialTransformer.toDTO(material) : null;
    } catch (error) {
      console.error('MaterialService.getMaterialById failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch material');
    }
  }

  async getMaterialsByCategory(category: MaterialCategory): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findByCategory(category);
      return materials.map(m => MaterialTransformer.toDTO(m));
    } catch (error) {
      console.error('MaterialService.getMaterialsByCategory failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch materials by category');
    }
  }

  async getMaterialsByWorkspace(workspaceId: string): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findByWorkspace(workspaceId);
      return materials.map(m => MaterialTransformer.toDTO(m));
    } catch (error) {
      console.error('MaterialService.getMaterialsByWorkspace failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch materials by workspace');
    }
  }

  async searchMaterials(query: string): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.search(query);
      return materials.map(m => MaterialTransformer.toDTO(m));
    } catch (error) {
      console.error('MaterialService.searchMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to search materials');
    }
  }

  async getLowStockMaterials(threshold: number = 10): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findLowStock(threshold);
      return materials.map(m => MaterialTransformer.toDTO(m));
    } catch (error) {
      console.error('MaterialService.getLowStockMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch low stock materials');
    }
  }

  async getOutOfStockMaterials(): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findOutOfStock();
      return materials.map(m => MaterialTransformer.toDTO(m));
    } catch (error) {
      console.error('MaterialService.getOutOfStockMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch out of stock materials');
    }
  }

  async createMaterial(dto: CreateMaterialRequestDto): Promise<MaterialDTO> {
    try {
      // Validate
      const errors = Material.validate({
        name: dto.name,
        category: (dto.category || 'other') as MaterialCategory,
        unit: dto.unit,
        pricePerUnit: dto.pricePerUnit,
        availableQuantity: dto.availableQuantity,
      });
      if (errors.length > 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, errors.join(', '));
      }

      // DTO → Domain Entity
      const entity = MaterialTransformer.createRequestToEntity(dto);

      // Save via repository
      await this.materialRepository.save(entity);

      return MaterialTransformer.toDTO(entity);
    } catch (error) {
      console.error('MaterialService.createMaterial failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create material');
    }
  }

  async updateMaterial(id: string, dto: UpdateMaterialRequestDto): Promise<MaterialDTO> {
    try {
      const existing = await this.materialRepository.findById(id);
      if (!existing) throw new AppError(ErrorCode.NOT_FOUND, 'Material not found');

      // Map DTO fields to entity partial
      const updates: Partial<Material> = {};
      if (dto.name !== undefined) (updates as any).name = dto.name;
      if (dto.description !== undefined) (updates as any).description = dto.description;
      if (dto.category !== undefined) (updates as any).category = dto.category;
      if (dto.unit !== undefined) (updates as any).unit = dto.unit;
      if (dto.pricePerUnit !== undefined) (updates as any).pricePerUnit = dto.pricePerUnit;
      if (dto.availableQuantity !== undefined) (updates as any).availableQuantity = dto.availableQuantity;
      if (dto.sku !== undefined) (updates as any).sku = dto.sku;
      if (dto.ean !== undefined) (updates as any).ean = dto.ean;
      if (dto.gtin !== undefined) (updates as any).gtin = dto.gtin;
      if (dto.asin !== undefined) (updates as any).asin = dto.asin;
      if (dto.image !== undefined) (updates as any).image = dto.image;
      if (dto.coordinatesLatitude !== undefined) (updates as any).coordinatesLatitude = dto.coordinatesLatitude;
      if (dto.coordinatesLongitude !== undefined) (updates as any).coordinatesLongitude = dto.coordinatesLongitude;
      if (dto.workspaceId !== undefined) (updates as any).workspaceId = dto.workspaceId;
      if (dto.originLocation !== undefined) (updates as any).originLocation = dto.originLocation;
      if (dto.adresse !== undefined) (updates as any).adresse = dto.adresse;
      if (dto.forme !== undefined) (updates as any).forme = dto.forme;
      if (dto.localisation !== undefined) (updates as any).localisation = dto.localisation;
      if (dto.multilangLabels !== undefined) (updates as any).multilangLabels = dto.multilangLabels;

      await this.materialRepository.update(id, updates);

      const updated = await this.materialRepository.findById(id);
      if (!updated) throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve updated material');

      return MaterialTransformer.toDTO(updated);
    } catch (error) {
      console.error('MaterialService.updateMaterial failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update material');
    }
  }

  async deleteMaterial(id: string): Promise<void> {
    try {
      const existing = await this.materialRepository.findById(id);
      if (!existing) throw new AppError(ErrorCode.NOT_FOUND, 'Material not found');
      await this.materialRepository.delete(id);
    } catch (error) {
      console.error('MaterialService.deleteMaterial failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete material');
    }
  }

  async getProjectMaterials(projectId: string): Promise<any[]> {
    try {
      if (!projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      return await this.materialRepository.getProjectMaterials(projectId);
    } catch (error) {
      console.error('MaterialService.getProjectMaterials failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project materials');
    }
  }

  async addMaterialToProject(projectId: string, materialId: string, quantity: number): Promise<void> {
    try {
      if (!projectId || !materialId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID and Material ID required');
      if (quantity <= 0) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Quantity must be positive');

      const material = await this.materialRepository.findById(materialId);
      if (!material) throw new AppError(ErrorCode.NOT_FOUND, 'Material not found');

      await this.materialRepository.addMaterialToProject(projectId, materialId, quantity);
    } catch (error) {
      console.error('MaterialService.addMaterialToProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add material to project');
    }
  }

  async removeMaterialFromProject(projectId: string, materialId: string): Promise<void> {
    try {
      await this.materialRepository.removeMaterialFromProject(projectId, materialId);
    } catch (error) {
      console.error('MaterialService.removeMaterialFromProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to remove material from project');
    }
  }

  /**
   * Map repository result to DTO
   */
  private mapToDTO(repositoryResult: Material | Record<string, unknown> | CreateMaterialDTO): MaterialDTO {
    // Handle Material entity, repository result, and DTO
    const result = repositoryResult as Record<string, unknown>;
    
    // Get category from result or use default
    const categoryId = (result.category as string) || 'construction';
    const category = MATERIAL_CATEGORIES.find(cat => cat.id === categoryId) || MATERIAL_CATEGORIES[0];
    
    // Get status from result or use default
    const statusValue = (result.status as string) || 'available';
    const status = Object.values(MaterialStatus).includes(statusValue as MaterialStatus) 
      ? statusValue as MaterialStatus 
      : MaterialStatus.AVAILABLE;
    
    // Get unit from result or use default
    const unitValue = (result.unit as string) || 'pieces';
    const unit = Object.values(MaterialUnit).includes(unitValue as MaterialUnit)
      ? unitValue as MaterialUnit
      : MaterialUnit.PIECES;
    
    return {
      id: (result.id as string) || '',
      name: (result.name as string) || '',
      description: (result.description as string) || '',
      type: (result.type as string) || 'general',
      category: category.id, // Return category ID as string instead of full object
      status: status,
      unit: unit,
      quantity: (result.availableQuantity as number) || (result.quantity as number) || 0,
      pricePerUnit: (result.pricePerUnit as number) || 0,
      supplierId: result.supplierId as string,
      createdAt: (result.createdAt as string) || new Date().toISOString(),
      updatedAt: (result.updatedAt as string) || new Date().toISOString()
    };
  }
}
  async getStockSummary(): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    try {
      return await this.materialRepository.getStockSummary();
    } catch (error) {
      console.error('MaterialService.getStockSummary failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get stock summary');
    }
  }

  async getMaterialsByPhase(phaseId: string): Promise<MaterialDTO[]> {
    // Materials don't have a direct phase_id in the DB schema
    // This would need to go through project_materials join
    return [];
  }
}

// Re-export types for convenience
export type { MaterialDTO, CreateMaterialRequestDto, UpdateMaterialRequestDto } from '@/dtos/transforms/MaterialTransformer';
