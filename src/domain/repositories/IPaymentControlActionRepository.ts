/**
 * Payment Control Action Repository Interface
 * Maps to the real `btp.payment_control_actions` table (attached to a payment_block).
 */

export interface PaymentControlActionRecord {
  id: string;
  paymentBlockId: string;
  actionType: string;
  description: string | null;
  assignedTo: string | null;
  dueDate: string | null;
  status: string;
  createdBy: string | null;
  createdAt: string;
  completedAt: string | null;
  updatedAt: string;
}

export interface CreatePaymentControlActionRecord {
  paymentBlockId: string;
  actionType: string;
  description?: string | null;
  assignedTo?: string | null;
  dueDate?: string | null;
  status?: string;
  createdBy?: string | null;
}

export interface IPaymentControlActionRepository {
  create(data: CreatePaymentControlActionRecord): Promise<PaymentControlActionRecord>;
  findByBlockId(blockId: string): Promise<PaymentControlActionRecord[]>;
  complete(id: string): Promise<PaymentControlActionRecord>;
}
