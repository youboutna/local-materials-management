import { MaterialRepository } from './MaterialRepository';
import { MaterialEntity, ProjectMaterialEntity } from '@/types/material.entity';
import { AppError, ErrorLogger } from '@/utils/errorHandling';

export class MaterialService {
  /**
   * Get all available materials
   */
  static async getAllMaterials(): Promise<MaterialEntity[]> {
    try {
      return await MaterialRepository.getAllMaterials();
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getAllMaterials');
      throw error;
    }
  }

  /**
   * Get materials for a specific project with details
   */
  static async getProjectMaterials(projectId: string): Promise<(ProjectMaterialEntity & { materials: MaterialEntity })[]> {
    try {
      return await MaterialRepository.getProjectMaterials(projectId);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getProjectMaterials');
      throw error;
    }
  }

  /**
   * Add material to a project
   */
  static async addMaterialToProject(
    projectId: string,
    materialId: string,
    quantity: number
  ): Promise<ProjectMaterialEntity> {
    try {
      // Validate inputs
      if (quantity <= 0) {
        throw new AppError(
          'VALIDATION_ERROR' as any,
          'Quantity must be greater than 0',
          undefined,
          { quantity }
        );
      }

      return await MaterialRepository.addMaterialToProject(projectId, materialId, quantity);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.addMaterialToProject');
      throw error;
    }
  }

  /**
   * Update project material (quantity, cost, status, etc.)
   */
  static async updateProjectMaterial(
    id: string,
    updates: Partial<ProjectMaterialEntity>
  ): Promise<ProjectMaterialEntity> {
    try {
      return await MaterialRepository.updateProjectMaterial(id, updates);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.updateProjectMaterial');
      throw error;
    }
  }

  /**
   * Remove material from a project
   */
  static async removeMaterialFromProject(id: string): Promise<void> {
    try {
      await MaterialRepository.removeMaterialFromProject(id);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.removeMaterialFromProject');
      throw error;
    }
  }

  /**
   * Calculate total estimated cost for project materials
   */
  static calculateTotalEstimatedCost(materials: (ProjectMaterialEntity & { materials: MaterialEntity })[]): number {
    return materials.reduce((total, pm) => {
      const unitPrice = pm.materials.unit_price || 0;
      const quantity = pm.quantity || 0;
      return total + (unitPrice * quantity);
    }, 0);
  }

  /**
   * Calculate total actual cost for project materials
   */
  static calculateTotalActualCost(materials: ProjectMaterialEntity[]): number {
    return materials.reduce((total, pm) => {
      return total + (pm.actual_cost || 0);
    }, 0);
  }

  /**
   * Get materials by category
   */
  static async getMaterialsByCategory(category: string): Promise<MaterialEntity[]> {
    try {
      const allMaterials = await MaterialRepository.getAllMaterials();
      return allMaterials.filter(m => m.category === category);
    } catch (error) {
      ErrorLogger.log(error as Error, 'MaterialService.getMaterialsByCategory');
      throw error;
    }
  }
}
