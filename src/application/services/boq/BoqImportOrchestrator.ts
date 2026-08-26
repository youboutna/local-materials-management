/**
 * BoqImportOrchestrator — picks the right parser and applies fuzzy column mapping.
 * P0/P1: extended fuzzy detection (length/width/height/material/category) +
 * keyword-based WBS/DQE resolution when no explicit phase column is present.
 */
import type { ReferentialType } from '@/config/referentials';
import { detectElementType, normalizeUnit } from '@/config/referentials/boq';
import { detectLabour } from '@/config/referentials/boq/labour-profiles.referential';
import { getFiscalProfile } from '@/config/referentials/boq/default-values.referential';
import type { BoqResourceType, BoqSource } from '@/domain/entities/boq/BoqLine';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { mergeDimensions } from './parsers/dimensionExtraction';
import { reconcileLinePrice } from './parsers/priceCoherence';
import { BoqCalculatorService } from './BoqCalculatorService';
import { BoqCategoryResolver } from './BoqCategoryResolver';
import type { IDocumentParser, ParseResult } from './parsers/IDocumentParser';
import { SECTION_KIND_COLUMN, SECTION_LABEL_COLUMN, SECTION_PHASE_COLUMN } from './parsers/sectionDetection';
import { parseLocaleNumber, type NumberFormatMode } from './parsers/numberParsing';
import { JsonBoqParser } from './parsers/JsonBoqParser';
import { PdfBoqParser } from './parsers/PdfBoqParser';
import { SpreadsheetBoqParser } from './parsers/SpreadsheetBoqParser';

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
  /** Colonne de montant total ligne (Montant / Total) lorsqu'aucun PU n'est fourni. */
  total?: string;
  /** Colonne (réelle ou synthétique) portant le lot / chapitre du DQE. */
  lot?: string;
  /** Colonne de taux de TVA par ligne (niveau 3 de la logique fiscale). */
  vatRate?: string;
  /** Colonne de régime fiscal / nature (Fourniture, RH / Prestation, Travaux BTP…). */
  regime?: string;
}

