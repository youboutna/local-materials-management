/**
 * Payment Blocking Supabase Adapter
 * Implements IPaymentBlockingRepository using Supabase
 *
 * NOTE: la table réelle `payment_blocks` n'a pas de colonnes
 * payment_request_id / status / block_type / blocked_amount.
 * Ces informations sont encodées dans la colonne JSON `blocking_reasons`
 * et les filtres correspondants sont donc appliqués côté client.
 * De même, la table `payment_control_actions` réelle ne connaît pas de
 * colonne `updated_at`.
 */

import { IPaymentBlockingRepository, PaymentBlock, PaymentControlAction } from '@/domain/repositories/IPaymentBlockingRepository';
import { btpClient as supabase } from '@/integrations/supabase/schema-clients';
import { BtpTables } from '@/integrations/supabase/btp-types';
import { Json } from '@/integrations/supabase/types';

type PaymentBlockRow = BtpTables<'payment_blocks'>;
type PaymentControlActionRow = BtpTables<'payment_control_actions'>;

interface BlockingReasonsPayload {
  payment_request_id: string;
  block_reason: string;
  block_type: PaymentBlock['block_type'];
  status: PaymentBlock['status'];
  resolution_notes?: string;
}

export class PaymentBlockingAdapter implements IPaymentBlockingRepository {
  /**
   * Create a payment block
   */
  async createBlock(block: Omit<PaymentBlock, 'id' | 'created_at' | 'updated_at'>): Promise<PaymentBlock> {
    try {
      const blockingReasons: BlockingReasonsPayload = {
        payment_request_id: block.payment_request_id,
        block_reason: block.block_reason,
        block_type: block.block_type,
        status: block.status,
        resolution_notes: block.resolution_notes,
      };

      const { data, error } = await supabase
        .from('payment_blocks')
        .insert({
          project_id: block.payment_request_id,
          contractor_id: block.payment_request_id,
          amount: block.blocked_amount,
          blocking_reasons: blockingReasons as unknown as Json,
          notes: block.resolution_notes ?? null,
          resolved_by: block.resolved_by ?? null,
          resolved_at: block.resolved_at ?? null,
          blocked_at: new Date().toISOString(),
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
        .order('blocked_at', { ascending: false });

      if (error) throw error;

      return data
        .map(row => this.mapRowToPaymentBlock(row))
        .filter(block => block.status === 'active');
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
        .order('blocked_at', { ascending: false });

      if (error) throw error;

      return data
        .map(row => this.mapRowToPaymentBlock(row))
        .filter(block => block.payment_request_id === paymentRequestId);
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
      const existing = await this.getBlockById(blockId);
      if (!existing) {
        throw new Error(`Payment block ${blockId} not found`);
      }

      const merged: PaymentBlock = { ...existing, ...updates };
      const blockingReasons: BlockingReasonsPayload = {
        payment_request_id: merged.payment_request_id,
        block_reason: merged.block_reason,
        block_type: merged.block_type,
        status: merged.status,
        resolution_notes: merged.resolution_notes,
      };

      const { data, error } = await supabase
        .from('payment_blocks')
        .update({
          amount: merged.blocked_amount,
          blocking_reasons: blockingReasons as unknown as Json,
          notes: merged.resolution_notes ?? null,
          resolved_by: merged.resolved_by ?? null,
          resolved_at: merged.resolved_at ?? null,
        })
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
    return this.updateBlock(blockId, {
      status: 'resolved',
      resolution_notes: resolutionNotes,
      resolved_by: resolvedBy,
      resolved_at: new Date().toISOString(),
    });
  }

  /**
   * Cancel payment block
   */
  async cancelBlock(blockId: string): Promise<PaymentBlock> {
    return this.updateBlock(blockId, {
      status: 'cancelled',
    });
  }

  /**
   * Check if payment is blocked
   */
  async isPaymentBlocked(paymentRequestId: string): Promise<boolean> {
    try {
      const blocks = await this.getBlocksByPaymentRequest(paymentRequestId);
      return blocks.some(block => block.status === 'active');
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
        .select('*');

      if (error) throw error;

      const blocks = data.map(row => this.mapRowToPaymentBlock(row));

      const stats = {
        totalBlocks: blocks.length,
        activeBlocks: blocks.filter(block => block.status === 'active').length,
        resolvedBlocks: blocks.filter(block => block.status === 'resolved').length,
        cancelledBlocks: blocks.filter(block => block.status === 'cancelled').length,
        totalBlockedAmount: blocks.reduce((sum, block) => sum + (block.blocked_amount || 0), 0),
        blocksByType: blocks.reduce((acc, block) => {
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
          assigned_to: action.assigned_to ?? null,
          due_date: action.due_date ?? null,
          status: action.status,
          created_by: action.created_by,
          completed_at: action.completed_at ?? null,
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
      const updateData: Partial<PaymentControlActionRow> = {};
      if (updates.action_type !== undefined) updateData.action_type = updates.action_type;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.assigned_to !== undefined) updateData.assigned_to = updates.assigned_to ?? null;
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date ?? null;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.created_by !== undefined) updateData.created_by = updates.created_by;
      if (updates.completed_at !== undefined) updateData.completed_at = updates.completed_at ?? null;

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
  private mapRowToPaymentBlock(row: PaymentBlockRow): PaymentBlock {
    const reasons = (row.blocking_reasons ?? {}) as Partial<BlockingReasonsPayload>;

    return {
      id: row.id,
      payment_request_id: reasons.payment_request_id ?? row.contractor_id,
      block_reason: reasons.block_reason ?? '',
      block_type: reasons.block_type ?? 'financial',
      status: reasons.status ?? 'active',
      blocked_amount: row.amount,
      resolution_notes: row.notes ?? undefined,
      resolved_by: row.resolved_by ?? undefined,
      resolved_at: row.resolved_at ?? undefined,
      created_at: row.blocked_at,
      updated_at: row.resolved_at ?? row.blocked_at
    };
  }

  /**
   * Map database row to PaymentControlAction
   */
  private mapRowToPaymentControlAction(row: PaymentControlActionRow): PaymentControlAction {
    return {
      id: row.id,
      payment_block_id: row.payment_block_id,
      action_type: row.action_type as PaymentControlAction['action_type'],
      description: row.description ?? '',
      assigned_to: row.assigned_to ?? undefined,
      due_date: row.due_date ?? undefined,
      status: row.status as PaymentControlAction['status'],
      created_by: row.created_by ?? '',
      created_at: row.created_at,
      completed_at: row.completed_at ?? undefined
    };
  }
}
