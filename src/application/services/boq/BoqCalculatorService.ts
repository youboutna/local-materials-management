/**
 * BOQ Calculator — pure domain service.
 * Shared by QuantityTakeoff (métré projet), Tender Estimator, DQE Import.
 *
 * Zero React, zero Supabase — hexagonal-safe.
 */

import { BOQ_UNIT_BY_CODE, BoqUnit, isBoqUnit } from '@/config/referentials/boq/units.referential';
import { DEFAULT_FISCAL_PROFILE, type BoqFiscalProfile } from '@/config/referentials/boq/default-values.referential';
import { resolveLineTax, buildVatBuckets, type VatBucket } from '@/config/referentials/boq/tax-regimes.referential';

export interface BoqLineInput {
  unit: BoqUnit | string;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  quantity?: number | null; // when set explicitly (e.g. count for "unité")
  unitPrice?: number | null;
  vatRate?: number | null; // 0.16 = 16% (fallback to fiscal profile when null)
  rasRate?: number | null;
  fees?: number | null;
  /** Régime de taxation explicite (référentiel tax-regimes). */
  taxRegimeCode?: string | null;
  /** Indices de rattachement au régime (nature de la prestation). */
  resourceType?: string | null;
  category?: string | null;
  elementType?: string | null;
  designation?: string | null;
}

export interface BoqLineTotals {
  quantity: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  withholding?: number;   // RAS BIC applied on HT (opt.)
  netToPay?: number;      // TTC − retenues (opt.)
}

/**
 * Surcharges de TVA à trois niveaux (doctrine fiscale du document) :
 *   1. Ligne      → `line.vatRate` (saisie explicite, priorité absolue)
 *   2. Catégorie  → `byCategory[categorie|resourceType|elementType]`
 *   3. Global     → `globalVatRate` (en-tête du document)
 * puis, à défaut : régime de prestation → profil fiscal pays.
 */
export interface BoqVatOverrides {
  globalVatRate?: number | null;
  byCategory?: Record<string, number | null | undefined>;
}

export class BoqCalculatorService {
  /**
   * Compute the quantity for a single line from dims + unit rules.
   * Never throws — returns 0 for invalid unit.
   */
  static computeQuantity(input: BoqLineInput): number {
    if (input.quantity !== null && input.quantity !== undefined && input.quantity > 0) {
      return input.quantity;
    }
    if (!isBoqUnit(input.unit as string)) return 0;
    const def = BOQ_UNIT_BY_CODE[input.unit as BoqUnit];
    return def.compute(input.length ?? 0, input.width ?? undefined, input.height ?? undefined);
  }

  /** Taux de TVA effectif d'une ligne selon la hiérarchie ligne → catégorie → global. */
  static resolveVatRate(
    input: BoqLineInput,
    profile?: BoqFiscalProfile,
    overrides?: BoqVatOverrides | null,
  ): number {
    if (input.vatRate !== null && input.vatRate !== undefined) return input.vatRate;
    const keys = [input.category, input.resourceType, input.elementType]
      .map((k) => (k == null ? '' : String(k)))
      .filter(Boolean);
    for (const key of keys) {
      const rate = overrides?.byCategory?.[key];
      if (rate !== null && rate !== undefined) return rate;
    }
    if (overrides?.globalVatRate !== null && overrides?.globalVatRate !== undefined) {
      return overrides.globalVatRate;
    }
    return resolveLineTax(input, profile).vatRate;
  }

  /** Line totals HT / TVA / TTC (+ retenues if a fiscal profile is provided). */
  static computeTotals(
    input: BoqLineInput,
    profile?: BoqFiscalProfile,
    overrides?: BoqVatOverrides | null,
  ): BoqLineTotals {
    const quantity = BoqCalculatorService.computeQuantity(input);
    const unitPrice = input.unitPrice ?? 0;
    const tax = resolveLineTax(input, profile);
    const vatRate = BoqCalculatorService.resolveVatRate(input, profile, overrides);
    const totalHt = quantity * unitPrice + (input.fees ?? 0);
    const totalTva = totalHt * vatRate;
    const withholding = totalHt * tax.rasRate;
    const totalTtc = totalHt + totalTva;
    if (!profile && input.rasRate == null) return { quantity, totalHt, totalTva, totalTtc };
    const netToPay = totalTtc - withholding;
    return { quantity, totalHt, totalTva, totalTtc, withholding, netToPay };
  }


