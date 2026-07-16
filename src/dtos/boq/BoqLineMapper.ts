/**
 * BoqLineMapper — snake_case ↔ camelCase, single source of truth
 * for the unified BOQ persistence table (btp.boq_lines).
 * Also supports `reproject()` used when converting a tender estimate into
 * a planned project's quantity takeoffs.
 */

import type { BoqLineDTO } from './BoqLineDTO';
import type { BoqSource } from '@/domain/boq/BoqLine';

/** Raw DB row shape (super-set of both tables' columns). */
export interface BoqDbRow {
  id?: string;
  project_id?: string | null;
  tender_id?: string | null;
  submission_id?: string | null;
  estimate_id?: string | null;
  material_id?: string | null;
  resource_id?: string | null;
  resource_kind?: string | null;
  item_code?: string | null;
  description?: string | null;
  designation?: string | null;
  element_type?: string | null;
  unit?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  quantity?: number | null;
  unit_price?: number | null;
  unit_price_ht?: number | null;
  total_price?: number | null;
  total_value?: number | null;
  total_ht?: number | null;
  vat_rate?: number | null;
  ras_rate?: number | null;
  fees?: number | null;
  phase_id?: string | null;
  milestone_id?: string | null;
  task_id?: string | null;
  resource_type?: string | null;
  note?: string | null;
  category?: string | null;
  item_type?: string | null;
  bid_ref?: string | null;
  submitted_by?: string | null;
  sender_id?: string | null;
  source?: string | null;
  source_type?: string | null;
  btp_code?: string | null;
  line_type?: string | null;
  status?: BoqLineDTO['status'] | null;
  document_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
}

export const BOQ_LINE_TYPE_BY_SOURCE: Record<BoqSource, BoqDbRow['line_type']> = {
  quantity_takeoff: 'quantity_takeoff',
  tender_estimate: 'estimate',
  supplier_bid: 'supplier_bid',
  invoice: 'invoice',
  dqe: 'estimate',
};

export class BoqLineMapper {
  static fromDb(row: BoqDbRow, source: BoqSource): BoqLineDTO {
    const contextId =
      source === 'quantity_takeoff' || source === 'dqe'
        ? String(row.project_id ?? row.estimate_id ?? '')
        : source === 'tender_estimate'
          ? String(row.tender_id ?? row.estimate_id ?? '')
          : String(row.submission_id ?? row.estimate_id ?? row.sender_id ?? '');
    const unitPrice = row.unit_price_ht ?? row.unit_price ?? null;
    const quantity = Number(row.quantity ?? 0);
    return {
      id: row.id,
      source,
      contextId,
      designation: row.designation ?? row.description ?? row.item_type ?? row.item_code ?? '',
      elementType: row.element_type ?? row.item_type ?? null,
      unit: row.unit ?? 'unité',
      length: row.length ?? null,
      width: row.width ?? null,
      height: row.height ?? null,
      quantity,
      unitPrice,
      vatRate: row.vat_rate ?? 0,
      rasRate: row.ras_rate ?? 0,
      fees: row.fees ?? 0,
      totalHt: row.total_ht ?? row.total_price ?? row.total_value ?? (unitPrice != null ? quantity * unitPrice : null),
      materialId: row.resource_id ?? row.material_id ?? null,
      phaseId: row.phase_id ?? null,
      milestoneId: row.milestone_id ?? null,
      taskId: row.task_id ?? null,
      resourceType: ((row.resource_kind ?? row.resource_type) as BoqLineDTO['resourceType']) ?? 'material',
      note: row.note ?? null,
      bidRef: row.bid_ref ?? null,
      submittedBy: row.sender_id ?? row.submitted_by ?? null,
      sourceType: (row.source_type as BoqLineDTO['sourceType']) ?? undefined,
      btpCode: row.btp_code ?? null,
      status: row.status ?? 'draft',
      documentId: row.document_id ?? null,
      title: (row.metadata as { title?: string } | null)?.title ?? null,
      createdAt: row.created_at ?? null,
    };
  }

  static toDb(dto: BoqLineDTO): BoqDbRow {
    return {
      project_id: dto.source === 'quantity_takeoff' || dto.source === 'dqe' ? dto.contextId : null,
      tender_id: dto.source === 'tender_estimate' ? dto.contextId : null,
      submission_id: dto.source === 'supplier_bid' || dto.source === 'invoice' ? dto.contextId : null,
      estimate_id: dto.source === 'tender_estimate' || dto.source === 'supplier_bid' || dto.source === 'invoice' ? dto.contextId : null,
      line_type: BOQ_LINE_TYPE_BY_SOURCE[dto.source],
      designation: dto.designation,
      element_type: dto.elementType ?? null,
      resource_id: dto.materialId ?? null,
      resource_kind: dto.resourceType ?? 'material',
      unit: dto.unit,
      length: dto.length ?? null,
      width: dto.width ?? null,
      height: dto.height ?? null,
      quantity: dto.quantity,
      unit_price_ht: dto.unitPrice ?? null,
      vat_rate: dto.vatRate ?? 0,
      ras_rate: dto.rasRate ?? 0,
      fees: dto.fees ?? 0,
      phase_id: dto.phaseId ?? null,
      milestone_id: dto.milestoneId ?? null,
      task_id: dto.taskId ?? null,
      note: dto.note ?? null,
      source_type: dto.source === 'dqe' ? 'dqe' : dto.sourceType ?? null,
      btp_code: dto.btpCode ?? null,
      sender_id: dto.submittedBy ?? null,
      status: dto.status ?? 'draft',
      document_id: dto.documentId ?? null,
      metadata: dto.title ? { title: dto.title } : {},
    };
  }

  /** Reproject a tender estimate line onto a newly created project as a quantity takeoff. */
  static reproject(dto: BoqLineDTO, targetProjectId: string): BoqLineDTO {
    return {
      ...dto,
      id: undefined,
      source: 'quantity_takeoff',
      contextId: targetProjectId,
      bidRef: null,
      submittedBy: null,
    };
  }
}
