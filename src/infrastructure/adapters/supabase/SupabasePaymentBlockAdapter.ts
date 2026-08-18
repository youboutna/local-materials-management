import { btpClient } from '@/integrations/supabase/schema-clients';
/**
 * Supabase adapter for payment blocks (btp.payment_blocks)
 */
import {
  IPaymentBlockRepository,
  PaymentBlockRecord,
  CreatePaymentBlockRecord,
  PaymentBlockingReason
} from '@/domain/repositories/IPaymentBlockRepository';

interface PaymentBlockRow {
  id: string;
  project_id: string;
  contractor_id: string;
  amount: number;
  blocking_reasons: unknown;
  blocked_at: string;
  blocked_by: string | null;
  notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

function extractPaymentId(notes: string | null): string | undefined {
  if (!notes) return undefined;
  const match = notes.match(/payment_id:(\S+)/);
  return match ? match[1] : undefined;
}

function mapRowToRecord(row: PaymentBlockRow): PaymentBlockRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    contractorId: row.contractor_id,
    amount: Number(row.amount) || 0,
    blockingReasons: Array.isArray(row.blocking_reasons) ? (row.blocking_reasons as PaymentBlockingReason[]) : [],
    blockedAt: row.blocked_at,
    blockedBy: row.blocked_by,
    notes: row.notes,
    resolvedAt: row.resolved_at,
    resolvedBy: row.resolved_by,
    paymentId: extractPaymentId(row.notes)
  };
}

export class SupabasePaymentBlockAdapter implements IPaymentBlockRepository {
  async create(data: CreatePaymentBlockRecord): Promise<PaymentBlockRecord> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: row, error } = await btpClient.from('payment_blocks')
      .insert({
        project_id: data.projectId,
        contractor_id: data.contractorId,
        amount: data.amount,
        blocking_reasons: data.blockingReasons as unknown as never,
        blocked_by: data.blockedBy ?? null,
        notes: data.notes ?? null
      })
      .select()
      .single();

    if (error) throw error;
    return mapRowToRecord(row as PaymentBlockRow);
  }

  async findById(id: string): Promise<PaymentBlockRecord | null> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: row, error } = await btpClient.from('payment_blocks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return row ? mapRowToRecord(row as PaymentBlockRow) : null;
  }

  async findActiveByProjectAndContractor(projectId: string, contractorId: string): Promise<PaymentBlockRecord[]> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: rows, error } = await btpClient.from('payment_blocks')
      .select('*')
      .eq('project_id', projectId)
      .eq('contractor_id', contractorId)
      .is('resolved_at', null)
      .order('blocked_at', { ascending: false });

    if (error) throw error;
    return (rows || []).map(row => mapRowToRecord(row as PaymentBlockRow));
  }

  async resolve(id: string, resolvedBy: string): Promise<PaymentBlockRecord> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: row, error } = await btpClient.from('payment_blocks')
      .update({
        resolved_at: new Date().toISOString(),
        resolved_by: resolvedBy
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapRowToRecord(row as PaymentBlockRow);
  }

  async findActiveByProject(projectId: string): Promise<PaymentBlockRecord[]> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: rows, error } = await btpClient.from('payment_blocks')
      .select('*')
      .eq('project_id', projectId)
      .is('resolved_at', null)
      .order('blocked_at', { ascending: false });

    if (error) throw error;
    return (rows || []).map(row => mapRowToRecord(row as PaymentBlockRow));
  }

  async updateStatus(
    id: string,
    status: 'active' | 'resolved' | 'cancelled',
    resolvedBy?: string,
    resolutionNotes?: string
  ): Promise<void> {
    const { supabase } = await import('@/integrations/supabase/client');
    const updatePayload: Record<string, unknown> = {};
    if (status === 'active') {
      updatePayload.resolved_at = null;
      updatePayload.resolved_by = null;
    } else {
      updatePayload.resolved_at = new Date().toISOString();
      updatePayload.resolved_by = resolvedBy ?? null;
      if (resolutionNotes) {
        updatePayload.notes = resolutionNotes;
      }
    }
    const { error } = await btpClient.from('payment_blocks')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;
  }
}
