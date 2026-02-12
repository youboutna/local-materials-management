/**
 * Material Service - Hexagonal Architecture
 * Business logic for material management operations
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { Material, MaterialCategory } from '@/domain/entities/Material';
import { MATERIAL_CATEGORIES, MaterialDTO, MaterialStatus, MaterialUnit } from '@/dtos/entities/MaterialDTO';

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
   * Get all materials
   */
  async getAllMaterials(): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findAll();
      return materials.map(material => this.mapToDTO(material));
    } catch (error) {
      console.error('MaterialService.getAllMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch materials');
    }
  }

  /**
   * Get material by ID
   */
  async getMaterialById(id: string): Promise<MaterialDTO | null> {
    try {
      const material = await this.materialRepository.findById(id);
      return material ? this.mapToDTO(material) : null;
    } catch (error) {
      console.error('MaterialService.getMaterialById failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch material');
    }
  }

  /**
   * Get materials by category
   */
  async getMaterialsByCategory(category: MaterialCategory): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findByCategory(category);
      return materials.map(material => this.mapToDTO(material));
    } catch (error) {
      console.error('MaterialService.getMaterialsByCategory failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch materials by category');
    }
  }

  /**
   * Get materials by workspace
   */
  async getMaterialsByWorkspace(workspaceId: string): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findByWorkspace(workspaceId);
      return materials.map(material => this.mapToDTO(material));
    } catch (error) {
      console.error('MaterialService.getMaterialsByWorkspace failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch materials by workspace');
    }
  }

  /**
   * Search materials by query
   */
  async searchMaterials(query: string): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.search(query);
      return materials.map(material => this.mapToDTO(material));
    } catch (error) {
      console.error('MaterialService.searchMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to search materials');
    }
  }

  /**
   * Get low stock materials
   */
  async getLowStockMaterials(threshold: number = 10): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findLowStock(threshold);
      return materials.map(material => this.mapToDTO(material));
    } catch (error) {
      console.error('MaterialService.getLowStockMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch low stock materials');
    }
  }

  /**
   * Get out of stock materials
   */
  async getOutOfStockMaterials(): Promise<MaterialDTO[]> {
    try {
      const materials = await this.materialRepository.findOutOfStock();
      return materials.map(material => this.mapToDTO(material));
    } catch (error) {
      console.error('MaterialService.getOutOfStockMaterials failed:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch out of stock materials');
    }
  }

  /**
   * Create a new material
   */
  async createMaterial(materialData: CreateMaterialDTO): Promise<MaterialDTO> {
    try {
      this.validateMaterialData(materialData);

      // Generate ID first
      const createdId = `material_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create Material entity from DTO
      const materialEntity = new Material(
        createdId,
        materialData.name,
        materialData.description || '',
        materialData.category,
        materialData.unit,
        materialData.pricePerUnit,
        materialData.availableQuantity,
        null, // sku
        null, // ean
        null, // gtin
        null, // asin
        null, // image
        null, // coordinates
        materialData.workspaceId || null,
        new Date().toISOString(),
        new Date().toISOString(),
        null, // originLocation
        null, // adresse
        null, // coordinatesLatitude
        null, // coordinatesLongitude
        null, // forme
        null  // localisation
      );

      // Create material through repository
      await this.materialRepository.save(materialEntity);
      
      // Return the created material
      const createdMaterial = { ...materialEntity, id: createdId };

      return this.mapToDTO(createdMaterial);
    } catch (error) {
      console.error('MaterialService.createMaterial failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create material');
    }
  }

  /**
   * Update an existing material
   */
  async updateMaterial(id: string, updates: UpdateMaterialDTO): Promise<MaterialDTO> {
    try {
      this.validateMaterialData(updates);

      const existing = await this.materialRepository.findById(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Material not found');
      }

      // Update material through repository
      await this.materialRepository.update(id, updates);
      
      // Get the updated material
      const updated = await this.materialRepository.findById(id);
      
      if (!updated) {
        throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update material');
      }

      return this.mapToDTO(updated);
    } catch (error) {
      console.error('MaterialService.updateMaterial failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update material');
    }
  }

  /**
   * Delete a material
   */
  async deleteMaterial(id: string): Promise<void> {
    try {
      const existing = await this.materialRepository.findById(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Material not found');
      }

      await this.materialRepository.delete(id);
    } catch (error) {
      console.error('MaterialService.deleteMaterial failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete material');
    }
  }

  /**
   * Get materials for a specific project
   */
  async getProjectMaterials(projectId: string): Promise<ProjectMaterialDTO[]> {
    try {
      if (!projectId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
      }

      // Get project materials through repository
      const projectMaterials = await this.materialRepository.getProjectMaterials(projectId);
      
      return projectMaterials.map(pm => ({
        id: pm.id,
        projectId: pm.projectId,
        materialId: pm.materialId,
        quantity: pm.quantity,
        unitPrice: pm.unitPrice,
        totalPrice: pm.totalPrice,
        addedAt: pm.addedAt,
        addedBy: pm.addedBy
      }));
    } catch (error) {
      console.error('MaterialService.getProjectMaterials failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get project materials');
    }
  }

  /**
   * Add material to a project
   */
  async addMaterialToProject(projectId: string, materialId: string, quantity: number): Promise<void> {
    try {
      if (!projectId || !materialId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID and Material ID are required');
      }

      if (quantity <= 0) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Quantity must be positive');
      }

      // Check if material exists
      const material = await this.materialRepository.findById(materialId);
      if (!material) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Material not found');
      }

      // Check if material has enough stock
      if (material.availableQuantity < quantity) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Insufficient material stock');
      }

      // Add material to project through repository
      await this.materialRepository.addMaterialToProject(projectId, materialId, quantity);
      
      // Update material stock
      await this.materialRepository.update(materialId, {
        availableQuantity: material.availableQuantity - quantity
      });
    } catch (error) {
      console.error('MaterialService.addMaterialToProject failed:', error);
      throw error instanceof AppError ? error : new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to add material to project');
    }
  }

  /**
   * Remove material from a project
   */
  async removeMaterialFromProject(projectId: string, materialId: string): Promise<void> {
    try {
      if (!projectId || !materialId) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID and Material ID are required');
      }

      // Get project material to restore stock
      const projectMaterials = await this.materialRepository.getProjectMaterials(projectId);
      const projectMaterial = projectMaterials.find(pm => pm.materialId === materialId);
      
      if (!projectMaterial) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Material not found in project');
      }

      // Remove material from project through repository
      await this.materialRepository.removeMaterialFromProject(projectId, materialId);
      
      // Restore material stock
      const material = await this.materialRepository.findById(materialId);
      if (material) {
        await this.materialRepository.update(materialId, {
          availableQuantity: material.availableQuantity + projectMaterial.quantity
        });
      }
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
      category: category,
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
