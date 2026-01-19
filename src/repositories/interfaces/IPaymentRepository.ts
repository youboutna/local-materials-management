/**
 * Interface for Payment Repository
 * Defines the contract for payment data access operations
 */

import { PaymentDTO, CreatePaymentDTO, UpdatePaymentDTO } from '@/types/payment-dto';

export interface IPaymentRepository {
  // ============= CRUD Operations =============
  findById(id: string): Promise<PaymentDTO | null>;
  findAll(filters?: Record<string, any>): Promise<PaymentDTO[]>;
  create(data: CreatePaymentDTO): Promise<PaymentDTO>;
  update(id: string, data: UpdatePaymentDTO): Promise<PaymentDTO>;
  delete(id: string): Promise<void>;

  // ============= Payment-Specific Operations =============
  findByProjectId(projectId: string): Promise<PaymentDTO[]>;
  findByStatus(status: string): Promise<PaymentDTO[]>;
  findByDateRange(startDate: string, endDate: string): Promise<PaymentDTO[]>;
  findBySupplier(supplierId: string): Promise<PaymentDTO[]>;
  findOverdue(): Promise<PaymentDTO[]>;
  findPending(): Promise<PaymentDTO[]>;
  updateStatus(id: string, status: string): Promise<PaymentDTO>;
}
