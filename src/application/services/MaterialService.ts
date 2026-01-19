// Material Service - Hexagonal Architecture
import { IMaterialRepository } from '@/domain/repositories/IMaterialRepository';
import { Material, MaterialCategory } from '@/domain/entities/Material';
import { AppError, ErrorLogger } from '@/utils/errorHandling';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export class MaterialService {
  private repository: IMaterialRepository;

  constructor(repository?: IMaterialRepository) {
    this.repository = repository || RepositoryFactory.getMaterialRepository();
  }

  /**
   * Get all materials
   */
  async getAllMaterials(): Promise<Material[]> {
    try {
      return await this.repository.findAll();
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getAllMaterials');
      throw error;
    }
  }

  /**
   * Get material by ID
   */
  async getMaterialById(id: string): Promise<Material | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getMaterialById');
      throw error;
    }
  }

  /**
   * Get materials by category
   */
  async getMaterialsByCategory(category: MaterialCategory): Promise<Material[]> {
    try {
      return await this.repository.findByCategory(category);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getMaterialsByCategory');
      throw error;
    }
  }

  /**
   * Get materials by workspace
   */
  async getMaterialsByWorkspace(workspaceId: string): Promise<Material[]> {
    try {
      return await this.repository.findByWorkspace(workspaceId);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getMaterialsByWorkspace');
      throw error;
    }
  }

  /**
   * Search materials
   */
  async searchMaterials(query: string): Promise<Material[]> {
    try {
      return await this.repository.search(query);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.searchMaterials');
      throw error;
    }
  }

  /**
   * Get low stock materials
   */
  async getLowStockMaterials(threshold: number = 10): Promise<Material[]> {
    try {
      return await this.repository.findLowStock(threshold);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getLowStockMaterials');
      throw error;
    }
  }

  /**
   * Get out of stock materials
   */
  async getOutOfStockMaterials(): Promise<Material[]> {
    try {
      return await this.repository.findOutOfStock();
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getOutOfStockMaterials');
      throw error;
    }
  }

  /**
   * Create new material
   */
  async createMaterial(material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>): Promise<Material> {
    try {
      const newMaterial = new Material(
        crypto.randomUUID(),
        material.name,
        material.description,
        material.category,
        material.unit,
        material.pricePerUnit,
        material.availableQuantity,
        material.sku,
        material.ean,
        material.gtin,
        material.asin,
        material.image,
        material.coordinates,
        material.workspaceId,
        new Date().toISOString(),
        new Date().toISOString(),
        material.originLocation,
        material.adresse,
        material.coordinates?.latitude,
        material.coordinates?.longitude,
        material.forme,
        material.localisation
      );

      await this.repository.save(newMaterial);
      return newMaterial;
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.createMaterial');
      throw error;
    }
  }

  /**
   * Update material
   */
  async updateMaterial(id: string, updates: Partial<Material>): Promise<Material> {
    try {
      const existingMaterial = await this.repository.findById(id);
      if (!existingMaterial) {
        throw new AppError('NOT_FOUND' as any, 'Material not found');
      }

      await this.repository.update(id, updates);
      const updatedMaterial = { ...existingMaterial, ...updates } as Material;
      return updatedMaterial;
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.updateMaterial');
      throw error;
    }
  }

  /**
   * Delete material
   */
  async deleteMaterial(id: string): Promise<void> {
    try {
      const existingMaterial = await this.repository.findById(id);
      if (!existingMaterial) {
        throw new AppError('NOT_FOUND' as any, 'Material not found');
      }

      await this.repository.delete(id);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.deleteMaterial');
      throw error;
    }
  }

  /**
   * Get material by SKU
   */
  async getMaterialBySku(sku: string): Promise<Material | null> {
    try {
      return await this.repository.findBySku(sku);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getMaterialBySku');
      throw error;
    }
  }

  /**
   * Get material by EAN
   */
  async getMaterialByEan(ean: string): Promise<Material | null> {
    try {
      return await this.repository.findByEan(ean);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getMaterialByEan');
      throw error;
    }
  }

  /**
   * Get total value of all materials
   */
  async getTotalValue(): Promise<number> {
    try {
      return await this.repository.getTotalValue();
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getTotalValue');
      throw error;
    }
  }

  /**
   * Get total value by category
   */
  async getTotalValueByCategory(): Promise<Record<MaterialCategory, number>> {
    try {
      return await this.repository.getTotalValueByCategory();
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getTotalValueByCategory');
      throw error;
    }
  }

  /**
   * Get stock summary
   */
  async getStockSummary(): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    try {
      return await this.repository.getStockSummary();
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getStockSummary');
      throw error;
    }
  }
}
