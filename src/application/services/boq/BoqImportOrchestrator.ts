/**
 * BoqImportOrchestrator — picks the right parser and applies fuzzy column mapping.
 */
import type { IDocumentParser, ParseResult } from './parsers/IDocumentParser';
import { SpreadsheetBoqParser } from './parsers/SpreadsheetBoqParser';
import { PdfBoqParser } from './parsers/PdfBoqParser';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqSource } from '@/domain/boq/BoqLine';

export interface ImportMapping {
  designation?: string;
  unit?: string;
  quantity?: string;
  unitPrice?: string;
  elementType?: string;
  phaseId?: string;
}

const FUZZY: Record<keyof ImportMapping, RegExp[]> = {
  designation: [/design/i, /libell/i, /descrip/i, /designation/i],
  unit: [/^unit/i, /unit[eé]/i, /^u\.?$/i],
  quantity: [/quant/i, /qt[eé]/i, /^qty$/i, /^q$/i],
  unitPrice: [/prix\s*unit/i, /^pu$/i, /unit\s*price/i, /prix\s*u/i],
  elementType: [/type/i, /element/i, /ouvrage/i],
  phaseId: [/phase/i, /lot/i],
};

export class BoqImportOrchestrator {
  private readonly parsers: IDocumentParser[];
  constructor() {
    this.parsers = [new SpreadsheetBoqParser(), new PdfBoqParser()];
  }

  async parseFile(file: File): Promise<ParseResult> {
    const parser = this.parsers.find((p) => p.supports(file));
    if (!parser) throw new Error(`Format non supporté : ${file.name}`);
    return parser.parse(file);
  }

  static autoMap(columns: string[]): ImportMapping {
    const map: ImportMapping = {};
    for (const [field, patterns] of Object.entries(FUZZY) as [keyof ImportMapping, RegExp[]][]) {
      const match = columns.find((c) => patterns.some((rx) => rx.test(String(c))));
      if (match) map[field] = match;
    }
    return map;
  }

  static toDtos(
    rows: ParseResult['rows'],
    mapping: ImportMapping,
    ctx: { source: BoqSource; contextId: string; phaseId?: string },
  ): BoqLineDTO[] {
    return rows
      .map((row) => {
        const get = (key?: string) => (key ? row.raw[key] : null);
        const qty = Number(get(mapping.quantity) ?? 0);
        const pu = mapping.unitPrice ? Number(get(mapping.unitPrice) ?? 0) : null;
        const designation = String(get(mapping.designation) ?? '').trim();
        if (!designation && !qty) return null;
        const unit = String(get(mapping.unit) ?? 'unité').trim() || 'unité';
        const phaseId = ctx.phaseId ?? (mapping.phaseId ? String(get(mapping.phaseId) ?? '') : undefined);
        return {
          source: ctx.source,
          contextId: ctx.contextId,
          designation: designation || (mapping.elementType ? String(get(mapping.elementType) ?? '') : 'Ligne'),
          elementType: mapping.elementType ? String(get(mapping.elementType) ?? '') : null,
          unit,
          quantity: Number.isFinite(qty) ? qty : 0,
          unitPrice: pu != null && Number.isFinite(pu) ? pu : null,
          totalHt: pu != null && Number.isFinite(pu) ? qty * pu : null,
          phaseId: phaseId || null,
          resourceType: 'material',
        } satisfies BoqLineDTO;
      })
      .filter((x): x is BoqLineDTO => x !== null);
  }
}

export const boqImportOrchestrator = new BoqImportOrchestrator();
