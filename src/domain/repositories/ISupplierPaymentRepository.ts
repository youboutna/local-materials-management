/**
 * Interface for Supplier Payment Repository
 * Following hexagonal architecture principles
 */

import { SupplierPaymentRequestDTO } from '@/dtos/entities/SupplierPaymentDTO';

export interface ISupplierPaymentRepository {
  /**
   * Find payment request by inspection ID
   */
  findByInspectionId(inspectionId: string): Promise<SupplierPaymentRequestDTO | null>;
  
  /**
   * Create a new payment request
   */
  create(data: Omit<SupplierPaymentRequestDTO, 'id' | 'createdAt' | 'updatedAt' | 'requestedAt' | 'processedAt'>): Promise<SupplierPaymentRequestDTO>;
  
  /**
   * Update payment request status
   */
  updateStatus(id: string, status: string, comments?: string): Promise<SupplierPaymentRequestDTO>;
  
  /**
   * Find payment request by ID
   */
  findById(id: string): Promise<SupplierPaymentRequestDTO | null>;
  
  /**
   * Find all payment requests for a supplier
   */
  findBySupplierId(supplierId: string): Promise<SupplierPaymentRequestDTO[]>;
  
  /**
   * Find all pending payment requests
   */
  findPending(): Promise<SupplierPaymentRequestDTO[]>;
}
