// Repository interface for Payment entity
import { Payment, PaymentStatus } from '../entities/Payment';

export interface IPaymentRepository {
  // CRUD operations
  findById(id: string): Promise<Payment | null>;
  findAll(): Promise<Payment[]>;
  save(payment: Payment): Promise<void>;
  update(id: string, data: Partial<Payment>): Promise<void>;
  delete(id: string): Promise<void>;
  
  // Query methods
  findByProjectId(projectId: string): Promise<Payment[]>;
  findByPhaseId(phaseId: string): Promise<Payment[]>;
  findByStepId(stepId: string): Promise<Payment[]>;
  findByStatus(status: PaymentStatus): Promise<Payment[]>;
  findByInspectionId(inspectionId: string): Promise<Payment[]>;
  findByContractor(contractorName: string): Promise<Payment[]>;
  
  // Date-based queries
  findBetweenDates(startDate: string, endDate: string): Promise<Payment[]>;
  
  // Aggregations
  getTotalByProject(projectId: string): Promise<number>;
  getTotalByPhase(phaseId: string): Promise<number>;
  getTotalByStatus(projectId: string): Promise<Record<PaymentStatus, number>>;
  getPaymentSummary(projectId: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    rejected: number;
  }>;
}
