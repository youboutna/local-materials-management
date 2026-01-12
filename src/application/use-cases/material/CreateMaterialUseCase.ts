/**
 * Create Material Use Case
 * Creates a new material in the system
 */

import { Material, MaterialCategory } from '@/domain/entities/Material';
import { IMaterialRepository } from '@/domain/repositories';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface CreateMaterialInput {
  name: string;
  description: string;
  category: MaterialCategory;
  unit: string;
  pricePerUnit: number;
  availableQuantity: number;
  image?: string;
  sku?: string;
  ean?: string;
  gtin?: string;
  asin?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  workspaceId?: string;
}

export interface CreateMaterialResult {
  success: boolean;
  material?: Material;
  error?: string;
}

export class CreateMaterialUseCase {
  private materialRepository: IMaterialRepository;

  constructor(materialRepository?: IMaterialRepository) {
    this.materialRepository = materialRepository || RepositoryFactory.getMaterialRepository();
  }

  async execute(input: CreateMaterialInput): Promise<CreateMaterialResult> {
    try {
      // Validation
      if (!input.name || input.name.trim().length === 0) {
        return { success: false, error: 'Material name is required' };
      }

      if (!input.category) {
        return { success: false, error: 'Category is required' };
      }

      if (input.pricePerUnit < 0) {
        return { success: false, error: 'Price must be positive' };
      }

      if (input.availableQuantity < 0) {
        return { success: false, error: 'Quantity must be positive' };
      }

      // Create material entity using factory method
      const material = Material.create({
        id: crypto.randomUUID(),
        name: input.name.trim(),
        description: input.description || '',
        category: input.category,
        unit: input.unit,
        pricePerUnit: input.pricePerUnit,
        availableQuantity: input.availableQuantity,
        sku: input.sku,
        workspaceId: input.workspaceId
      });

      await this.materialRepository.save(material);

      return {
        success: true,
        material
      };
    } catch (error) {
      console.error('CreateMaterialUseCase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create material'
      };
    }
  }
}
