/**
 * MeterInputDTO — unified input record produced by the UnifiedBoqParser,
 * consumed by the BOQ import pipeline (DQE, Tender Estimator, Quantity Takeoff,
 * Advanced Quantity Calculator).
 *
 * Superset of BoqLineDTO enriched with parser provenance + geometric
 * openings so the calculation engine can deduct them from gross surfaces.
 */
import type { BoqLineDTO } from './BoqLineDTO';

export type MeterInputSourceFormat = 'pdf' | 'xlsx' | 'xls' | 'csv' | 'calculator';

export interface MeterInputProvenance {
  format: MeterInputSourceFormat;
  fileName?: string;
  rowIndex?: number;
  page?: number;
}

/** Ouverture (porte / fenêtre) exprimée en mètres. */
export interface MeterOpening {
  width: number;   // m
  height: number;  // m
  count?: number;  // défaut = 1
  label?: string;
}

export interface MeterInputDTO extends BoqLineDTO {
  provenance?: MeterInputProvenance;
  /** Ouvertures à déduire de la surface brute (mur / cloison). */
  openings?: MeterOpening[];
  /** Force ou désactive la déduction — sinon dérivée du référentiel `element-types`. */
  deductOpenings?: boolean;
}
