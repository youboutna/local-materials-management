import { supabase } from '@/integrations/supabase/client';

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

export class PaymentBlockingService {
  
  /**
   * Block a payment request
   * @param paymentRequestId The payment request ID
   * @param blockReason The reason for blocking
   * @param blockType The type of block
   * @param blockedAmount The amount to block
   * @returns The created payment block
   */
  static async blockPayment(
    paymentRequestId: string,
    blockReason: string,
    blockType: PaymentBlock['block_type'],
    blockedAmount: number
  ): Promise<PaymentBlock> {
    const { data, error } = await supabase
      .from('payment_blocks')
      .insert({
        payment_request_id: paymentRequestId,
        block_reason: blockReason,
        block_type: blockType,
        blocked_amount: blockedAmount,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error blocking payment:', error);
      throw new Error(`Failed to block payment: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all active payment blocks
   * @returns Array of active payment blocks
   */
  static async getActivePaymentBlocks(): Promise<PaymentBlock[]> {
    const { data, error } = await supabase
      .from('payment_blocks')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active payment blocks:', error);
      throw new Error(`Failed to fetch active payment blocks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get payment blocks for a specific payment request
   * @param paymentRequestId The payment request ID
   * @returns Array of payment blocks
   */
  static async getPaymentBlocks(paymentRequestId: string): Promise<PaymentBlock[]> {
    const { data, error } = await supabase
      .from('payment_blocks')
      .select('*')
      .eq('payment_request_id', paymentRequestId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment blocks:', error);
      throw new Error(`Failed to fetch payment blocks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Resolve a payment block
   * @param blockId The block ID
   * @param resolutionNotes The resolution notes
   * @param resolvedBy The user who resolved the block
   * @returns The updated payment block
   */
  static async resolvePaymentBlock(
    blockId: string,
    resolutionNotes: string,
    resolvedBy: string
  ): Promise<PaymentBlock> {
    const { data, error } = await supabase
      .from('payment_blocks')
      .update({
        status: 'resolved',
        resolution_notes: resolutionNotes,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString()
      })
      .eq('id', blockId)
      .select()
      .single();

    if (error) {
      console.error('Error resolving payment block:', error);
      throw new Error(`Failed to resolve payment block: ${error.message}`);
    }

    return data;
  }

  /**
   * Cancel a payment block
   * @param blockId The block ID
   * @returns The updated payment block
   */
  static async cancelPaymentBlock(blockId: string): Promise<PaymentBlock> {
    const { data, error } = await supabase
      .from('payment_blocks')
      .update({
        status: 'cancelled'
      })
      .eq('id', blockId)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling payment block:', error);
      throw new Error(`Failed to cancel payment block: ${error.message}`);
    }

    return data;
  }

  /**
   * Check if a payment request is blocked
   * @param paymentRequestId The payment request ID
   * @returns True if blocked, false otherwise
   */
  static async isPaymentBlocked(paymentRequestId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('payment_blocks')
      .select('id')
      .eq('payment_request_id', paymentRequestId)
      .eq('status', 'active')
      .limit(1);

    if (error) {
      console.error('Error checking payment block status:', error);
      throw new Error(`Failed to check payment block status: ${error.message}`);
    }

    return (data && data.length > 0) || false;
  }

  /**
   * Get payment block history for a payment request
   * @param paymentRequestId The payment request ID
   * @returns Array of payment blocks (all statuses)
   */
  static async getPaymentBlockHistory(paymentRequestId: string): Promise<PaymentBlock[]> {
    const { data, error } = await supabase
      .from('payment_blocks')
      .select('*')
      .eq('payment_request_id', paymentRequestId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment block history:', error);
      throw new Error(`Failed to fetch payment block history: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get payment block statistics
   * @returns Statistics object
   */
  static async getPaymentBlockStats(): Promise<{
    total: number;
    active: number;
    resolved: number;
    cancelled: number;
    totalBlockedAmount: number;
  }> {
    const { data, error } = await supabase
      .from('payment_blocks')
      .select('status, blocked_amount');

    if (error) {
      console.error('Error fetching payment block stats:', error);
      throw new Error(`Failed to fetch payment block stats: ${error.message}`);
    }

    const stats = {
      total: data?.length || 0,
      active: 0,
      resolved: 0,
      cancelled: 0,
      totalBlockedAmount: 0
    };

    if (data) {
      for (const block of data) {
        stats.totalBlockedAmount += block.blocked_amount || 0;
        
        switch (block.status) {
          case 'active':
            stats.active++;
            break;
          case 'resolved':
            stats.resolved++;
            break;
          case 'cancelled':
            stats.cancelled++;
            break;
        }
      }
    }

    return stats;
  }

  /**
   * Create a payment control action
   * @param blockId The payment block ID
   * @param actionType The type of action
   * @param description The action description
   * @param assignedTo The user assigned to the action
   * @param dueDate The due date for the action
   * @param createdBy The user creating the action
   * @returns The created payment control action
   */
  static async createPaymentControlAction(
    blockId: string,
    actionType: PaymentControlAction['action_type'],
    description: string,
    assignedTo?: string,
    dueDate?: string,
    createdBy?: string
  ): Promise<PaymentControlAction> {
    const { data, error } = await supabase
      .from('payment_control_actions')
      .insert({
        payment_block_id: blockId,
        action_type: actionType,
        description,
        assigned_to: assignedTo,
        due_date: dueDate,
        status: 'pending',
        created_by: createdBy
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment control action:', error);
      throw new Error(`Failed to create payment control action: ${error.message}`);
    }

    return data;
  }

  /**
   * Get payment control actions for a block
   * @param blockId The payment block ID
   * @returns Array of payment control actions
   */
  static async getPaymentControlActions(blockId: string): Promise<PaymentControlAction[]> {
    const { data, error } = await supabase
      .from('payment_control_actions')
      .select('*')
      .eq('payment_block_id', blockId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment control actions:', error);
      throw new Error(`Failed to fetch payment control actions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Complete a payment control action
   * @param actionId The action ID
   * @returns The updated payment control action
   */
  static async completePaymentControlAction(actionId: string): Promise<PaymentControlAction> {
    const { data, error } = await supabase
      .from('payment_control_actions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', actionId)
      .select()
      .single();

    if (error) {
      console.error('Error completing payment control action:', error);
      throw new Error(`Failed to complete payment control action: ${error.message}`);
    }

    return data;
  }

  /**
   * Get overdue payment control actions
   * @returns Array of overdue actions
   */
  static async getOverdueActions(): Promise<PaymentControlAction[]> {
    const { data, error } = await supabase
      .from('payment_control_actions')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching overdue actions:', error);
      throw new Error(`Failed to fetch overdue actions: ${error.message}`);
    }

    return data || [];
  }
}
