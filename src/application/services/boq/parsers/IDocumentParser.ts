/**
 * IDocumentParser — port for turning binary/text sources into BoqLineDTO drafts.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

export interface ParsedBoqRow {
  raw: Record<string, string | number | null>;
  suggestion?: Partial<BoqLineDTO>;
}

export interface ParseResult {
  rows: ParsedBoqRow[];
  columns: string[];
  warnings: string[];
}

export interface IDocumentParser {
  supports(file: File): boolean;
  parse(file: File): Promise<ParseResult>;
}
