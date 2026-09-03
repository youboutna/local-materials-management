/**
 * src/dtos/transforms/DocumentHeaderTransformer.ts
 * Transforme entre :
 * - DocumentHeaderDTO (DTO) ↔ DocumentHeaderDBRow (DB)
 * - DocumentPartiesValue (UI) ↔ DocumentHeaderDTO (DTO)
 *
 * ⚠️ TRANSFORMER — Conversion uniquement, PAS de logique métier
 */
import { DocumentHeaderDTO, DocumentPartyDTO } from '@/dtos/boq/DocumentHeaderDTO';
import { DocumentPartiesValue } from '@/components/boq/DocumentPartiesDialog';

export interface DocumentHeaderDBRow {
  id: string;
  document_id: string;
  reference: string | null;
  issue_date: string | null;
  currency: string;
  validity_days: number;
  facturx_type_code: string;
  notes: string | null;

  sender_id: string | null;
  sender_name: string;
  sender_kind: string | null;
  sender_tax_id: string | null;
  sender_address: string | null;
  sender_phone: string | null;
  sender_email: string | null;

  recipient_id: string | null;
  recipient_name: string;
  recipient_kind: string | null;
  recipient_tax_id: string | null;
  recipient_address: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;

  extra_recipients: string | null;

  workflow_stage: string;
  validation_status: string | null;
  validation_comment: string | null;
  signed_by: string | null;
  signed_at: string | null;
  signature_role: string | null;
  source_document_id: string | null;
  source_document_type: string | null;
  next_document_id: string | null;
  next_document_type: string | null;
  stages_history: string | null;
  workflow_instance_id: string | null;
  metadata: string | null;
  deleted_at: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
}

export class DocumentHeaderTransformer {
  static toDBRow(
    documentId: string,
    header: DocumentHeaderDTO,
    userId?: string,
    workflowStage: string = 'draft'
  ): Omit<DocumentHeaderDBRow, 'id' | 'created_at' | 'updated_at'> {
    const recipients = header.recipients ?? [];
    const primaryRecipient = recipients.length > 0 ? recipients[0] : null;
    const extraRecipients = recipients.length > 1 ? recipients.slice(1) : [];

    return {
      document_id: documentId,
      reference: header.reference ?? null,
      issue_date: header.issueDate ?? null,
      currency: header.currency ?? 'MRU',
      validity_days: header.validityDays ?? 30,
      facturx_type_code: header.facturxTypeCode ?? '310',
      notes: header.notes ?? null,

      sender_id: header.sender?.id ?? null,
      sender_name: header.sender?.name ?? '',
      sender_kind: header.sender?.kind ?? null,
      sender_tax_id: header.sender?.taxId ?? null,
      sender_address: header.sender?.address ?? null,
      sender_phone: header.sender?.phone ?? null,
      sender_email: header.sender?.email ?? null,

      recipient_id: primaryRecipient?.id ?? null,
      recipient_name: primaryRecipient?.name ?? '',
      recipient_kind: primaryRecipient?.kind ?? null,
      recipient_tax_id: primaryRecipient?.taxId ?? null,
      recipient_address: primaryRecipient?.address ?? null,
      recipient_phone: primaryRecipient?.phone ?? null,
      recipient_email: primaryRecipient?.email ?? null,

      extra_recipients: extraRecipients.length > 0 ? JSON.stringify(extraRecipients) : null,

      workflow_stage: workflowStage,
      validation_status: null,
      validation_comment: null,
      signed_by: null,
      signed_at: null,
      signature_role: null,
      source_document_id: null,
      source_document_type: null,
      next_document_id: null,
      next_document_type: null,
      stages_history: JSON.stringify([{
        stage: 'created',
        at: new Date().toISOString(),
        by: userId ?? 'system'
      }]),
      workflow_instance_id: null,
      metadata: null,
      deleted_at: null,
      created_by: userId ?? null,
      updated_by: userId ?? null,
    };
  }

