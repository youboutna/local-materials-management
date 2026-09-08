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
import { isEnvelopeNoise } from './parsers/envelopeDetection';
import { reconcileLinePrice } from './parsers/priceCoherence';
import { TaxService } from '@/application/services/TaxService';
import { BoqCalculatorService } from './BoqCalculatorService';
import { MeterService } from './MeterService';

import { BoqCategoryResolver } from './BoqCategoryResolver';
import type { IDocumentParser, ParseResult } from './parsers/IDocumentParser';
import { SECTION_KIND_COLUMN, SECTION_LABEL_COLUMN, SECTION_PHASE_COLUMN } from './parsers/sectionDetection';
import { parseLocaleNumber, type NumberFormatMode } from './parsers/numberParsing';
import { JsonBoqParser } from './parsers/JsonBoqParser';
import { PdfBoqParser } from './parsers/PdfBoqParser';
import { SpreadsheetBoqParser } from './parsers/SpreadsheetBoqParser';
import { TextTableBoqParser } from './parsers/TextTableBoqParser';
import { detectMetre } from './parsers/metreDetection';
import { analyzeLineCoherence } from './parsers/lineCoherence';

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

/**
 * Correspondance d'en-têtes FR / EN / AR : un DQE arabe (« البيان », « الكمية »)
 * ou anglais (« Description », « Qty ») est mappé sans configuration.
 */