  /** Aggregate totals over a set of lines. */
  static aggregate(lines: BoqLineInput[], profile?: BoqFiscalProfile): BoqLineTotals {
    return lines.reduce<BoqLineTotals>(
      (acc, l) => {
        const t = BoqCalculatorService.computeTotals(l, profile);
        return {
          quantity: acc.quantity + t.quantity,
          totalHt: acc.totalHt + t.totalHt,
          totalTva: acc.totalTva + t.totalTva,
          totalTtc: acc.totalTtc + t.totalTtc,
          withholding: (acc.withholding ?? 0) + (t.withholding ?? 0),
          netToPay: (acc.netToPay ?? 0) + (t.netToPay ?? 0),
        };
      },
      { quantity: 0, totalHt: 0, totalTva: 0, totalTtc: 0, withholding: 0, netToPay: 0 }
    );
  }

  /** Group by any WBS key (phaseId / milestoneId / taskId). */
  static aggregateBy<T extends BoqLineInput & { [k: string]: unknown }>(
    lines: T[],
    key: string,
    profile?: BoqFiscalProfile,
  ): Record<string, BoqLineTotals> {
    const out: Record<string, BoqLineTotals> = {};
    for (const l of lines) {
      const k = String(l[key] ?? '__unassigned__');
      const cur = out[k] ?? { quantity: 0, totalHt: 0, totalTva: 0, totalTtc: 0, withholding: 0, netToPay: 0 };
      const t = BoqCalculatorService.computeTotals(l, profile);
      out[k] = {
        quantity: cur.quantity + t.quantity,
        totalHt: cur.totalHt + t.totalHt,
        totalTva: cur.totalTva + t.totalTva,
        totalTtc: cur.totalTtc + t.totalTtc,
        withholding: (cur.withholding ?? 0) + (t.withholding ?? 0),
        netToPay: (cur.netToPay ?? 0) + (t.netToPay ?? 0),
      };
    }
    return out;
  }

  /**
   * Ventilation TVA multi-taux : la TVA n'est pas uniforme sur un DQE
   * (travaux / fourniture / consulting / exonéré bailleur).
   */
  static vatBuckets(lines: BoqLineInput[], profile?: BoqFiscalProfile): VatBucket[] {
    return buildVatBuckets(
      lines.map((l) => {
        const tax = resolveLineTax(l, profile);
        const t = BoqCalculatorService.computeTotals(l, profile);
        return {
          totalHt: t.totalHt,
          vatRate: tax.vatRate,
          vatCategoryCode: tax.vatCategoryCode,
          exemptionReason: tax.exemptionReason,
        };
      }),
    );
  }

  /**
   * Contrôle de cohérence HT / TVA / TTC entre les lignes et le récapitulatif
   * (tolérance d'arrondi 0,01). Ne lève jamais : retourne le diagnostic.
   */
  static checkConsistency(
    lines: BoqLineInput[],
    document: { totalHt?: number | null; totalTva?: number | null; totalTtc?: number | null },
    profile?: BoqFiscalProfile,
    tolerance = 0.01,
  ): { consistent: boolean; expected: BoqLineTotals; deltas: { ht: number; tva: number; ttc: number } } {
    const expected = BoqCalculatorService.aggregate(lines, profile);
    const deltas = {
      ht: Math.abs((document.totalHt ?? expected.totalHt) - expected.totalHt),
      tva: Math.abs((document.totalTva ?? expected.totalTva) - expected.totalTva),
      ttc: Math.abs((document.totalTtc ?? expected.totalTtc) - expected.totalTtc),
    };
    const consistent = deltas.ht <= tolerance && deltas.tva <= tolerance && deltas.ttc <= tolerance;
    return { consistent, expected, deltas };
  }

  /** Convenience: default Mauritania profile. */
  static defaultProfile(): BoqFiscalProfile { return DEFAULT_FISCAL_PROFILE; }
}
