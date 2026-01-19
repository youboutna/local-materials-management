/**
 * Update Supplier Use Case
 * Implements the business logic for updating a supplier
 */

import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { Supplier } from '@/domain/entities/Supplier';
import { AppError, ErrorLogger } from '@/utils/errorHandling';

export interface UpdateSupplierResult {
  success: boolean;
  supplier?: Supplier;
  error?: string;
}

export interface UpdateSupplierInput {
  name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  rating?: number;
  nif?: string;
  commerce_register_ref?: string;
}

export class UpdateSupplierUseCase {
  constructor(private supplierRepository: ISupplierRepository) {}

  /**
   * Execute the update supplier use case
   */
  async execute(supplierId: string, data: UpdateSupplierInput): Promise<UpdateSupplierResult> {
    try {
      // Validate input
      if (!supplierId || supplierId.trim() === '') {
        return {
          success: false,
          error: 'Supplier ID is required'
        };
      }

      // Check if supplier exists
      const existingSupplier = await this.supplierRepository.findById(supplierId);
      if (!existingSupplier) {
        return {
          success: false,
          error: 'Supplier not found'
        };
      }

      // Update the supplier
      const updatedSupplier = await this.supplierRepository.update(supplierId, data);

      ErrorLogger.log('info', 'Supplier updated successfully', {
        supplierId,
        supplierName: updatedSupplier.name
      });

      return {
        success: true,
        supplier: updatedSupplier
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update supplier';
      ErrorLogger.log('error', 'UpdateSupplierUseCase failed', { supplierId, error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
