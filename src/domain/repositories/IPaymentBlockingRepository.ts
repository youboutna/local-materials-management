/**
 * Payment Blocking Repository Interface
 * Defines contract for payment block and control action operations
 */

export interface PaymentBlock {
  id: string;
  paymentRequestId: string;
  blockReason: string;
  blockType: 'financial' | 'document' | 'compliance' | 'technical';
  status: 'active' | 'resolved' | 'cancelled';
  blockedAmount: number;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentControlAction {
  id: string;
  paymentBlockId: string;
  actionType: 'review' | 'approve' | 'reject' | 'request_document' | 'escalate';
  description: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  completedAt?: string;
}

export interface IPaymentBlockingRepository {
  /**
   * Create a payment block
   */
  createBlock(block: Omit<PaymentBlock, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentBlock>;

  /**
   * Get all active payment blocks
   */
  getActiveBlocks(): Promise<PaymentBlock[]>;

  /**
   * Get payment blocks by payment request ID
   */
  getBlocksByPaymentRequest(paymentRequestId: string): Promise<PaymentBlock[]>;

  /**
   * Get payment block by ID
   */
  getBlockById(blockId: string): Promise<PaymentBlock | null>;

  /**
   * Update payment block
   */
  updateBlock(blockId: string, updates: Partial<PaymentBlock>): Promise<PaymentBlock>;

  /**
   * Resolve payment block
   */
  resolveBlock(blockId: string, resolutionNotes: string, resolvedBy: string): Promise<PaymentBlock>;

  /**
   * Cancel payment block
   */
  cancelBlock(blockId: string): Promise<PaymentBlock>;

  /**
   * Check if payment is blocked
   */
  isPaymentBlocked(paymentRequestId: string): Promise<boolean>;

  /**
   * Get payment block statistics
   */
  getBlockStats(): Promise<{
    totalBlocks: number;
    activeBlocks: number;
    resolvedBlocks: number;
    cancelledBlocks: number;
    totalBlockedAmount: number;
    blocksByType: Record<string, number>;
  }>;

  /**
   * Create payment control action
   */
  createAction(action: Omit<PaymentControlAction, 'id' | 'created_at'>): Promise<PaymentControlAction>;

  /**
   * Get control actions by block ID
   */
  getActionsByBlockId(blockId: string): Promise<PaymentControlAction[]>;

  /**
   * Get control action by ID
   */
  getActionById(actionId: string): Promise<PaymentControlAction | null>;

  /**
   * Update control action
   */
  updateAction(actionId: string, updates: Partial<PaymentControlAction>): Promise<PaymentControlAction>;

  /**
   * Complete control action
   */
  completeAction(actionId: string): Promise<PaymentControlAction>;

  /**
   * Get overdue actions
   */
  getOverdueActions(): Promise<PaymentControlAction[]>;
}