  static fromDBRow(row: DocumentHeaderDBRow): DocumentHeaderDTO {
    const sender: DocumentPartyDTO = {
      id: row.sender_id,
      name: row.sender_name,
      kind: row.sender_kind,
      taxId: row.sender_tax_id,
      address: row.sender_address,
      phone: row.sender_phone,
      email: row.sender_email,
    };

    const recipients: DocumentPartyDTO[] = [];

    if (row.recipient_name) {
      recipients.push({
        id: row.recipient_id,
        name: row.recipient_name,
        kind: row.recipient_kind,
        taxId: row.recipient_tax_id,
        address: row.recipient_address,
        phone: row.recipient_phone,
        email: row.recipient_email,
      });
    }

    if (row.extra_recipients) {
      try {
        const extra = JSON.parse(row.extra_recipients) as DocumentPartyDTO[];
        recipients.push(...extra);
      } catch {
        /* ignore */
      }
    }

    return {
      reference: row.reference,
      issueDate: row.issue_date,
      currency: row.currency,
      validityDays: row.validity_days,
      facturxTypeCode: row.facturx_type_code,
      notes: row.notes,
      sender,
      recipients,
    };
  }

  static fromUIValue(value: DocumentPartiesValue): DocumentHeaderDTO {
    return {
      reference: value.reference ?? null,
      issueDate: value.issueDate ?? null,
      currency: value.currency ?? 'MRU',
      validityDays: value.validityDays ?? 30,
      facturxTypeCode: value.facturxTypeCode ?? '310',
      notes: null,
      sender: {
        id: null,
        name: value.senderName ?? '',
        kind: null,
        taxId: null,
        address: value.senderAddress ?? null,
        phone: value.senderPhone ?? null,
        email: value.senderEmail ?? null,
      },
      recipients: [
        {
          id: null,
          name: value.recipientName ?? '',
          kind: null,
          taxId: null,
          address: null,
          phone: null,
          email: value.recipientEmail ?? null,
        },
        ...(value.extraRecipients ?? []).map(r => ({
          id: null,
          name: r.name,
          kind: null,
          taxId: null,
          address: null,
          phone: null,
          email: r.email ?? null,
        })),
      ].filter(r => r.name.trim().length > 0),
    };
  }

  static toUIValue(header: DocumentHeaderDTO): DocumentPartiesValue {
    const recipients = header.recipients ?? [];
    const primaryRecipient = recipients.length > 0 ? recipients[0] : null;
    const extraRecipients = recipients.length > 1 ? recipients.slice(1) : [];

    return {
      title: 'DQE',
      facturxTypeCode: header.facturxTypeCode ?? '310',
      senderName: header.sender?.name ?? '',
      senderAddress: header.sender?.address ?? undefined,
      senderPhone: header.sender?.phone ?? undefined,
      senderEmail: header.sender?.email ?? undefined,
      recipientName: primaryRecipient?.name ?? '',
      recipientEmail: primaryRecipient?.email ?? undefined,
      extraRecipients: extraRecipients.map(r => ({
        name: r.name,
        email: r.email ?? undefined,
      })),
      reference: header.reference ?? undefined,
      issueDate: header.issueDate ?? undefined,
      currency: header.currency ?? 'MRU',
      validityDays: header.validityDays ?? 30,
    };
  }

  static updateWorkflowInDBRow(
    row: DocumentHeaderDBRow,
    updates: {
      workflowStage?: string;
      validationStatus?: string | null;
      validationComment?: string | null;
      signedBy?: string | null;
      signedAt?: string | null;
      signatureRole?: string | null;
      addStage?: { stage: string; by: string; comment?: string };
    }
  ): Partial<DocumentHeaderDBRow> {
    const result: Partial<DocumentHeaderDBRow> = {};

    if (updates.workflowStage !== undefined) result.workflow_stage = updates.workflowStage;
    if (updates.validationStatus !== undefined) result.validation_status = updates.validationStatus;
    if (updates.validationComment !== undefined) result.validation_comment = updates.validationComment;
    if (updates.signedBy !== undefined) result.signed_by = updates.signedBy;
    if (updates.signedAt !== undefined) result.signed_at = updates.signedAt;
    if (updates.signatureRole !== undefined) result.signature_role = updates.signatureRole;

    if (updates.addStage) {
      let history: Array<{ stage: string; at: string; by: string; comment?: string }> = [];
      if (row.stages_history) {
        try { history = JSON.parse(row.stages_history); } catch { /* ignore */ }
      }
      history.push({
        stage: updates.addStage.stage,
        at: new Date().toISOString(),
        by: updates.addStage.by,
        comment: updates.addStage.comment,
      });
      result.stages_history = JSON.stringify(history);
    }

    return result;
  }
}