/**
 * Get Materials List Use Case
 * Retrieves all materials with optional filtering
 */

import { Material, MaterialCategory } from '@/domain/entities/Material';
import { IMaterialRepository } from '@/domain/repositories';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface GetMaterialsListResult {
  success: boolean;
  materials: Material[];
  error?: string;
}

export interface MaterialFilters {
  category?: MaterialCategory | 'all';
  search?: string;
  minQuantity?: number;
  maxQuantity?: number;
}

export class GetMaterialsListUseCase {
  private materialRepository: IMaterialRepository;

  constructor(materialRepository?: IMaterialRepository) {
    this.materialRepository = materialRepository || RepositoryFactory.getMaterialRepository();
  }

  async execute(filters?: MaterialFilters): Promise<GetMaterialsListResult> {
    try {
      let materials: Material[];

      if (filters?.category && filters.category !== 'all') {
        materials = await this.materialRepository.findByCategory(filters.category);
      } else {
        materials = await this.materialRepository.findAll();
      }

      // Apply additional filters in memory if needed
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        materials = materials.filter(m => 
          m.name.toLowerCase().includes(searchLower) ||
          m.description.toLowerCase().includes(searchLower)
        );
      }

      if (filters?.minQuantity !== undefined) {
        materials = materials.filter(m => m.availableQuantity >= filters.minQuantity!);
      }

      if (filters?.maxQuantity !== undefined) {
        materials = materials.filter(m => m.availableQuantity <= filters.maxQuantity!);
      }

      return {
        success: true,
        materials
      };
    } catch (error) {
      console.error('GetMaterialsListUseCase error:', error);
      return {
        success: false,
        materials: [],
        error: error instanceof Error ? error.message : 'Failed to fetch materials'
      };
    }
  }
}
