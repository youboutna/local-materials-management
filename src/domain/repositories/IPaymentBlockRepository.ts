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
  // ✅ Ajout pour compatibilité avec PaymentService
  paymentId?: string;                // correspond à payment_request_id
}

export interface CreatePaymentBlockRecord {
  projectId: string;
  contractorId: string;
  amount: number;
  blockingReasons: PaymentBlockingReason[];
  blockedBy?: string | null;
  notes?: string | null;
  // ✅ Ajout optionnel
  paymentId?: string;
}

export interface IPaymentBlockRepository {
  // Méthodes existantes
  create(data: CreatePaymentBlockRecord): Promise<PaymentBlockRecord>;
  findById(id: string): Promise<PaymentBlockRecord | null>;
  findActiveByProjectAndContractor(projectId: string, contractorId: string): Promise<PaymentBlockRecord[]>;
  resolve(id: string, resolvedBy: string): Promise<PaymentBlockRecord>;

  // ✅ Nouvelles méthodes requises par PaymentService
  findActiveByProject(projectId: string): Promise<PaymentBlockRecord[]>;
  updateStatus(
    id: string,
    status: 'active' | 'resolved' | 'cancelled',
    resolvedBy?: string,
    resolutionNotes?: string
  ): Promise<void>;
}