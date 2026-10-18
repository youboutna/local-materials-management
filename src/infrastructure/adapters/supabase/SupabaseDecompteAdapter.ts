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
import type {
  ConsultantInvoiceDecision,
  ConsultantProgressInvoiceDTO,
} from '@/dtos/entities/ConsultantProgressInvoiceDTO';

// ✅ IMPORT formatReference
import { formatReference } from '@/utils/entityLabels';

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
        ? validated
        : Number(row.cumulative_paid ?? 0) > 0
          ? Number(row.cumulative_paid)
          : 0;

  return {
    id: row.id,
    decompteNumber: row.invoice_number
      ? String(row.invoice_number).replace(/^INV-/, 'D-')
      // ✅ formatReference au lieu de id.slice(0, 8)
      : `D-${formatReference(row.id, 'DEC')}`,
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
  status: row.status ?? null,
});

export class SupabaseDecompteAdapter implements IDecompteRepository {
  async findSubmittedProgressInvoices(): Promise<ConsultantProgressInvoiceDTO[]> {
    const { data, error } = await (btpClient as any)
      .from('progress_invoices')
      .select('*')
      .eq('status', 'submitted')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      invoiceNumber: row.invoice_number ?? '',
      invoice_number: row.invoice_number ?? '',
      invoiceType: row.invoice_type ?? 'progress',
      invoice_type: row.invoice_type ?? 'progress',
      progressPercentage: row.progress_percentage ?? 0,
      progress_percentage: row.progress_percentage ?? 0,
      previousProgress: row.previous_progress ?? 0,
      previous_progress: row.previous_progress ?? 0,
      totalContractAmount: row.total_contract_amount ?? 0,
      total_contract_amount: row.total_contract_amount ?? 0,
      invoiceAmount: row.invoice_amount ?? 0,
      invoice_amount: row.invoice_amount ?? 0,
      workDescription: row.work_description ?? '',
      work_description: row.work_description ?? '',
      status: row.status ?? 'submitted',
      submittedAt: row.submitted_at ?? '',
      submitted_at: row.submitted_at ?? '',
      projectId: row.project_id ?? '',
      project_id: row.project_id ?? '',
      inspectionId: row.inspection_id ?? '',
      inspection_id: row.inspection_id ?? '',
      supportingDocuments: row.supporting_documents ?? [],
      supporting_documents: row.supporting_documents ?? [],
      submittedBy: row.submitted_by ?? '',
      submitted_by: row.submitted_by ?? '',
      createdAt: row.created_at ?? '',
      created_at: row.created_at ?? '',
      updatedAt: row.updated_at ?? '',
      updated_at: row.updated_at ?? '',
      projects: row.projects ? {
        title: row.projects.title ?? '',
        projectType: row.projects.project_type ?? '',
        fundingSource: row.projects.funding_source ?? '',
      } : undefined,
    }));
  }

  async findProgressInvoiceWorkflowHistory(
    id: string,
  ): Promise<ConsultantInvoiceDecision['workflowHistory'] | null> {
    const { data, error } = await (btpClient as any)
      .from('progress_invoices')
      .select('workflow_history')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return Array.isArray(data.workflow_history) ? data.workflow_history : [];
  }

  async updateConsultantInvoiceDecision(id: string, decision: ConsultantInvoiceDecision): Promise<void> {
    const updateData: Record<string, unknown> = {
      status: decision.status,
      consultant_id: decision.consultantId,
      consultant_validated_at: decision.validatedAt,
      consultant_comments: decision.comments,
      consultant_approval_status: decision.approved ? 'approved' : 'rejected',
      workflow_history: decision.workflowHistory,
    };
    if (decision.serviceFaitDocumentId) {
      updateData.service_fait_document_id = decision.serviceFaitDocumentId;
    }
    const { error } = await (btpClient as any)
      .from('progress_invoices')
      .update(updateData)
      .eq('id', id);
    if (error) throw error;
  }

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