const FUZZY: Record<keyof ImportMapping, RegExp[]> = {
  designation: [/design/i, /libell/i, /descrip/i, /d[eé]signation/i, /article/i, /prestation/i],
  unit: [/^unit/i, /unit[eé]/i, /^u\.?$/i, /^um$/i],
  quantity: [/quant/i, /qt[eé]/i, /^qty$/i, /^q$/i, /nombre/i],
  unitPrice: [/prix\s*unit/i, /^pu$/i, /unit\s*price/i, /prix\s*u/i, /p\.?u\.?/i],
  elementType: [/type/i, /^element$/i, /ouvrage/i, /nature/i],
  phaseId: [/phase/i],
  length: [/longueur/i, /^long\.?$/i, /^l\.?$/i, /length/i],
  width: [/largeur/i, /^larg\.?$/i, /^la\.?$/i, /width/i],
  height: [/hauteur|[eé]paisseur/i, /^haut\.?$/i, /^h\.?$/i, /height/i],
  material: [/mat[eé]riau/i, /material/i, /composant/i],
  category: [/cat[eé]gorie/i, /category/i, /poste/i, /rubrique/i],
  total: [/^montant/i, /montant/i, /^total/i, /prix\s*total/i, /^p\.?\s*t\.?$/i],
  lot: [/^lot$/i, /^lot\s/i, /chapitre/i, /^section$/i],
  vatRate: [/^tva\s*\(?%/i, /taux\s*(de\s*)?tva/i, /^vat/i],
  regime: [/r[eé]gime/i, /^nature\s*(fiscale)?$/i],
};

/** Régimes fiscaux déclarés en colonne → type de ressource BOQ. */
const REGIME_RESOURCE: { rx: RegExp; type: BoqResourceType }[] = [
  { rx: /rh|prestation\s*intellect|main\s*d.?œuvre|service/i, type: 'labor' },
  { rx: /location|engin|mat[eé]riel\s*roulant|[eé]quipement/i, type: 'equipment' },
  { rx: /fourniture|travaux|btp|mat[eé]riau/i, type: 'material' },
];

export class BoqImportOrchestrator {
  private readonly parsers: IDocumentParser[];
  constructor() {
    this.parsers = [new SpreadsheetBoqParser(), new PdfBoqParser(), new JsonBoqParser()];
  }

  async parseFile(file: File): Promise<ParseResult> {
    const parser = this.parsers.find((p) => p.supports(file));
    if (!parser) throw new Error(`Format non supporté : ${file.name}`);
    return parser.parse(file);
  }

  static autoMap(columns: string[]): ImportMapping {
    const map: ImportMapping = {};
    const used = new Set<string>();
    const order: (keyof ImportMapping)[] = [
      'designation',
      'unit',
      'quantity',
      'unitPrice',
      'length',
      'width',
      'height',
      'material',
      'elementType',
      'category',
      'total',
      'vatRate',
      'regime',
      'lot',
      'phaseId',
    ];

    // Les colonnes synthétiques (contexte de section) ne sont jamais mappables
    // sur un champ métier : `Lot` est traité explicitement ci-dessous.
    const synthetic = new Set<string>([SECTION_KIND_COLUMN, SECTION_LABEL_COLUMN, SECTION_PHASE_COLUMN]);
    const mappable = columns.filter((c) => !synthetic.has(c));

    for (const field of order) {
      const patterns = FUZZY[field];
      const match = mappable.find((c) => !used.has(c) && patterns.some((rx) => rx.test(String(c))));
      if (match) map[field] = match;
      if (match) used.add(match);
    }
    return map;
  }

  static toDtos(
    rows: ParseResult['rows'],
    mapping: ImportMapping,
    ctx: {
      source: BoqSource;
      contextId: string;
      phaseId?: string;
      referentialCode?: ReferentialType;
      fiscalProfileCode?: string;
      detectedVatRate?: number | null;
      numberFormat?: NumberFormatMode;
      /** Fiscalité détectée (double bloc travaux / prestations intellectuelles). */
      detectedFiscal?: import('./parsers/IDocumentParser').DetectedFiscal | null;
      /** En-tête administratif : fournisseur (expéditeur) & organisation (destinataire). */
      parties?: import('./parsers/headerDetection').DocumentParties | null;
    },
  ): BoqLineDTO[] {
    const out: BoqLineDTO[] = [];
    const fiscal = getFiscalProfile(ctx.fiscalProfileCode);
    const detected = ctx.detectedFiscal ?? null;
    const effectiveVat = ctx.detectedVatRate ?? detected?.vatRate ?? fiscal.vatRate;
    // Les prestations intellectuelles / RH ont légitimement une fiscalité propre
    // (TVA 16 % + traitement sur salaire) distincte des travaux (TVA 5 %).
    const labourVat = detected?.laborVatRate ?? effectiveVat;
    const labourPayroll = detected?.laborPayrollTaxRate ?? null;
    const partyMeta = {
      supplierName: ctx.parties?.supplier?.name ?? null,
      organizationName: ctx.parties?.organization?.name ?? null,
    };

    for (const row of rows) {
      const get = (key?: string) => (key ? row.raw[key] : null);
      const num = (v: unknown): number | null => parseLocaleNumber(v, ctx.numberFormat ?? 'auto');
      const rawQty = num(get(mapping.quantity));
      const rawTotal = num(get(mapping.total));
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
      // Dimensions explicites, complétées par celles inscrites dans le libellé
      // (« Revêtement (Larg. 1.0m) », « Dalle 5 x 2,5 x 0,15 m »).
      const dims = mergeDimensions(
        {
          length: length != null ? length * factor : null,
          width: width != null ? width * factor : null,
          height: height != null ? height * factor : null,
        },
        designation,
      );
      const lengthN = dims.length;
      const widthN = dims.width;
      const heightN = dims.height;

      const computed = rawQty ?? BoqCalculatorService.computeQuantity({ unit, length: lengthN, width: widthN, height: heightN });
      // DQE « forfaitaire » (Description / Montant) : quantité implicite = 1.
      const quantity = computed || (rawTotal != null ? 1 : computed);
      // Rejet des lignes non valorisées (titres de document, notes) : une ligne
      // DQE exploitable porte au minimum une quantité, un PU ou un montant.
      if (!designation || (!quantity && rawTotal == null && pu == null)) continue;
      // Contrôle arithmétique : quantité × P.U. = montant, sinon P.U. corrigé.
      const price = reconcileLinePrice({ quantity, unitPrice: pu, totalHt: rawTotal });
      const unitPrice = price.unitPrice;
      const totalHt = price.totalHt;

      const lotKey = mapping.lot ? String(get(mapping.lot) ?? '').trim() || null : null;
      // Nature de la section (bloc RH → main d'œuvre).
      const sectionKind = String(row.raw[SECTION_KIND_COLUMN] ?? '').trim().toLowerCase();

      // Explicit phase from source column, else fallback to ctx.phaseId, else infer
      // via the project referential (SOMELEC / PNDS / …) or static WBS keywords.
      const explicitPhase = mapping.phaseId ? String(get(mapping.phaseId) ?? '').trim() : '';
      const resolved: import('./BoqCategoryResolver').ResolvedCategory = explicitPhase
        ? {}
        : BoqCategoryResolver.resolve(designation, { referentialCode: ctx.referentialCode, unit });
      // Phase issue du titre de section (ex. « LOT 1 - PHASE 2 ») en dernier recours.
      const sectionPhase = String(row.raw[SECTION_PHASE_COLUMN] ?? '').trim() || null;
      const phaseId = ctx.phaseId ?? (explicitPhase || resolved.phaseId || sectionPhase) ?? null;
      // Normalize element type from designation via the boq referential.
      const elementCode = mapping.elementType
        ? String(get(mapping.elementType) ?? '').trim()
        : detectElementType(designation);

      // Détection RH via le référentiel `labour-profiles` : le mode de
      // facturation vient de l'unité (homme·jour / homme·mois / forfait) et le
      // profil du libellé (chef de mission, ingénieur, ouvrier…). Une location
      // d'engin facturée à la journée reste du matériel.
      const regimeRaw = mapping.regime ? String(get(mapping.regime) ?? '').trim() : '';
      const regimeType = regimeRaw
        ? REGIME_RESOURCE.find((r) => r.rx.test(regimeRaw))?.type ?? null
        : null;
      const labour = detectLabour({
        designation,
        unit,
        sectionKind: regimeType === 'labor' ? 'labour' : sectionKind,
      });
      if (!labour.isLabour && (unit === 'jour' || unit === 'mois')) resolved.resourceType = 'equipment';
      const isLabour = labour.isLabour;
      const resourceType: BoqResourceType = isLabour
        ? 'labor'
        : (regimeType ?? (resolved.resourceType as BoqResourceType) ?? 'material');

      // TVA à 3 niveaux : ligne (colonne TVA) > bloc (RH/travaux) > global.
      const lineVatRaw = mapping.vatRate ? num(get(mapping.vatRate)) : null;
      const lineVat = lineVatRaw == null ? null : lineVatRaw > 1 ? lineVatRaw / 100 : lineVatRaw;

      const sectionLabel = String(row.raw[SECTION_LABEL_COLUMN] ?? '').trim() || null;

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
        unitPrice: unitPrice ?? null,
        vatRate: lineVat ?? (isLabour ? labourVat : effectiveVat),
        totalHt,
        category: lotKey ?? null,
        metadata: {
          ...(lotKey ? { lot: lotKey } : {}),
          ...(sectionLabel ? { sectionLabel } : {}),
          fiscalBlock: isLabour ? 'labour' : 'material',
          ...(regimeRaw ? { fiscalRegime: regimeRaw } : {}),
          ...(lineVat != null ? { vatSource: 'line' } : {}),
          ...(isLabour && labour.billingMode ? { labourBillingMode: labour.billingMode } : {}),
          ...(isLabour && labour.profileCode ? { labourProfileCode: labour.profileCode } : {}),
          ...(price.corrected
            ? { priceCorrection: { originalUnitPrice: price.originalUnitPrice ?? null, reason: price.reason ?? null } }
            : {}),
          ...(isLabour && labourPayroll != null ? { payrollTaxRate: labourPayroll } : {}),
          ...(partyMeta.supplierName || partyMeta.organizationName
            ? { parties: partyMeta }
            : {}),
        },

        phaseId: phaseId || null,
        milestoneId: resolved.milestoneId ?? null,
        taskId: resolved.taskId ?? null,
        resourceType,
      };

      out.push(dto);
    }
    return out;
  }
}

export const boqImportOrchestrator = new BoqImportOrchestrator();
