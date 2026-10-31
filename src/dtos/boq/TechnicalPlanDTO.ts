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
}

export interface TechnicalPlanDTO {
  fileName: string;
  sha256: string;
  pages: TechnicalPlanPageDTO[];
  cartouches: { page: number; scale?: number; planche?: string; phase?: string; date?: string }[];
  elements: TechnicalPlanElementDTO[];
  warnings: { code: 'missing_scale' | 'missing_dimensions' | 'ocr_low_confidence' | 'ambiguous_unit' | 'duplicate_page'; page: number }[];
}