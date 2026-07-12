/**
 * BoqImportOrchestrator — picks the right parser and applies fuzzy column mapping.
 * P0/P1: extended fuzzy detection (length/width/height/material/category) +
 * keyword-based WBS/DQE resolution when no explicit phase column is present.
 */
import type { IDocumentParser, ParseResult } from './parsers/IDocumentParser';
import { SpreadsheetBoqParser } from './parsers/SpreadsheetBoqParser';
import { PdfBoqParser } from './parsers/PdfBoqParser';
import { BoqCategoryResolver } from './BoqCategoryResolver';
import { BoqCalculatorService } from './BoqCalculatorService';
import { detectElementType, normalizeUnit } from '@/config/referentials/boq';
import { getFiscalProfile } from '@/config/referentials/boq/default-values.referential';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqSource, BoqResourceType } from '@/domain/boq/BoqLine';
import type { ReferentialType } from '@/config/referentials';

export interface ImportMapping {
  designation?: string;
  unit?: string;
  quantity?: string;
  unitPrice?: string;
  elementType?: string;
  phaseId?: string;
  length?: string;
  width?: string;
  height?: string;
  material?: string;
  category?: string;
}

const FUZZY: Record<keyof ImportMapping, RegExp[]> = {
  designation: [/design/i, /libell/i, /descrip/i, /d[eé]signation/i, /article/i, /prestation/i],
  unit: [/^unit/i, /unit[eé]/i, /^u\.?$/i, /^um$/i],
  quantity: [/quant/i, /qt[eé]/i, /^qty$/i, /^q$/i, /nombre/i],
  unitPrice: [/prix\s*unit/i, /^pu$/i, /unit\s*price/i, /prix\s*u/i, /p\.?u\.?/i],
  elementType: [/type/i, /^element$/i, /ouvrage/i, /nature/i],
  phaseId: [/phase/i, /^lot$/i, /chapitre/i],
  length: [/longueur/i, /^long\.?$/i, /^l\.?$/i, /length/i],
  width: [/largeur/i, /^larg\.?$/i, /^la\.?$/i, /width/i],
  height: [/hauteur|[eé]paisseur/i, /^haut\.?$/i, /^h\.?$/i, /height/i],
  material: [/mat[eé]riau/i, /material/i, /composant/i],
  category: [/cat[eé]gorie/i, /category/i, /poste/i, /rubrique/i],
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
    ctx: { source: BoqSource; contextId: string; phaseId?: string; referentialCode?: ReferentialType; fiscalProfileCode?: string; detectedVatRate?: number | null },
  ): BoqLineDTO[] {
    const out: BoqLineDTO[] = [];
    const fiscal = getFiscalProfile(ctx.fiscalProfileCode);
    const effectiveVat = ctx.detectedVatRate ?? fiscal.vatRate;
    for (const row of rows) {
      const get = (key?: string) => (key ? row.raw[key] : null);
      const num = (v: unknown): number | null => {
        if (v == null || v === '') return null;
        const n = Number(String(v).replace(/\s+/g, '').replace(',', '.'));
        return Number.isFinite(n) ? n : null;
      };
      const rawQty = num(get(mapping.quantity));
      const pu = num(get(mapping.unitPrice));
      const designation = String(get(mapping.designation) ?? '').trim();
      const length = num(get(mapping.length));
      const width = num(get(mapping.width));
      const height = num(get(mapping.height));
      const rawUnit = String(get(mapping.unit) ?? '').trim();
      const normalized = normalizeUnit(rawUnit);
      const unit = normalized.unit;
      // Convert non-metric lengths (ft/in/cm/mm) with the mapping factor.
      const factor = normalized.factor;
      const lengthN = length != null ? length * factor : null;
      const widthN = width != null ? width * factor : null;
      const heightN = height != null ? height * factor : null;

      const quantity = rawQty ?? BoqCalculatorService.computeQuantity({ unit, length: lengthN, width: widthN, height: heightN });
      if (!designation && !quantity) continue;

      // Explicit phase from source column, else fallback to ctx.phaseId, else infer
      // via the project referential (SOMELEC / PNDS / …) or static WBS keywords.
      const explicitPhase = mapping.phaseId ? String(get(mapping.phaseId) ?? '').trim() : '';
      const resolved: import('./BoqCategoryResolver').ResolvedCategory = explicitPhase
        ? {}
        : BoqCategoryResolver.resolve(designation, { referentialCode: ctx.referentialCode, unit });
      const phaseId = ctx.phaseId ?? (explicitPhase || resolved.phaseId) ?? null;
      // Normalize element type from designation via the boq referential.
      const elementCode = mapping.elementType
        ? String(get(mapping.elementType) ?? '').trim()
        : detectElementType(designation);

      const dto: BoqLineDTO = {
        source: ctx.source,
        contextId: ctx.contextId,
        designation: designation || elementCode || 'Ligne',
        elementType: elementCode || null,
        unit,
        quantity: Number.isFinite(quantity) ? quantity : 0,
        length: lengthN,
        width: widthN,
        height: heightN,
        unitPrice: pu ?? null,
        vatRate: effectiveVat,
        totalHt: pu != null ? quantity * pu : null,
        phaseId: phaseId || null,
        milestoneId: resolved.milestoneId ?? null,
        taskId: resolved.taskId ?? null,
        resourceType: (resolved.resourceType as BoqResourceType) ?? 'material',
      };
      out.push(dto);
    }
    return out;
  }
}

export const boqImportOrchestrator = new BoqImportOrchestrator();
