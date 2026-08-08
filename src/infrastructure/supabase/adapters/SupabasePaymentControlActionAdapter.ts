/**
 * Supabase adapter for payment control actions (btp.payment_control_actions)
 */
import {
  IPaymentControlActionRepository,
  PaymentControlActionRecord,
  CreatePaymentControlActionRecord
} from '@/domain/repositories/IPaymentControlActionRepository';

interface PaymentControlActionRow {
  id: string;
  payment_block_id: string;
  action_type: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
}

function mapRowToRecord(row: PaymentControlActionRow): PaymentControlActionRecord {
  return {
    id: row.id,
    paymentBlockId: row.payment_block_id,
    actionType: row.action_type,
    description: row.description,
    assignedTo: row.assigned_to,
    dueDate: row.due_date,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at
  };
}

export class SupabasePaymentControlActionAdapter implements IPaymentControlActionRepository {
  async create(data: CreatePaymentControlActionRecord): Promise<PaymentControlActionRecord> {
    const { btpClient: supabase } = await import('@/integrations/supabase/schema-clients');
    const { data: row, error } = await supabase
      .from('payment_control_actions')
      .insert({
        payment_block_id: data.paymentBlockId,
        action_type: data.actionType,
        description: data.description ?? null,
        assigned_to: data.assignedTo ?? null,
        due_date: data.dueDate ?? null,
        status: data.status ?? 'pending',
        created_by: data.createdBy ?? null
      })
      .select()
      .single();

    if (error) throw error;
    return mapRowToRecord(row as PaymentControlActionRow);
  }

  async findByBlockId(blockId: string): Promise<PaymentControlActionRecord[]> {
    const { btpClient: supabase } = await import('@/integrations/supabase/schema-clients');
    const { data: rows, error } = await supabase
      .from('payment_control_actions')
      .select('*')
      .eq('payment_block_id', blockId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (rows || []).map(row => mapRowToRecord(row as PaymentControlActionRow));
  }

  async complete(id: string): Promise<PaymentControlActionRecord> {
    const { btpClient: supabase } = await import('@/integrations/supabase/schema-clients');
    const { data: row, error } = await supabase
      .from('payment_control_actions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapRowToRecord(row as PaymentControlActionRow);
  }
}
