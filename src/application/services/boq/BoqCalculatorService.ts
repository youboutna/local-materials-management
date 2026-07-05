/**
 * BOQ Calculator — pure domain service.
 * Shared by QuantityTakeoff (métré projet), Tender Estimator, DQE Import.
 *
 * Zero React, zero Supabase — hexagonal-safe.
 */

import { BOQ_UNIT_BY_CODE, BoqUnit, isBoqUnit } from '@/config/referentials/boq/units.referential';

export interface BoqLineInput {
  unit: BoqUnit | string;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  quantity?: number | null; // when set explicitly (e.g. count for "unité")
  unitPrice?: number | null;
  vatRate?: number | null; // 0.20 = 20%
}

export interface BoqLineTotals {
  quantity: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
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

  /** Line totals HT / TVA / TTC. */
  static computeTotals(input: BoqLineInput): BoqLineTotals {
    const quantity = BoqCalculatorService.computeQuantity(input);
    const unitPrice = input.unitPrice ?? 0;
    const vatRate = input.vatRate ?? 0;
    const totalHt = quantity * unitPrice;
    const totalTva = totalHt * vatRate;
    const totalTtc = totalHt + totalTva;
    return { quantity, totalHt, totalTva, totalTtc };
  }

  /** Aggregate totals over a set of lines. */
  static aggregate(lines: BoqLineInput[]): BoqLineTotals {
    return lines.reduce<BoqLineTotals>(
      (acc, l) => {
        const t = BoqCalculatorService.computeTotals(l);
        return {
          quantity: acc.quantity + t.quantity,
          totalHt: acc.totalHt + t.totalHt,
          totalTva: acc.totalTva + t.totalTva,
          totalTtc: acc.totalTtc + t.totalTtc,
        };
      },
      { quantity: 0, totalHt: 0, totalTva: 0, totalTtc: 0 }
    );
  }

  /** Group by any WBS key (phaseId / milestoneId / taskId). */
  static aggregateBy<T extends BoqLineInput & { [k: string]: unknown }>(
    lines: T[],
    key: string
  ): Record<string, BoqLineTotals> {
    const out: Record<string, BoqLineTotals> = {};
    for (const l of lines) {
      const k = String(l[key] ?? '__unassigned__');
      const cur = out[k] ?? { quantity: 0, totalHt: 0, totalTva: 0, totalTtc: 0 };
      const t = BoqCalculatorService.computeTotals(l);
      out[k] = {
        quantity: cur.quantity + t.quantity,
        totalHt: cur.totalHt + t.totalHt,
        totalTva: cur.totalTva + t.totalTva,
        totalTtc: cur.totalTtc + t.totalTtc,
      };
    }
    return out;
  }
}
