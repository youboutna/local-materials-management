/**
 * BoqLineMapper — snake_case ↔ camelCase, single source of truth
 * for the unified BOQ persistence table (btp.boq_lines).
 * Also supports `reproject()` used when converting a tender estimate into
 * a planned project's quantity takeoffs.
 */

import type { BoqSource } from '@/domain/entities/boq/BoqLine';
import { getDQELineType, normalizeDQEType } from '@/utils/dqeTypeMapper';
import type { BoqLineDTO } from './BoqLineDTO';

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
  total_tva?: number | null;
  total_ras?: number | null;
  total_ttc?: number | null;

  vat_rate?: number | null;
  ras_rate?: number | null;
  fees?: number | null;
  phase_id?: string | null;
  milestone_id?: string | null;
  task_id?: string | null;
  phase_code?: string | null;
  milestone_code?: string | null;
  task_code?: string | null;

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
  code?: string | null;
  dqe_type?: string | null;
  document_type?: string | null;
  business_status?: string | null;
  source_document_id?: string | null;
  source_document_type?: string | null;
  facturx_type_code?: string | null;
  billed_percentage?: number | null;
  line_status?: string | null;
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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/**
 * Les phases/jalons/tâches peuvent venir d'un référentiel (codes texte) ou du
 * projet réel (UUID). Les colonnes `*_id` sont typées uuid : on route les codes
 * vers `*_code` pour éviter l'erreur 22P02 à l'insertion.
 */
const idOrCode = (value?: string | null): { id: string | null; code: string | null } => {
  const v = String(value ?? '').trim();
  if (!v) return { id: null, code: null };
  return UUID_RE.test(v) ? { id: v, code: null } : { id: null, code: v };
};


export class BoqLineMapper {
  static fromDb(row: BoqDbRow, source: BoqSource): BoqLineDTO {
    const contextId =
      source === 'quantity_takeoff' || source === 'dqe'
        ? String(row.project_id ?? row.estimate_id ?? '')
        : source === 'tender_estimate'
          ? String(row.tender_id ?? row.estimate_id ?? '')
          : String(row.submission_id ?? row.estimate_id ?? row.sender_id ?? '');
    const quantity = Number(row.quantity ?? 0);
    // Montant ligne stocké : 0 (défaut colonne) est traité comme « non valorisé »
    // afin de retomber sur qté × PU au lieu d'afficher un total vide (PDF/récap).
    const storedTotal = [row.total_ht, row.total_price, row.total_value]
      .map((v) => (v == null ? null : Number(v)))
      .find((v) => v != null && v !== 0) ?? null;
    const storedPu = [row.unit_price_ht, row.unit_price]
      .map((v) => (v == null ? null : Number(v)))
      .find((v) => v != null && v !== 0) ?? null;
    // PU absent mais montant présent (DQE forfaitaires) : PU reconstitué.
    const unitPrice = storedPu ?? (storedTotal != null && quantity ? storedTotal / quantity : null);

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
      totalHt: storedTotal ?? (unitPrice != null ? quantity * unitPrice + Number(row.fees ?? 0) : null),
      materialId: row.resource_id ?? row.material_id ?? null,
      phaseId: row.phase_id ?? row.phase_code ?? null,
      milestoneId: row.milestone_id ?? row.milestone_code ?? null,
      taskId: row.task_id ?? row.task_code ?? null,

      resourceType: ((row.resource_kind ?? row.resource_type) as BoqLineDTO['resourceType']) ?? 'material',
      note: row.note ?? null,
      bidRef: row.bid_ref ?? null,
      submittedBy: row.sender_id ?? row.submitted_by ?? null,
      sourceType: (row.source_type as BoqLineDTO['sourceType']) ?? undefined,
      btpCode: row.btp_code ?? null,
      code: row.code ?? row.item_code ?? null,
      category: row.category ?? null,
      dqeType: row.dqe_type ?? null,
      documentType: row.document_type ?? row.dqe_type ?? null,
      businessStatus: row.business_status ?? null,
      sourceDocumentId: row.source_document_id ?? null,
      sourceDocumentType: row.source_document_type ?? null,
      facturxTypeCode: row.facturx_type_code ?? null,
      billedPercentage: row.billed_percentage ?? null,
      metadata: row.metadata ?? null,
      status: row.status ?? 'draft',
      documentId: row.document_id ?? null,
      title: (row.metadata as { title?: string } | null)?.title ?? null,
      createdAt: row.created_at ?? null,
    };
  }

  static toDb(dto: BoqLineDTO): BoqDbRow {
    // Les colonnes total_* de btp.boq_lines sont GÉNÉRÉES (quantity × unit_price_ht)
    // : on ne les écrit jamais, on garantit à la place que le PU est bien persisté
    // (les lignes forfaitaires ne portant qu'un « Montant » perdaient leur prix).
    const qty = Number(dto.quantity ?? 0);
    const pu = dto.unitPrice ?? null;
    const fees = Number(dto.fees ?? 0);
    const totalHt = dto.totalHt ?? (pu != null ? qty * pu + fees : null);
    return {

      project_id: dto.source === 'quantity_takeoff' || dto.source === 'dqe' ? dto.contextId : null,
      tender_id: dto.source === 'tender_estimate' ? dto.contextId : null,
      submission_id: dto.source === 'supplier_bid' || dto.source === 'invoice' ? dto.contextId : null,
      estimate_id: dto.source === 'tender_estimate' || dto.source === 'supplier_bid' || dto.source === 'invoice' ? dto.contextId : null,
      line_type: dto.dqeType ? getDQELineType(dto.dqeType) : BOQ_LINE_TYPE_BY_SOURCE[dto.source],
      designation: dto.designation,
      element_type: dto.elementType ?? null,
      resource_id: dto.materialId ?? null,
      resource_kind: dto.resourceType ?? 'material',
      unit: dto.unit,
      length: dto.length ?? null,
      width: dto.width ?? null,
      height: dto.height ?? null,
      quantity: dto.quantity,
      unit_price_ht: pu ?? (totalHt != null && qty ? (totalHt - fees) / qty : null),
      vat_rate: dto.vatRate ?? 0,
      ras_rate: dto.rasRate ?? 0,
      fees: dto.fees ?? 0,
      phase_id: idOrCode(dto.phaseId).id,
      phase_code: idOrCode(dto.phaseId).code,
      milestone_id: idOrCode(dto.milestoneId).id,
      milestone_code: idOrCode(dto.milestoneId).code,
      task_id: idOrCode(dto.taskId).id,
      task_code: idOrCode(dto.taskId).code,

      note: dto.note ?? null,
      source_type: dto.source === 'dqe' ? 'dqe' : dto.sourceType ?? null,
      btp_code: dto.btpCode ?? dto.code ?? null,
      code: dto.code ?? dto.btpCode ?? null,
      category: dto.category ?? null,
      dqe_type: dto.dqeType ? normalizeDQEType(dto.dqeType) : null,
      document_type: dto.documentType ?? (dto.dqeType ? normalizeDQEType(dto.dqeType) : null),
      business_status: dto.businessStatus ?? null,
      source_document_id: dto.sourceDocumentId ?? null,
      source_document_type: dto.sourceDocumentType ?? null,
      facturx_type_code: dto.facturxTypeCode ?? null,
      billed_percentage: dto.billedPercentage ?? null,
      sender_id: dto.submittedBy ?? null,
      status: dto.status ?? 'draft',
      document_id: dto.documentId ?? null,
      metadata: { ...(dto.metadata ?? {}), ...(dto.title ? { title: dto.title } : {}) },
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
