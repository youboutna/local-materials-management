/**
 * Supplier Service
 * Implements business logic for supplier management
 */

import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { Supplier } from '@/domain/entities/Supplier';
import { AppError, ErrorLogger } from '@/utils/errorHandling';

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
      const result = await this.supplierRepository.searchSuppliers(options);
      
      ErrorLogger.log('info', 'Suppliers searched successfully', {
        searchTerm: options.searchTerm,
        isActive: options.isActive,
        resultCount: result.suppliers.length
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search suppliers';
      ErrorLogger.log('error', 'SupplierService.searchSuppliers failed', { 
        options, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'SUPPLIER_SEARCH_ERROR');
    }
  }

  /**
   * Get supplier by ID
   */
  async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const supplier = await this.supplierRepository.findById(id);
      
      if (!supplier) {
        ErrorLogger.log('warning', 'Supplier not found', { supplierId: id });
        return null;
      }

      return supplier;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get supplier';
      ErrorLogger.log('error', 'SupplierService.getSupplierById failed', { 
        supplierId: id, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'SUPPLIER_GET_ERROR');
    }
  }

  /**
   * Get all active suppliers
   */
  async getActiveSuppliers(): Promise<Supplier[]> {
    try {
      const result = await this.supplierRepository.searchSuppliers({ 
        isActive: true,
        limit: 100 
      });
      
      return result.suppliers;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get active suppliers';
      ErrorLogger.log('error', 'SupplierService.getActiveSuppliers failed', { 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'ACTIVE_SUPPLIERS_ERROR');
    }
  }

  /**
   * Create new supplier
   */
  async createSupplier(supplierData: Omit<Supplier, 'id'>): Promise<Supplier> {
    try {
      const supplier = await this.supplierRepository.create(supplierData);
      
      ErrorLogger.log('info', 'Supplier created successfully', {
        supplierId: supplier.id,
        supplierName: supplier.name
      });

      return supplier;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create supplier';
      ErrorLogger.log('error', 'SupplierService.createSupplier failed', { 
        supplierData, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'SUPPLIER_CREATE_ERROR');
    }
  }

  /**
   * Update supplier
   */
  async updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<Supplier> {
    try {
      const supplier = await this.supplierRepository.update(id, supplierData);
      
      ErrorLogger.log('info', 'Supplier updated successfully', {
        supplierId: id,
        updatedFields: Object.keys(supplierData)
      });

      return supplier;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update supplier';
      ErrorLogger.log('error', 'SupplierService.updateSupplier failed', { 
        supplierId: id, 
        supplierData, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'SUPPLIER_UPDATE_ERROR');
    }
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(id: string): Promise<void> {
    try {
      await this.supplierRepository.delete(id);
      
      ErrorLogger.log('info', 'Supplier deleted successfully', {
        supplierId: id
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete supplier';
      ErrorLogger.log('error', 'SupplierService.deleteSupplier failed', { 
        supplierId: id, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'SUPPLIER_DELETE_ERROR');
    }
  }
}
