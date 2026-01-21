/**
 * Service for managing payment blocks and control actions
 * Uses in-memory storage as the required tables don't exist in the database
 */

export interface PaymentBlock {
  id: string;
  payment_request_id: string;
  block_reason: string;
  block_type: 'financial' | 'document' | 'compliance' | 'technical';
  status: 'active' | 'resolved' | 'cancelled';
  blocked_amount: number;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentControlAction {
  id: string;
  payment_block_id: string;
  action_type: 'review' | 'approve' | 'reject' | 'request_document' | 'escalate';
  description: string;
  assigned_to?: string;
  due_date?: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_by: string;
  created_at: string;
  completed_at?: string;
}

// In-memory stores
const blocksStore = new Map<string, PaymentBlock>();
const actionsStore = new Map<string, PaymentControlAction>();

export class PaymentBlockingService {
  /**
   * Block a payment request
   */
  static async blockPayment(
    paymentRequestId: string,
    blockReason: string,
    blockType: PaymentBlock['block_type'],
    blockedAmount: number
  ): Promise<PaymentBlock> {
    const now = new Date().toISOString();
    const block: PaymentBlock = {
      id: crypto.randomUUID(),
      payment_request_id: paymentRequestId,
      block_reason: blockReason,
      block_type: blockType,
      blocked_amount: blockedAmount,
      status: 'active',
      created_at: now,
      updated_at: now
    };
    
    blocksStore.set(block.id, block);
    return block;
  }

  /**
   * Get all active payment blocks
   */
  static async getActivePaymentBlocks(): Promise<PaymentBlock[]> {
    const blocks: PaymentBlock[] = [];
    blocksStore.forEach(block => {
      if (block.status === 'active') {
        blocks.push(block);
      }
    });
    return blocks.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Get payment blocks for a specific payment request
   */
  static async getPaymentBlocks(paymentRequestId: string): Promise<PaymentBlock[]> {
    const blocks: PaymentBlock[] = [];
    blocksStore.forEach(block => {
      if (block.payment_request_id === paymentRequestId) {
        blocks.push(block);
      }
    });
    return blocks.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Resolve a payment block
   */
  static async resolvePaymentBlock(
    blockId: string,
    resolutionNotes: string,
    resolvedBy: string
  ): Promise<PaymentBlock> {
    const block = blocksStore.get(blockId);
    if (!block) {
      throw new Error('Payment block not found');
    }

    const now = new Date().toISOString();
    const updatedBlock: PaymentBlock = {
      ...block,
      status: 'resolved',
      resolved_at: now,
      resolved_by: resolvedBy,
      resolution_notes: resolutionNotes,
      updated_at: now
    };

    blocksStore.set(blockId, updatedBlock);
    return updatedBlock;
  }

  /**
   * Cancel a payment block
   */
  static async cancelPaymentBlock(blockId: string): Promise<PaymentBlock> {
    const block = blocksStore.get(blockId);
    if (!block) {
      throw new Error('Payment block not found');
    }

    const updatedBlock: PaymentBlock = {
      ...block,
      status: 'cancelled',
      updated_at: new Date().toISOString()
    };

    blocksStore.set(blockId, updatedBlock);
    return updatedBlock;
  }

  /**
   * Check if a payment is blocked
   */
  static async isPaymentBlocked(paymentRequestId: string): Promise<boolean> {
    let isBlocked = false;
    blocksStore.forEach(block => {
      if (block.payment_request_id === paymentRequestId && block.status === 'active') {
        isBlocked = true;
      }
    });
    return isBlocked;
  }

  /**
   * Get payment block history for a payment request
   */
  static async getPaymentBlockHistory(paymentRequestId: string): Promise<PaymentBlock[]> {
    return this.getPaymentBlocks(paymentRequestId);
  }

  /**
   * Get payment block statistics
   */
  static async getPaymentBlockStats(): Promise<{
    total: number;
    active: number;
    resolved: number;
    cancelled: number;
    totalBlockedAmount: number;
  }> {
    let total = 0;
    let active = 0;
    let resolved = 0;
    let cancelled = 0;
    let totalBlockedAmount = 0;

    blocksStore.forEach(block => {
      total++;
      totalBlockedAmount += block.blocked_amount || 0;
      if (block.status === 'active') active++;
      if (block.status === 'resolved') resolved++;
      if (block.status === 'cancelled') cancelled++;
    });

    return { total, active, resolved, cancelled, totalBlockedAmount };
  }

  /**
   * Create a payment control action
   */
  static async createPaymentControlAction(
    blockId: string,
    actionType: PaymentControlAction['action_type'],
    description: string,
    assignedTo?: string,
    dueDate?: string,
    createdBy?: string
  ): Promise<PaymentControlAction> {
    const now = new Date().toISOString();
    const action: PaymentControlAction = {
      id: crypto.randomUUID(),
      payment_block_id: blockId,
      action_type: actionType,
      description: description,
      status: 'pending',
      assigned_to: assignedTo,
      due_date: dueDate,
      created_by: createdBy || 'system',
      created_at: now
    };

    actionsStore.set(action.id, action);
    return action;
  }

  /**
   * Get control actions for a payment block
   */
  static async getPaymentControlActions(blockId: string): Promise<PaymentControlAction[]> {
    const actions: PaymentControlAction[] = [];
    actionsStore.forEach(action => {
      if (action.payment_block_id === blockId) {
        actions.push(action);
      }
    });
    return actions.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Complete a payment control action
   */
  static async completePaymentControlAction(actionId: string): Promise<PaymentControlAction> {
    const action = actionsStore.get(actionId);
    if (!action) {
      throw new Error('Payment control action not found');
    }

    const updatedAction: PaymentControlAction = {
      ...action,
      status: 'completed',
      completed_at: new Date().toISOString()
    };

    actionsStore.set(actionId, updatedAction);
    return updatedAction;
  }

  /**
   * Get overdue control actions
   */
  static async getOverdueActions(): Promise<PaymentControlAction[]> {
    const now = new Date();
    const overdue: PaymentControlAction[] = [];
    
    actionsStore.forEach(action => {
      if (action.status === 'pending' && action.due_date) {
        const dueDate = new Date(action.due_date);
        if (dueDate < now) {
          overdue.push(action);
        }
      }
    });
    
    return overdue.sort((a, b) => 
      new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
    );
  }
}
