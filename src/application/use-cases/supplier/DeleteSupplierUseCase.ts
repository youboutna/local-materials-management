/**
 * Delete Supplier Use Case
 * Implements the business logic for deleting a supplier
 */

import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { Supplier } from '@/domain/entities/Supplier';
import { AppError, ErrorLogger } from '@/utils/errorHandling';

export interface DeleteSupplierResult {
  success: boolean;
  error?: string;
}

export class DeleteSupplierUseCase {
  constructor(private supplierRepository: ISupplierRepository) {}

  /**
   * Execute the delete supplier use case
   */
  async execute(supplierId: string): Promise<DeleteSupplierResult> {
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

      // Delete the supplier
      await this.supplierRepository.delete(supplierId);

      ErrorLogger.log('info', 'Supplier deleted successfully', {
        supplierId,
        supplierName: existingSupplier.name
      });

      return {
        success: true
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete supplier';
      ErrorLogger.log('error', 'DeleteSupplierUseCase failed', { supplierId, error: errorMessage });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
