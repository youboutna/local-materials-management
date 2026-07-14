/**
 * BoqLineMapper — snake_case ↔ camelCase, single source of truth
 * for all BOQ persistence tables (quantity_takeoffs, tender_estimate_items).
 * Also supports `reproject()` used when converting a tender estimate into
 * a planned project's quantity takeoffs.
 */

import type { BoqLineDTO } from './BoqLineDTO';
import type { BoqSource } from '@/domain/boq/BoqLine';

/** Raw DB row shape (super-set of both tables' columns). */
export interface BoqDbRow {
  id?: string;
  project_id?: string | null;
  estimate_id?: string | null;
  material_id?: string | null;
  item_code?: string | null;
  description?: string | null;
  element_type?: string | null;
  item_type?: string | null;
  unit?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  quantity?: number | null;
  unit_price?: number | null;
  total_price?: number | null;
  total_value?: number | null;
  vat_rate?: number | null;
  phase_id?: string | null;
  milestone_id?: string | null;
  task_id?: string | null;
  resource_type?: string | null;
  note?: string | null;
  category?: string | null;
  item_type?: string | null;
  bid_ref?: string | null;
  submitted_by?: string | null;
  source?: string | null;
  source_type?: string | null;
  btp_code?: string | null;
}

export class BoqLineMapper {
  static fromDb(row: BoqDbRow, source: BoqSource): BoqLineDTO {
    const contextId =
      source === 'quantity_takeoff'
        ? String(row.project_id ?? '')
        : String(row.estimate_id ?? '');
    const unitPrice = row.unit_price ?? null;
    const quantity = Number(row.quantity ?? 0);
    return {
      id: row.id,
      source,
      contextId,
      designation: row.description ?? row.item_type ?? row.item_code ?? '',
      elementType: row.item_type ?? null,
      unit: row.unit ?? 'unité',
      length: row.length ?? null,
      width: row.width ?? null,
      height: row.height ?? null,
      quantity,
      unitPrice,
      vatRate: row.vat_rate ?? 0,
      totalHt: row.total_price ?? row.total_value ?? (unitPrice != null ? quantity * unitPrice : null),
      materialId: row.material_id ?? null,
      phaseId: row.phase_id ?? null,
      milestoneId: row.milestone_id ?? null,
      taskId: row.task_id ?? null,
      resourceType: (row.resource_type as BoqLineDTO['resourceType']) ?? 'material',
      note: row.note ?? null,
      bidRef: row.bid_ref ?? null,
      submittedBy: row.submitted_by ?? null,
      sourceType: (row.source_type as BoqLineDTO['sourceType']) ?? undefined,
      btpCode: row.btp_code ?? null,
    };
  }

  static toDb(dto: BoqLineDTO): BoqDbRow {
    const base: BoqDbRow = {
      material_id: dto.materialId ?? null,
      unit: dto.unit,
      length: dto.length ?? null,
      width: dto.width ?? null,
      height: dto.height ?? null,
      quantity: dto.quantity,
      unit_price: dto.unitPrice ?? null,
      vat_rate: dto.vatRate ?? 0,
      phase_id: dto.phaseId ?? null,
      milestone_id: dto.milestoneId ?? null,
      task_id: dto.taskId ?? null,
      resource_type: dto.resourceType ?? 'material',
      note: dto.note ?? null,
      source: dto.source,
      source_type: dto.sourceType ?? null,
      btp_code: dto.btpCode ?? null,
    };
    if (dto.source === 'quantity_takeoff') {
      return {
        ...base,
        element_type: dto.elementType ?? null,
        project_id: dto.contextId,
        total_value: dto.totalHt ?? null,
      };
    }
    // tender_estimate | supplier_bid | dqe use item_type instead of element_type
    // tender_estimate | supplier_bid | dqe
    return {
      ...base,
      item_type: dto.elementType ?? null,
      estimate_id: dto.contextId,
      description: dto.designation,
      item_code: dto.elementType ?? dto.designation.slice(0, 32),
      total_price: dto.totalHt ?? null,
      bid_ref: dto.bidRef ?? null,
      submitted_by: dto.submittedBy ?? null,
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
