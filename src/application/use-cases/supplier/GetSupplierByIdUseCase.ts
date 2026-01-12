/**
 * Get Supplier By Id Use Case
 * Retrieves a single supplier by ID
 */

import { Supplier } from '@/domain/entities/Supplier';
import { ISupplierRepository } from '@/domain/repositories';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface GetSupplierByIdResult {
  success: boolean;
  supplier: Supplier | null;
  error?: string;
}

export class GetSupplierByIdUseCase {
  private supplierRepository: ISupplierRepository;

  constructor(supplierRepository?: ISupplierRepository) {
    this.supplierRepository = supplierRepository || RepositoryFactory.getSupplierRepository();
  }

  async execute(id: string): Promise<GetSupplierByIdResult> {
    try {
      if (!id) {
        return { success: false, supplier: null, error: 'Supplier ID is required' };
      }

      const supplier = await this.supplierRepository.findById(id);

      if (!supplier) {
        return { success: false, supplier: null, error: 'Supplier not found' };
      }

      return { success: true, supplier };
    } catch (error) {
      console.error('GetSupplierByIdUseCase error:', error);
      return {
        success: false,
        supplier: null,
        error: error instanceof Error ? error.message : 'Failed to fetch supplier'
      };
    }
  }
}
