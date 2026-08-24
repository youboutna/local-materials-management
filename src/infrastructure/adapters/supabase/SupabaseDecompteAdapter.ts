/**
 * Supabase adapter — btp.progress_invoices (décomptes = factures acceptées)
 * et btp.payments (transactions rattachées). Seul propriétaire de l'accès DB.
 */
import { btpClient } from '@/integrations/supabase/schema-clients';
import type { IDecompteRepository } from '@/domain/repositories/IDecompteRepository';
import {
  DECOMPTE_PAID_DB_STATUSES,
  DECOMPTE_VALIDATED_DB_STATUSES,
  type DecomptePaymentDTO,
  type DecompteRecordDTO,
  type DecompteStatus,
} from '@/dtos/entities/DecompteRecordDTO';

const mapStatus = (raw: string | null): DecompteStatus => {
  const value = (raw ?? '').toLowerCase();
  if ((DECOMPTE_PAID_DB_STATUSES as readonly string[]).includes(value)) return 'paid';
  if ((DECOMPTE_VALIDATED_DB_STATUSES as readonly string[]).includes(value)) return 'validated';
  if (value.includes('reject')) return 'rejected';
  if (value.includes('submitted') || value.includes('review')) return 'submitted';
  return 'draft';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toDto = (row: any): DecompteRecordDTO => {
  const status = mapStatus(row.status ?? null);
  const amount = Number(row.invoice_amount ?? 0);
  const retention = Number(row.retention_amount ?? 0);
  const validated =
    row.validated_amount != null
      ? Number(row.validated_amount)
      : status === 'validated' || status === 'paid'
        ? Math.max(amount - retention, 0)
        : 0;
  const paid =
    row.paid_amount != null
      ? Number(row.paid_amount)
      : status === 'paid'
        ? validated || amount
        : Number(row.cumulative_paid ?? 0) > 0
          ? Number(row.cumulative_paid)
          : 0;

  return {
    id: row.id,
    decompteNumber: row.invoice_number
      ? String(row.invoice_number).replace(/^INV-/, 'D-')
      : `D-${String(row.id).slice(0, 8).toUpperCase()}`,
    invoiceNumber: row.invoice_number ?? null,
    projectId: row.project_id ?? null,
    phaseId: row.phase_id ?? null,
    status,
    rawStatus: row.status ?? null,
    amount,
    validatedAmount: validated,
    paidAmount: paid,
    retentionAmount: retention,
    progressPercentage: Number(row.progress_percentage ?? 0),
    workDescription: row.work_description ?? null,
    invoiceDocumentId: row.invoice_document_id ?? row.service_fait_document_id ?? null,
    submittedAt: row.submitted_at ?? null,
    paidAt: row.paid_at ?? null,
    createdAt: row.created_at ?? null,
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toPaymentDto = (row: any): DecomptePaymentDTO => ({
  id: row.id,
  decompteId: row.decompte_id ?? null,
  phaseId: row.phase_id ?? null,
  projectId: row.project_id ?? null,
  invoiceNumber: row.invoice_number ?? null,
  amount: Number(row.amount_paid ?? row.amount ?? 0),
  paymentDate: row.payment_date ?? null,
  paymentMethod: row.payment_method ?? null,
  transactionId: row.transaction_id ?? null,
  receiverName: row.receiver_name ?? null,
});

export class SupabaseDecompteAdapter implements IDecompteRepository {
  async findByProjectId(projectId: string): Promise<DecompteRecordDTO[]> {
    const { data, error } = await (btpClient as any)
      .from('progress_invoices')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toDto);
  }

  async findByPhaseId(phaseId: string): Promise<DecompteRecordDTO[]> {
    const { data, error } = await (btpClient as any)
      .from('progress_invoices')
      .select('*')
      .eq('phase_id', phaseId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toDto);
  }

  async findById(id: string): Promise<DecompteRecordDTO | null> {
    const { data, error } = await (btpClient as any)
      .from('progress_invoices')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? toDto(data) : null;
  }

  async findPaymentsByProjectId(projectId: string): Promise<DecomptePaymentDTO[]> {
    const { data, error } = await (btpClient as any)
      .from('payments')
      .select('*')
      .eq('project_id', projectId)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toPaymentDto);
  }

  async findPaymentsByPhaseId(phaseId: string): Promise<DecomptePaymentDTO[]> {
    const { data, error } = await (btpClient as any)
      .from('payments')
      .select('*')
      .eq('phase_id', phaseId)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toPaymentDto);
  }
}
