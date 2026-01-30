/**
 * Supplier Service
 * Implements business logic for supplier management
 * Follows hexagonal architecture principles from PROMPTS.md
 */

import { ISupplierRepository } from '@/domain/repositories/ISupplierRepository';
import { Supplier } from '@/domain/entities/Supplier';
import { SupplierTransformer, SupplierDTO } from '@/dtos/transforms/SupplierTransformer';
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
  async createSupplier(supplierData: Partial<Supplier>): Promise<Supplier> {
    try {
      const id = crypto.randomUUID();
      
      // Create supplier via repository
      const newSupplier = new Supplier(
        id,
        supplierData.name || '',
        supplierData.email || null,
        supplierData.phone || null,
        supplierData.address || null,
        supplierData.nif || null,
        supplierData.category || null,
        supplierData.status || 'active',
        supplierData.rating || null,
        supplierData.contacts || [],
        supplierData.isVerified || false,
        null,
        supplierData.workspaceId || null,
        new Date().toISOString(),
        new Date().toISOString()
      );
      
      await this.supplierRepository.save(newSupplier);
      
      console.log('Supplier created successfully:', id);

      return newSupplier;
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

  // ========== DTO TRANSFORMATION METHODS ==========
  // For backward compatibility with existing components

  /**
   * Get all suppliers as DTOs (Legacy Compatibility)
   * Transforms domain entities to DTOs for UI consumption
   */
  async getAllSuppliersAsDTO(): Promise<SupplierDTO[]> {
    try {
      const suppliers = await this.supplierRepository.findAll();
      return SupplierTransformer.toDTOList(suppliers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get all suppliers';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  /**
   * Get supplier by ID as DTO (Legacy Compatibility)
   */
  async getSupplierByIdAsDTO(id: string): Promise<SupplierDTO | null> {
    try {
      const supplier = await this.supplierRepository.findById(id);
      if (!supplier) return null;
      
      return SupplierTransformer.toDTO(supplier);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get supplier';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  /**
   * Search suppliers as DTOs (Legacy Compatibility)
   */
  async searchSuppliersAsDTO(searchTerm: string): Promise<SupplierDTO[]> {
    try {
      const suppliers = await this.supplierRepository.search(searchTerm);
      return SupplierTransformer.toDTOList(suppliers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search suppliers';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  /**
   * Get active suppliers as DTOs (Legacy Compatibility)
   */
  async getActiveSuppliersAsDTO(): Promise<SupplierDTO[]> {
    try {
      const suppliers = await this.supplierRepository.findActive();
      return SupplierTransformer.toDTOList(suppliers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get active suppliers';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  /**
   * Create supplier from DTO (Legacy Compatibility)
   */
  async createSupplierFromDTO(supplierDTO: SupplierDTO): Promise<SupplierDTO> {
    try {
      const supplier = SupplierTransformer.toEntity(supplierDTO);
      await this.supplierRepository.save(supplier);
      return SupplierTransformer.toDTO(supplier);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create supplier';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  /**
   * Update supplier from DTO (Legacy Compatibility)
   */
  async updateSupplierFromDTO(id: string, supplierDTO: Partial<SupplierDTO>): Promise<SupplierDTO> {
    try {
      const existingSupplier = await this.supplierRepository.findById(id);
      if (!existingSupplier) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Supplier not found');
      }

      // Merge existing supplier with DTO updates
      const updatedSupplier = SupplierTransformer.toEntity({
        ...SupplierTransformer.toDTO(existingSupplier),
        ...supplierDTO
      });

      await this.supplierRepository.update(id, updatedSupplier);
      return SupplierTransformer.toDTO(updatedSupplier);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update supplier';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }
}
