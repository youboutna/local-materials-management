/**
 * IDocumentParser — port for turning binary/text sources into BoqLineDTO drafts.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

export interface ParsedBoqRow {
  raw: Record<string, string | number | null>;
  suggestion?: Partial<BoqLineDTO>;
}

export interface DetectedFiscal {
  vatRate?: number;         // e.g. 0.16
  overheadRate?: number;    // e.g. 0.04 (Frais Généraux)
  withholdingRate?: number; // e.g. 0.03 (RAS BIC)
  totalHt?: number;
  totalTtc?: number;
}

export interface ParseResult {
  rows: ParsedBoqRow[];
  columns: string[];
  warnings: string[];
  detectedFiscal?: DetectedFiscal;
}

export interface IDocumentParser {
  supports(file: File): boolean;
  parse(file: File): Promise<ParseResult>;
}
