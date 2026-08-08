/**
 * Payment Block Repository Interface
 * Maps to the real `btp.payment_blocks` table (project_id / contractor_id based).
 */

export interface PaymentBlockingReason {
  reason: string;
  description?: string;
  severity?: 'warning' | 'blocking';
}

export interface PaymentBlockRecord {
  id: string;
  projectId: string;
  contractorId: string;
  amount: number;
  blockingReasons: PaymentBlockingReason[];
  blockedAt: string;
  blockedBy: string | null;
  notes: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface CreatePaymentBlockRecord {
  projectId: string;
  contractorId: string;
  amount: number;
  blockingReasons: PaymentBlockingReason[];
  blockedBy?: string | null;
  notes?: string | null;
}

export interface IPaymentBlockRepository {
  create(data: CreatePaymentBlockRecord): Promise<PaymentBlockRecord>;
  findById(id: string): Promise<PaymentBlockRecord | null>;
  findActiveByProjectAndContractor(projectId: string, contractorId: string): Promise<PaymentBlockRecord[]>;
  resolve(id: string, resolvedBy: string): Promise<PaymentBlockRecord>;
}
