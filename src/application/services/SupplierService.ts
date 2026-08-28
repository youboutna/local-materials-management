import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
/**
 * Supplier Service
 * Implements business logic for supplier management
 * Follows hexagonal architecture principles from PROMPTS.md
 */

import { Supplier, SupplierProps } from '@/domain/entities/Supplier';
import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import {
    SearchSuppliersOptions,
    SearchSuppliersResult
} from '@/dtos/entities/SupplierDTO';
import { SupplierTransformer } from '@/dtos/transforms/SupplierTransformer';
import { AppError, ErrorCode, ErrorLogger } from '@/utils/errorHandling';

/** Messages métier renvoyés par l'entité Supplier -> ValidationError (et non INTERNAL_ERROR). */
const VALIDATION_MARKERS = ['NIF', 'email', 'status'];

function toDomainError(error: unknown, fallback: string): AppError {
  const message = error instanceof Error ? error.message : fallback;
  const isValidation = VALIDATION_MARKERS.some((marker) => message.includes(marker));
  return new AppError(isValidation ? ErrorCode.VALIDATION_ERROR : ErrorCode.INTERNAL_ERROR, message);
}

export class SupplierService {
  constructor(private supplierRepository: ISupplierRepository) {}

  /**
   * Search suppliers with filters
   */
  async searchSuppliers(options: SearchSuppliersOptions = {}): Promise<SearchSuppliersResult> {
    try {
      let suppliers: Supplier[];
      
      if (options.searchTerm) {
        suppliers = await this.supplierRepository.search(options.searchTerm);
      } else if (options.isActive) {
        suppliers = await this.supplierRepository.findActive();
      } else {
        suppliers = await this.supplierRepository.findAll();
      }

      // Apply limit if specified
      if (options.limit && suppliers.length > options.limit) {
        suppliers = suppliers.slice(0, options.limit);
      }

      return {
        suppliers: SupplierTransformer.toSummaryDTOList(suppliers),
        total: suppliers.length
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search suppliers';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const supplier = await this.supplierRepository.findById(id);
      
      if (!supplier) {
        console.warn('Supplier not found:', id);
        return null;
      }

      return supplier;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get supplier';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  /**
   * Get all active suppliers
   */
  async getActiveSuppliers(): Promise<Supplier[]> {
    try {
      return await this.supplierRepository.findActive();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get active suppliers';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  /**
   * Create new supplier
   */
  async createSupplier(supplierData: Partial<SupplierProps> | Partial<Supplier>): Promise<Supplier> {
    try {
      const props = supplierData as Partial<SupplierProps>;
      const id = crypto.randomUUID();

      const newSupplier = Supplier.create({
        ...props,
        id,
        name: props.name || '',
        status: props.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as SupplierProps);

      await this.supplierRepository.save(newSupplier);
      console.log('Supplier created successfully:', id);
      return newSupplier;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const appError = toDomainError(error, 'Failed to create supplier');
      ErrorLogger.log(appError);
      throw appError;
    }
  }

  /**
   * Update supplier
   */
  async updateSupplier(id: string, supplierData: Partial<SupplierProps> | Partial<Supplier>): Promise<Supplier> {
    try {
      const existing = await this.supplierRepository.findById(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Supplier not found');
      }

      await this.supplierRepository.update(id, supplierData as Partial<Supplier>);
      console.log('Supplier updated successfully:', id);

      // Re-read to guarantee UI reflects the persisted state (round-trip UI -> DB -> UI)
      const refreshed = await this.supplierRepository.findById(id);
      return refreshed ?? existing;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const appError = toDomainError(error, 'Failed to update supplier');
      ErrorLogger.log(appError);
      throw appError;
    }
  }

  /**
   * Get all suppliers
   */
  async getAllSuppliers(): Promise<Supplier[]> {
    try {
      return await this.supplierRepository.findAll();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get all suppliers';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(id: string): Promise<void> {
    try {
      await this.supplierRepository.delete(id);
      
      console.log('Supplier deleted successfully:', id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete supplier';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

}

let supplierServiceInstance: SupplierService | null = null;
export function getSupplierService(): SupplierService {
  if (!supplierServiceInstance) {
    supplierServiceInstance = new SupplierService(RepositoryFactory.getSupplierRepository());
  }
  return supplierServiceInstance;
}
