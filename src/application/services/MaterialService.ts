/**
 * Material Service - Hexagonal Architecture
 * Business logic for material management
 * Rule #1: Form → DTO → Service → Domain → Adapter → DB
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { Material, MaterialCategory } from '@/domain/entities/Material';
import { 
  MaterialTransformer, 
  MaterialDTO, 
  CreateMaterialRequestDto, 
  UpdateMaterialRequestDto 
} from '@/dtos/transforms/MaterialTransformer';

export class MaterialService {
  constructor(private materialRepository: IMaterialRepository) {}

  async getAllMaterials(): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findAll();
      return materials.map(m => MaterialTransformer.toDTO(m));
    } catch (error) {
      console.error('MaterialService.getAllMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch materials');
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