const FUZZY: Record<keyof ImportMapping, RegExp[]> = {
  designation: [/design/i, /libell/i, /descrip/i, /d[eé]signation/i, /article/i, /prestation/i, /البيان|الوصف|التعيين/],
  unit: [/^unit/i, /unit[eé]/i, /^u\.?$/i, /^um$/i, /الوحدة/],
  quantity: [/quant/i, /qt[eé]/i, /^qty$/i, /^q$/i, /nombre/i, /الكمية|العدد/],
  unitPrice: [/prix\s*unit/i, /^pu$/i, /unit\s*price/i, /prix\s*u/i, /p\.?u\.?/i, /سعر\s*الوحدة|الثمن/],
  elementType: [/type/i, /^element$/i, /ouvrage/i, /nature/i, /النوع/],
  phaseId: [/phase/i, /المرحلة/],
  length: [/longueur/i, /^long\.?$/i, /^l\.?$/i, /length/i, /الطول/],
  width: [/largeur/i, /^larg\.?$/i, /^la\.?$/i, /width/i, /العرض/],
  height: [/hauteur|[eé]paisseur/i, /^haut\.?$/i, /^h\.?$/i, /height/i, /الارتفاع|السماكة/],
  material: [/mat[eé]riau/i, /material/i, /composant/i, /المادة/],
  category: [/cat[eé]gorie/i, /category/i, /poste/i, /rubrique/i, /الفئة/],
  total: [/^montant/i, /montant/i, /^total/i, /prix\s*total/i, /^p\.?\s*t\.?$/i, /amount/i, /المجموع|الإجمالي/],
  lot: [/^lot$/i, /^lot\s/i, /chapitre/i, /^section$/i, /^batch\b/i, /القسم|الفصل/],
  vatRate: [/^tva\s*\(?%/i, /taux\s*(de\s*)?tva/i, /^vat/i, /الضريبة|القيمة\s*المضافة/],
  regime: [/r[eé]gime/i, /^nature\s*(fiscale)?$/i, /النظام\s*الضريبي/],
};

/** Libellés d'en-tête répétés dans le corps du document — jamais des lignes DQE. */
const HEADER_LIKE_RX =
  /^(n[°o]?|d[eé]signation|libell[eé]|description|intitul[eé]|unit[eé]?|qu?antit[eé]|qt[eé]?|p\.?\s*u\.?|prix\s*unitaire|montant|total|observations?)\b/i;


/** Régimes fiscaux déclarés en colonne → type de ressource BOQ. */
const REGIME_RESOURCE: { rx: RegExp; type: BoqResourceType }[] = [
  { rx: /rh|prestation\s*intellect|main\s*d.?œuvre|service/i, type: 'labor' },
  { rx: /location|engin|mat[eé]riel\s*roulant|[eé]quipement/i, type: 'equipment' },
  { rx: /fourniture|travaux|btp|mat[eé]riau/i, type: 'material' },
];

export class BoqImportOrchestrator {
  private readonly parsers: IDocumentParser[];
  constructor() {
    this.parsers = [new SpreadsheetBoqParser(), new PdfBoqParser(), new JsonBoqParser(), new TextTableBoqParser()];
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
      const baseQuantity = computed || (rawTotal != null ? 1 : computed);
      // Métré centralisé : le type d'ouvrage détecté + les dimensions (colonnes ou
      // libellé « L: 8,0 m x l: 5,0 m x H: 3,5 m ») donnent la quantité réelle.
      // Une quantité source « 1 » n'est qu'un forfait de saisie : le métré prime.
      const detectedElement = mapping.elementType
        ? String(get(mapping.elementType) ?? '').trim()
        : detectElementType(designation);
      const geoQuantity = MeterService.quantityFor({
        designation,
        elementType: detectedElement || null,
        length: lengthN,
        width: widthN,
        height: heightN,
      }).quantity;
      const useGeo = geoQuantity > 0 && baseQuantity <= 1 && geoQuantity > baseQuantity;
      const quantity = useGeo ? geoQuantity : baseQuantity;

      // Une ligne DQE réelle porte une valeur VENUE DE LA SOURCE (qté, PU, montant
      // ou dimensions en colonnes). Une quantité seulement déduite des dimensions
      // écrites dans le libellé (« 4x150 mm² ») ne suffit pas : c'est la suite
      // technique de la désignation précédente, pas une nouvelle ligne.
      const hasSourceValue =
        rawQty != null || rawTotal != null || pu != null ||
        length != null || width != null || height != null;
      const isValued = hasSourceValue;
      if (!designation) continue;
      // Lignes d'en-tête répétées dans le corps du document (« Désignation | Unité | Qté »).
      if (!isValued && HEADER_LIKE_RX.test(designation)) continue;
      if (!isValued) {
        // Retour à la ligne du libellé (« 4x150 mm² » sous « Câble U-1000 RO2V ») :
        // on complète la désignation précédente au lieu de créer une fausse ligne,
        // puis on RE-JOUE le métré (dimensions dans le fragment, type d'ouvrage,
        // quantité dérivée) afin de ne rien perdre de la détection référentielle.
        const prev = out[out.length - 1];
        // Un fragment d'enveloppe (contact, mention Factur-X, pagination) ne doit
        // ni créer une ligne ni polluer la désignation précédente.
        if (isEnvelopeNoise(designation)) continue;
        if (prev && designation.length <= 120) {
          const merged = `${prev.designation} ${designation}`.replace(/\s+/g, ' ').trim();
          prev.designation = merged;
          const mDims = mergeDimensions(
            { length: prev.length ?? null, width: prev.width ?? null, height: prev.height ?? null },
            merged,
          );
          prev.length = mDims.length;
          prev.width = mDims.width;
          prev.height = mDims.height;
          if (!prev.elementType || prev.elementType === 'generic') {
            prev.elementType = detectElementType(merged) || prev.elementType;
          }
          // Quantité non fournie explicitement : la recalculer avec les dimensions retrouvées.
          const reQty = BoqCalculatorService.computeQuantity({
            unit: prev.unit,
            length: mDims.length,
            width: mDims.width,
            height: mDims.height,
          });
          if (reQty && !prev.quantity) {
            prev.quantity = reQty;
            if (prev.unitPrice != null) prev.totalHt = reQty * prev.unitPrice;
          }
        }
        continue;
      }



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
      const elementCode = detectedElement;


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

      // Métré (scénarios 3 & 8) : une ligne de terrassement facturée au mètre
      // linéaire porte un volume — recalculé via le référentiel `earthwork-metre`
      // puis assorti de recommandations d'ouvrages complémentaires.
      const metre = detectMetre({ designation, unit, quantity });

      // Rapport de cohérence non bloquant : unité technique du libellé vs unité
      // de quantité, prix vs fourchette de marché, contrôle arithmétique.
      const coherence = analyzeLineCoherence({
        designation,
        unit,
        quantity,
        unitPrice,
        totalHt,
        vatRate: lineVat ?? (isLabour ? labourVat : effectiveVat),
      });

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
          ...(useGeo
            ? { metreQuantity: { source: 'geometric', declared: baseQuantity, computed: geoQuantity } }
            : {}),

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
          ...(metre
            ? {
                metre: {
                  profileCode: metre.profileCode,
                  profileLabel: metre.profileLabel,
                  volume: metre.volume,
                  unit: metre.unit,
                  width: metre.width,
                  depth: metre.depth,
                  formula: metre.formula,
                  fromDesignation: metre.fromDesignation,
                },
                metreRecommendations: metre.recommendations,
              }
            : {}),
          coherence,
        },

        phaseId: phaseId || null,
        milestoneId: resolved.milestoneId ?? null,
        taskId: resolved.taskId ?? null,
        resourceType,
      };

      // Fiscalité ligne à ligne : régime (référentiel TAX_REGIMES) + imputation
      // PCM. La TVA détectée sur la ligne/le bloc reste prioritaire.
      const rawPick = (...keys: string[]): string | null => {
        for (const k of keys) {
          const v = row.raw[k] ?? row.raw[k.toLowerCase()] ?? row.raw[k.toUpperCase()];
          if (v != null && String(v).trim()) return String(v).trim();
        }
        return null;
      };
      // Conditions de déductibilité LFR 2026 lues dans la source si présentes.
      const supplierNif = rawPick('nif', 'NIF', 'nif_fournisseur', 'Nif fournisseur');
      const paymentMethod = rawPick('mode_paiement', 'Mode de paiement', 'moyen_paiement', 'payment_method');
      if (supplierNif) { dto.supplierNif = supplierNif; dto.supplierNifStatus = 'unknown'; }
      if (paymentMethod) dto.paymentMethod = paymentMethod.toLowerCase().replace(/\s+/g, '_');

      const tax = TaxService.resolve(
        { ...dto, accountCode: rawPick('compte', 'Compte', 'compte_pcm', 'account_code'), vatRate: lineVat },
        { vatRate: effectiveVat },
      );
      dto.taxRegimeCode = tax.regimeCode;
      dto.accountCode = tax.accountCode;
      if (lineVat == null && tax.origin === 'account') dto.vatRate = tax.vatRate;
      if (!dto.rasRate && tax.rasRate) dto.rasRate = tax.rasRate;


      out.push(dto);
    }
    return out;
  }
}

export const boqImportOrchestrator = new BoqImportOrchestrator();
