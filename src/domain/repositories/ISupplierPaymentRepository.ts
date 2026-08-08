/**
 * Interface for Supplier Payment Repository
 * Following hexagonal architecture principles
 * 
 * Architecture Hexagonale - PORT
 * - Définit le contrat pour les opérations de paiement fournisseur
 * - L'implémentation est dans infrastructure/supabase/adapters/
 * - Utilisé par les services applicatifs
 * - Utilise les DTOs de SupplierPaymentDTO.ts
 */

import { 
  SupplierPaymentRequestDTO, 
  CreateSupplierPaymentRequestDTO,
  UpdateSupplierPaymentRequestDTO,
  SupplierPaymentStatus,
  SupplierPaymentStatsDTO,
  SupplierPaymentRequestListDTO
} from '@/dtos/entities/SupplierPaymentDTO';

export interface ISupplierPaymentRepository {
  /**
   * Find payment request by ID
   */
  findById(id: string): Promise<SupplierPaymentRequestDTO | null>;
  
  /**
   * Find payment request by inspection ID
   */
  findByInspectionId(inspectionId: string): Promise<SupplierPaymentRequestDTO | null>;
  
  /**
   * Find all payment requests for a supplier
   */
  findBySupplierId(supplierId: string): Promise<SupplierPaymentRequestDTO[]>;
  
  /**
   * Find all payment requests for a project
   */
  findByProjectId(projectId: string): Promise<SupplierPaymentRequestDTO[]>;
  
  /**
   * Find all pending payment requests
   */
  findPending(): Promise<SupplierPaymentRequestDTO[]>;
  
  /**
   * Find all payment requests by status
   */
  findByStatus(status: SupplierPaymentStatus): Promise<SupplierPaymentRequestDTO[]>;
  
  /**
   * Find all payment requests with pagination
   */
  findAll(page?: number, limit?: number): Promise<SupplierPaymentRequestListDTO>;
  
  /**
   * Get payment statistics
   */
  getStats(supplierId?: string): Promise<SupplierPaymentStatsDTO>;
  
  /**
   * Create a new payment request
   */
  create(data: CreateSupplierPaymentRequestDTO): Promise<SupplierPaymentRequestDTO>;
  
  /**
   * Update payment request status
   */
  updateStatus(id: string, status: SupplierPaymentStatus, comments?: string): Promise<SupplierPaymentRequestDTO>;
  
  /**
   * Update payment request
   */
  update(id: string, data: UpdateSupplierPaymentRequestDTO): Promise<SupplierPaymentRequestDTO>;
  
  /**
   * Delete payment request
   */
  delete(id: string): Promise<void>;
  
  /**
   * Get contractor supplier ID for a project
   */
  getContractorSupplierIdForProject(projectId: string): Promise<string | null>;
}