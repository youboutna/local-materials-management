/**
 * Payment Blocking Supabase Adapter
 * Implements IPaymentBlockingRepository using Supabase
 */

import { IPaymentBlockingRepository, PaymentBlock, PaymentControlAction } from '@/domain/repositories/IPaymentBlockingRepository';
import { supabase } from '@/integrations/supabase/client';

export class PaymentBlockingAdapter implements IPaymentBlockingRepository {
  /**
   * Create a payment block
   */
  async createBlock(block: Omit<PaymentBlock, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentBlock> {
    try {
      const { data, error } = await supabase
        .from('payment_blocks')
        .insert({
          payment_request_id: block.payment_request_id,
          block_reason: block.block_reason,
          block_type: block.block_type,
          status: block.status,
          blocked_amount: block.blocked_amount,
          resolution_notes: block.resolution_notes,
          resolved_by: block.resolved_by,
          resolved_at: block.resolved_at,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapRowToPaymentBlock(data);
    } catch (error) {
      console.error('PaymentBlockingAdapter.createBlock failed:', error);
      throw error;
    }
  }

  /**
   * Get all active payment blocks
   */
  async getActiveBlocks(): Promise<PaymentBlock[]> {
    try {
      const { data, error } = await supabase
        .from('payment_blocks')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToPaymentBlock(row));
    } catch (error) {
      console.error('PaymentBlockingAdapter.getActiveBlocks failed:', error);
      throw error;
    }
  }

  /**
   * Get payment blocks by payment request ID
   */
  async getBlocksByPaymentRequest(paymentRequestId: string): Promise<PaymentBlock[]> {
    try {
      const { data, error } = await supabase
        .from('payment_blocks')
        .select('*')
        .eq('payment_request_id', paymentRequestId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(row => this.mapRowToPaymentBlock(row));
    } catch (error) {
      console.error('PaymentBlockingAdapter.getBlocksByPaymentRequest failed:', error);
      throw error;
    }
  }

  /**
   * Get payment block by ID
   */
  async getBlockById(blockId: string): Promise<PaymentBlock | null> {
    try {
      const { data, error } = await supabase
        .from('payment_blocks')
        .select('*')
        .eq('id', blockId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return this.mapRowToPaymentBlock(data);
    } catch (error) {
      console.error('PaymentBlockingAdapter.getBlockById failed:', error);
      throw error;
    }
  }

  /**
   * Update payment block
   */
  async updateBlock(blockId: string, updates: Partial<PaymentBlock>): Promise<PaymentBlock> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('payment_blocks')
        .update(updateData)
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;

      return this.mapRowToPaymentBlock(data);
    } catch (error) {
      console.error('PaymentBlockingAdapter.updateBlock failed:', error);
      throw error;
    }
  }

  /**
   * Resolve payment block
   */
  async resolveBlock(blockId: string, resolutionNotes: string, resolvedBy: string): Promise<PaymentBlock> {
    try {
      const { data, error } = await supabase
        .from('payment_blocks')
        .update({
          status: 'resolved',
          resolution_notes: resolutionNotes,
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;

      return this.mapRowToPaymentBlock(data);
    } catch (error) {
      console.error('PaymentBlockingAdapter.resolveBlock failed:', error);
      throw error;
    }
  }

  /**
   * Cancel payment block
   */
  async cancelBlock(blockId: string): Promise<PaymentBlock> {
    try {
      const { data, error } = await supabase
        .from('payment_blocks')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;

      return this.mapRowToPaymentBlock(data);
    } catch (error) {
      console.error('PaymentBlockingAdapter.cancelBlock failed:', error);
      throw error;
    }
  }

  /**
   * Check if payment is blocked
   */
  async isPaymentBlocked(paymentRequestId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('payment_blocks')
        .select('id')
        .eq('payment_request_id', paymentRequestId)
        .eq('status', 'active')
        .limit(1);

      if (error) throw error;

      return data.length > 0;
    } catch (error) {
      console.error('PaymentBlockingAdapter.isPaymentBlocked failed:', error);
      throw error;
    }
  }

  /**
   * Get payment block statistics
   */
  async getBlockStats(): Promise<{
    totalBlocks: number;
    activeBlocks: number;
    resolvedBlocks: number;
    cancelledBlocks: number;
    totalBlockedAmount: number;
    blocksByType: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('payment_blocks')
        .select('status, block_type, blocked_amount');

      if (error) throw error;

      const stats = {
        totalBlocks: data.length,
        activeBlocks: data.filter(block => block.status === 'active').length,
        resolvedBlocks: data.filter(block => block.status === 'resolved').length,
        cancelledBlocks: data.filter(block => block.status === 'cancelled').length,
        totalBlockedAmount: data.reduce((sum, block) => sum + (block.blocked_amount || 0), 0),
        blocksByType: data.reduce((acc, block) => {
          const type = block.block_type || 'unknown';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      return stats;
    } catch (error) {
      console.error('PaymentBlockingAdapter.getBlockStats failed:', error);
      throw error;
    }
  }

  /**
   * Create payment control action
   */
  async createAction(action: Omit<PaymentControlAction, 'id' | 'created_at'>): Promise<PaymentControlAction> {
    try {
      const { data, error } = await supabase
        .from('payment_control_actions')
        .insert({
          payment_block_id: action.payment_block_id,
          action_type: action.action_type,
          description: action.description,
          assigned_to: action.assigned_to,
          due_date: action.due_date,
          status: action.status,
          created_by: action.created_by,
          completed_at: action.completed_at,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapRowToPaymentControlAction(data);
    } catch (error) {
      console.error('PaymentBlockingAdapter.createAction failed:', error);
      throw error;
    }
  }

  /**
   * Get control actions by block ID
   */
  async getActionsByBlockId(blockId: string): Promise<PaymentControlAction[]> {
    try {
      const { data, error } = await supabase
        .from('payment_control_actions')
        .select('*')
        .eq('payment_block_id', blockId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(row => this.mapRowToPaymentControlAction(row));
    } catch (error) {
      console.error('PaymentBlockingAdapter.getActionsByBlockId failed:', error);
      throw error;
    }
  }

  /**
   * Get control action by ID
   */
  async getActionById(actionId: string): Promise<PaymentControlAction | null> {
    try {
      const { data, error } = await supabase
        .from('payment_control_actions')
        .select('*')
        .eq('id', actionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return this.mapRowToPaymentControlAction(data);
    } catch (error) {
      console.error('PaymentBlockingAdapter.getActionById failed:', error);
      throw error;
    }
  }

  /**
   * Update control action
   */
  async updateAction(actionId: string, updates: Partial<PaymentControlAction>): Promise<PaymentControlAction> {
    try {
      const updateData = { ...updates };

      const { data, error } = await supabase
        .from('payment_control_actions')
        .update(updateData)
        .eq('id', actionId)
        .select()
        .single();

      if (error) throw error;

      return this.mapRowToPaymentControlAction(data);
    } catch (error) {
      console.error('PaymentBlockingAdapter.updateAction failed:', error);
      throw error;
    }
  }

  /**
   * Complete control action
   */
  async completeAction(actionId: string): Promise<PaymentControlAction> {
    try {
      const { data, error } = await supabase
        .from('payment_control_actions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', actionId)
        .select()
        .single();

      if (error) throw error;

      return this.mapRowToPaymentControlAction(data);
    } catch (error) {
      console.error('PaymentBlockingAdapter.completeAction failed:', error);
      throw error;
    }
  }

  /**
   * Get overdue actions
   */
  async getOverdueActions(): Promise<PaymentControlAction[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('payment_control_actions')
        .select('*')
        .eq('status', 'pending')
        .lt('due_date', now)
        .order('due_date', { ascending: true });

      if (error) throw error;

      return data.map(row => this.mapRowToPaymentControlAction(row));
    } catch (error) {
      console.error('PaymentBlockingAdapter.getOverdueActions failed:', error);
      throw error;
    }
  }

  /**
   * Map database row to PaymentBlock
   */
  private mapRowToPaymentBlock(row: any): PaymentBlock {
    return {
      id: row.id,
      payment_request_id: row.payment_request_id,
      block_reason: row.block_reason,
      block_type: row.block_type,
      status: row.status,
      blocked_amount: row.blocked_amount,
      resolution_notes: row.resolution_notes,
      resolved_by: row.resolved_by,
      resolved_at: row.resolved_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  /**
   * Map database row to PaymentControlAction
   */
  private mapRowToPaymentControlAction(row: any): PaymentControlAction {
    return {
      id: row.id,
      payment_block_id: row.payment_block_id,
      action_type: row.action_type,
      description: row.description,
      assigned_to: row.assigned_to,
      due_date: row.due_date,
      status: row.status,
      created_by: row.created_by,
      created_at: row.created_at,
      completed_at: row.completed_at
    };
  }
}
