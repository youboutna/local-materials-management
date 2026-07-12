/**
 * MeterInputDTO — unified input record produced by the UnifiedBoqParser,
 * consumed by the BOQ import pipeline (DQE, Tender Estimator, Quantity Takeoff,
 * Advanced Quantity Calculator).
 *
 * It is a superset of BoqLineDTO enriched with parser provenance so the UI can
 * trace each line back to its source file/row.
 */
import type { BoqLineDTO } from './BoqLineDTO';

export type MeterInputSourceFormat = 'pdf' | 'xlsx' | 'xls' | 'csv' | 'calculator';

export interface MeterInputProvenance {
  format: MeterInputSourceFormat;
  fileName?: string;
  rowIndex?: number;
  page?: number;
}

export interface MeterInputDTO extends BoqLineDTO {
  provenance?: MeterInputProvenance;
}
