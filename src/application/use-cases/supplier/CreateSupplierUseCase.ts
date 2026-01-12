/**
 * Create Supplier Use Case
 * Creates a new supplier
 */

import { Supplier, SupplierCategory } from '@/domain/entities/Supplier';
import { ISupplierRepository } from '@/domain/repositories';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export interface CreateSupplierInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  nif?: string;
  category?: SupplierCategory;
}

export interface CreateSupplierResult {
  success: boolean;
  supplier?: Supplier;
  error?: string;
}

export class CreateSupplierUseCase {
  private supplierRepository: ISupplierRepository;

  constructor(supplierRepository?: ISupplierRepository) {
    this.supplierRepository = supplierRepository || RepositoryFactory.getSupplierRepository();
  }

  async execute(input: CreateSupplierInput): Promise<CreateSupplierResult> {
    try {
      if (!input.name || input.name.trim().length === 0) {
        return { success: false, error: 'Supplier name is required' };
      }

      const supplier = Supplier.create({
        id: crypto.randomUUID(),
        name: input.name.trim(),
        email: input.email,
        phone: input.phone,
        address: input.address,
        nif: input.nif,
        category: input.category
      });

      await this.supplierRepository.save(supplier);

      return { success: true, supplier };
    } catch (error) {
      console.error('CreateSupplierUseCase error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create supplier'
      };
    }
  }
}
