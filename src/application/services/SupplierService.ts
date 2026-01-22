/**
 * Supplier Service
 * Implements business logic for supplier management
 */

import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { Supplier } from '@/domain/entities/Supplier';
import { AppError, ErrorCode, ErrorLogger } from '@/utils/errorHandling';

export interface SearchSuppliersOptions {
  searchTerm?: string;
  isActive?: boolean;
  limit?: number;
}

export interface SearchSuppliersResult {
  suppliers: Supplier[];
  total: number;
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
        suppliers,
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
  async createSupplier(supplierData: Omit<Supplier, 'id'>): Promise<Supplier> {
    try {
      const supplier: Supplier = {
        id: crypto.randomUUID(),
        ...supplierData
      };
      
      await this.supplierRepository.save(supplier);
      
      console.log('Supplier created successfully:', supplier.id);

      return supplier;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create supplier';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  /**
   * Update supplier
   */
  async updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<Supplier> {
    try {
      const existing = await this.supplierRepository.findById(id);
      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Supplier not found');
      }
      
      await this.supplierRepository.update(id, supplierData);
      
      console.log('Supplier updated successfully:', id);

      return { ...existing, ...supplierData } as Supplier;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update supplier';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
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
