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
  block_type: PaymentBlock['blockType'];
  status: PaymentBlock['status'];
  resolution_notes?: string;
}

export class PaymentBlockingAdapter implements IPaymentBlockingRepository {
  /**
   * Create a payment block
   */
  async createBlock(block: Omit<PaymentBlock, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentBlock> {
    try {
      const blockingReasons: BlockingReasonsPayload = {
        payment_request_id: block.paymentRequestId,
        block_reason: block.blockReason,
        block_type: block.blockType,
        status: block.status,
        resolution_notes: block.resolutionNotes,
      };

      const { data, error } = await supabase
        .from('payment_blocks')
        .insert({
          project_id: block.paymentRequestId,
          contractor_id: block.paymentRequestId,
          amount: block.blockedAmount,
          blocking_reasons: blockingReasons as unknown as Json,
          notes: block.resolutionNotes ?? null,
          resolved_by: block.resolvedBy ?? null,
          resolved_at: block.resolvedAt ?? null,
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
        .filter(block => block.paymentRequestId === paymentRequestId);
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
        payment_request_id: merged.paymentRequestId,
        block_reason: merged.blockReason,
        block_type: merged.blockType,
        status: merged.status,
        resolution_notes: merged.resolutionNotes,
      };

      const { data, error } = await supabase
        .from('payment_blocks')
        .update({
          amount: merged.blockedAmount,
          blocking_reasons: blockingReasons as unknown as Json,
          notes: merged.resolutionNotes ?? null,
          resolved_by: merged.resolvedBy ?? null,
          resolved_at: merged.resolvedAt ?? null,
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
      resolutionNotes: resolutionNotes,
      resolvedBy: resolvedBy,
      resolvedAt: new Date().toISOString(),
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
        totalBlockedAmount: blocks.reduce((sum, block) => sum + (block.blockedAmount || 0), 0),
        blocksByType: blocks.reduce((acc, block) => {
          const type = block.blockType || 'unknown';
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
  async createAction(action: Omit<PaymentControlAction, 'id' | 'createdAt'>): Promise<PaymentControlAction> {
    try {
      const { data, error } = await supabase
        .from('payment_control_actions')
        .insert({
          payment_block_id: action.paymentBlockId,
          action_type: action.actionType,
          description: action.description,
          assigned_to: action.assignedTo ?? null,
          due_date: action.dueDate ?? null,
          status: action.status,
          created_by: action.createdBy,
          completed_at: action.completedAt ?? null,
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
      if (updates.actionType !== undefined) updateData.action_type = updates.actionType;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo ?? null;
      if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate ?? null;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.createdBy !== undefined) updateData.created_by = updates.createdBy;
      if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt ?? null;

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
      paymentRequestId: reasons.payment_request_id ?? row.contractor_id,
      blockReason: reasons.block_reason ?? '',
      blockType: reasons.block_type ?? 'financial',
      status: reasons.status ?? 'active',
      blockedAmount: row.amount,
      resolutionNotes: row.notes ?? undefined,
      resolvedBy: row.resolved_by ?? undefined,
      resolvedAt: row.resolved_at ?? undefined,
      createdAt: row.blocked_at,
      updatedAt: row.resolved_at ?? row.blocked_at
    };
  }

  /**
   * Map database row to PaymentControlAction
   */
  private mapRowToPaymentControlAction(row: PaymentControlActionRow): PaymentControlAction {
    return {
      id: row.id,
      paymentBlockId: row.payment_block_id,
      actionType: row.action_type as PaymentControlAction['actionType'],
      description: row.description ?? '',
      assignedTo: row.assigned_to ?? undefined,
      dueDate: row.due_date ?? undefined,
      status: row.status as PaymentControlAction['status'],
      createdBy: row.created_by ?? '',
      createdAt: row.created_at,
      completedAt: row.completed_at ?? undefined
    };
  }
}
