/**
 * Update Material Use Case
 * Updates an existing material
 */

import { Material, MaterialCategory } from '@/domain/entities/Material';
import { IMaterialRepository } from '@/domain/repositories';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface UpdateMaterialInput {
  id: string;
  name?: string;
  description?: string;
  category?: MaterialCategory;
  unit?: string;
  pricePerUnit?: number;
  availableQuantity?: number;
  image?: string;
  sku?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UpdateMaterialResult {
  success: boolean;
  material?: Material;
  error?: string;
}

export class UpdateMaterialUseCase {
  private materialRepository: IMaterialRepository;

  constructor(materialRepository?: IMaterialRepository) {
    this.materialRepository = materialRepository || RepositoryFactory.getMaterialRepository();
  }

  async execute(input: UpdateMaterialInput): Promise<UpdateMaterialResult> {
    try {
      if (!input.id) {
        return { success: false, error: 'Material ID is required' };
      }

      // Check if material exists
      const existingMaterial = await this.materialRepository.findById(input.id);
      if (!existingMaterial) {
        return { success: false, error: 'Material not found' };
      }

      // Validation
      if (input.pricePerUnit !== undefined && input.pricePerUnit < 0) {
        return { success: false, error: 'Price must be positive' };
      }

      if (input.availableQuantity !== undefined && input.availableQuantity < 0) {
        return { success: false, error: 'Quantity must be positive' };
      }

      // Build partial update object for repository
      const updateData: Record<string, any> = {};
      
      if (input.name !== undefined) updateData['name'] = input.name;
      if (input.description !== undefined) updateData['description'] = input.description;
      if (input.category !== undefined) updateData['category'] = input.category;
      if (input.unit !== undefined) updateData['unit'] = input.unit;
      if (input.pricePerUnit !== undefined) updateData['pricePerUnit'] = input.pricePerUnit;
      if (input.availableQuantity !== undefined) updateData['availableQuantity'] = input.availableQuantity;
      if (input.image !== undefined) updateData['image'] = input.image;
      if (input.sku !== undefined) updateData['sku'] = input.sku;
      if (input.coordinates !== undefined) updateData['coordinates'] = input.coordinates;

      await this.materialRepository.update(input.id, updateData as Partial<Material>);

      // Fetch updated material
      const updatedMaterial = await this.materialRepository.findById(input.id);

      return {
        success: true,
        material: updatedMaterial || undefined
      };
    } catch (error) {
      console.error('UpdateMaterialUseCase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update material'
      };
    }
  }
}
