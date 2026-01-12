/**
 * Get Material By Id Use Case
 * Retrieves a single material by its ID
 */

import { Material } from '@/domain/entities/Material';
import { IMaterialRepository } from '@/domain/repositories';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface GetMaterialByIdResult {
  success: boolean;
  material: Material | null;
  error?: string;
}

export class GetMaterialByIdUseCase {
  private materialRepository: IMaterialRepository;

  constructor(materialRepository?: IMaterialRepository) {
    this.materialRepository = materialRepository || RepositoryFactory.getMaterialRepository();
  }

  async execute(id: string): Promise<GetMaterialByIdResult> {
    try {
      if (!id) {
        return {
          success: false,
          material: null,
          error: 'Material ID is required'
        };
      }

      const material = await this.materialRepository.findById(id);

      if (!material) {
        return {
          success: false,
          material: null,
          error: 'Material not found'
        };
      }

      return {
        success: true,
        material
      };
    } catch (error) {
      console.error('GetMaterialByIdUseCase error:', error);
      return {
        success: false,
        material: null,
        error: error instanceof Error ? error.message : 'Failed to fetch material'
      };
    }
  }
}
