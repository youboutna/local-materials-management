/**
 * Get Suppliers List Use Case
 * Retrieves all suppliers with optional filtering
 */

import { Supplier, SupplierCategory, SupplierStatus } from '@/domain/entities/Supplier';
import { ISupplierRepository } from '@/domain/repositories';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface GetSuppliersListResult {
  success: boolean;
  suppliers: Supplier[];
  error?: string;
}

export interface SupplierFilters {
  category?: SupplierCategory;
  status?: SupplierStatus;
  search?: string;
  isActive?: boolean;
}

export class GetSuppliersListUseCase {
  private supplierRepository: ISupplierRepository;

  constructor(supplierRepository?: ISupplierRepository) {
    this.supplierRepository = supplierRepository || RepositoryFactory.getSupplierRepository();
  }

  async execute(filters?: SupplierFilters): Promise<GetSuppliersListResult> {
    try {
      let suppliers: Supplier[];

      if (filters?.category) {
        suppliers = await this.supplierRepository.findByCategory(filters.category);
      } else if (filters?.status) {
        suppliers = await this.supplierRepository.findByStatus(filters.status);
      } else if (filters?.isActive) {
        suppliers = await this.supplierRepository.findActive();
      } else {
        suppliers = await this.supplierRepository.findAll();
      }

      // Apply search filter in memory
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        suppliers = suppliers.filter(s => 
          s.name.toLowerCase().includes(searchLower) ||
          (s.email?.toLowerCase().includes(searchLower))
        );
      }

      return {
        success: true,
        suppliers
      };
    } catch (error) {
      console.error('GetSuppliersListUseCase error:', error);
      return {
        success: false,
        suppliers: [],
        error: error instanceof Error ? error.message : 'Failed to fetch suppliers'
      };
    }
  }
}
