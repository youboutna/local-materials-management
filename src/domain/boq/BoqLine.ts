/**
 * BoqLine — Unified Bill Of Quantities line entity.
 * Shared kernel used by QuantityTakeoff, Tender Estimator, DQE Import and Supplier Bids.
 * Readonly + factory create() per project entity convention.
 */

import { WbsRef } from './WbsRef';

export type BoqSource =
  | 'quantity_takeoff'
  | 'tender_estimate'
  | 'supplier_bid'
  | 'dqe';

export type BoqResourceType = 'material' | 'labor' | 'equipment';

export interface BoqLineProps {
  id?: string | null;
  source: BoqSource;
  /** projectId | tenderId | estimateId according to source. */
  contextId: string;
  designation: string;
  elementType?: string | null;
  unit: string;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  quantity: number;
  unitPrice?: number | null;
  vatRate?: number | null;
  totalHt?: number | null;
  materialId?: string | null;
  wbs?: WbsRef | null;
  resourceType?: BoqResourceType;
  note?: string | null;
  bidRef?: string | null;
  submittedBy?: string | null;
}

export class BoqLine {
  private constructor(private readonly props: Readonly<BoqLineProps>) {}

  static create(props: BoqLineProps): BoqLine {
    return new BoqLine({
      resourceType: 'material',
      vatRate: 0,
      ...props,
    });
  }

  get id() { return this.props.id ?? null; }
  get source() { return this.props.source; }
  get contextId() { return this.props.contextId; }
  get designation() { return this.props.designation; }
  get elementType() { return this.props.elementType ?? null; }
  get unit() { return this.props.unit; }
  get length() { return this.props.length ?? null; }
  get width() { return this.props.width ?? null; }
  get height() { return this.props.height ?? null; }
  get quantity() { return this.props.quantity; }
  get unitPrice() { return this.props.unitPrice ?? null; }
  get vatRate() { return this.props.vatRate ?? 0; }
  get totalHt() { return this.props.totalHt ?? (this.quantity * (this.unitPrice ?? 0)); }
  get totalTtc() { return this.totalHt * (1 + this.vatRate); }
  get materialId() { return this.props.materialId ?? null; }
  get wbs() { return this.props.wbs ?? null; }
  get resourceType(): BoqResourceType { return this.props.resourceType ?? 'material'; }
  get note() { return this.props.note ?? null; }
  get bidRef() { return this.props.bidRef ?? null; }
  get submittedBy() { return this.props.submittedBy ?? null; }

  toJSON(): BoqLineProps { return { ...this.props }; }
}
