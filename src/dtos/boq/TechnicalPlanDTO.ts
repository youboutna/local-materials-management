import type { ElementTypeCode } from '@/config/referentials/boq/element-types.referential';

export interface TechnicalPlanPageDTO {
  page: number;
  text: string;
  source: 'text' | 'ocr';
  confidence: number;
}

export interface TechnicalPlanElementDTO {
  ref: string;
  page: number;
  rawLabel: string;
  elementType: ElementTypeCode;
  length?: number;
  width?: number;
  height?: number;
  count: number;
  confirmed: boolean;
  /** Nombre d'apparitions du repère sur la page : observation, jamais additionnée au nombre. */
  occurrences?: number;
}

/** Surface annotée sur le plan, conservée pour revue (aucune quantité générée). */
export interface TechnicalPlanSurfaceDTO {
  page: number;
  rawLabel: string;
  area: number;
}

export interface TechnicalPlanDTO {
  fileName: string;
  sha256: string;
  pages: TechnicalPlanPageDTO[];
  cartouches: { page: number; scale?: number; planche?: string; phase?: string; date?: string }[];
  elements: TechnicalPlanElementDTO[];
  surfaces?: TechnicalPlanSurfaceDTO[];
  warnings: { code: 'missing_scale' | 'missing_dimensions' | 'ocr_low_confidence' | 'ambiguous_unit' | 'duplicate_page' | 'repeated_marker' | 'marker_without_dimensions'; page: number }[];
}