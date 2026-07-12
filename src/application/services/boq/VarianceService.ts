/**
 * VarianceService — pure planned vs actual analytics for the Planning tab.
 *
 * Consumes BoqLineDTO[] and produces per-WBS deltas (quantity, cost, %) that
 * feed the "Réalisé vs Planifié" section and CSV exports. No React, no I/O.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

export type VarianceGroupKey = 'phaseId' | 'milestoneId' | 'taskId' | 'resourceType';

export interface VarianceRow {
  key: string;
  plannedQuantity: number;
  actualQuantity: number;
  plannedCost: number;
  actualCost: number;
  quantityDelta: number;
  costDelta: number;
  quantityDeltaPct: number; // 0.15 = +15%
  costDeltaPct: number;
}

export interface VarianceTotals {
  plannedCost: number;
  actualCost: number;
  costDelta: number;
  costDeltaPct: number;
}

export interface VarianceReport {
  rows: VarianceRow[];
  totals: VarianceTotals;
}

function pct(delta: number, base: number): number {
  if (!base) return 0;
  return delta / base;
}

function lineCost(l: BoqLineDTO): number {
  if (l.totalHt != null) return l.totalHt;
  const q = l.quantity ?? 0;
  const pu = l.unitPrice ?? 0;
  return q * pu;
}

export class VarianceService {
  /** Sum quantity + cost per group key across a set of BoqLineDTO. */
  static rollup(lines: BoqLineDTO[], groupBy: VarianceGroupKey): Map<string, { quantity: number; cost: number }> {
    const out = new Map<string, { quantity: number; cost: number }>();
    for (const l of lines) {
      const key = String((l as unknown as Record<string, unknown>)[groupBy] ?? '__unassigned__');
      const cur = out.get(key) ?? { quantity: 0, cost: 0 };
      cur.quantity += l.quantity ?? 0;
      cur.cost += lineCost(l);
      out.set(key, cur);
    }
    return out;
  }

  /** Build a variance report from two BoqLineDTO sets. */
  static compare(
    planned: BoqLineDTO[],
    actual: BoqLineDTO[],
    groupBy: VarianceGroupKey = 'phaseId',
  ): VarianceReport {
    const p = VarianceService.rollup(planned, groupBy);
    const a = VarianceService.rollup(actual, groupBy);
    const keys = new Set<string>([...p.keys(), ...a.keys()]);
    const rows: VarianceRow[] = [];
    let plannedCost = 0;
    let actualCost = 0;
    for (const key of keys) {
      const pv = p.get(key) ?? { quantity: 0, cost: 0 };
      const av = a.get(key) ?? { quantity: 0, cost: 0 };
      const qDelta = av.quantity - pv.quantity;
      const cDelta = av.cost - pv.cost;
      plannedCost += pv.cost;
      actualCost += av.cost;
      rows.push({
        key,
        plannedQuantity: pv.quantity,
        actualQuantity: av.quantity,
        plannedCost: pv.cost,
        actualCost: av.cost,
        quantityDelta: qDelta,
        costDelta: cDelta,
        quantityDeltaPct: pct(qDelta, pv.quantity),
        costDeltaPct: pct(cDelta, pv.cost),
      });
    }
    rows.sort((x, y) => Math.abs(y.costDelta) - Math.abs(x.costDelta));
    const costDelta = actualCost - plannedCost;
    return {
      rows,
      totals: {
        plannedCost,
        actualCost,
        costDelta,
        costDeltaPct: pct(costDelta, plannedCost),
      },
    };
  }

  /** Serialize a report as CSV (semicolon-separated, FR locale friendly). */
  static toCsv(report: VarianceReport, groupBy: VarianceGroupKey = 'phaseId'): string {
    const header = [groupBy, 'planned_qty', 'actual_qty', 'planned_cost', 'actual_cost', 'cost_delta', 'cost_delta_pct'];
    const fmt = (n: number) => n.toFixed(2).replace('.', ',');
    const lines = [header.join(';')];
    for (const r of report.rows) {
      lines.push([
        r.key,
        fmt(r.plannedQuantity),
        fmt(r.actualQuantity),
        fmt(r.plannedCost),
        fmt(r.actualCost),
        fmt(r.costDelta),
        fmt(r.costDeltaPct * 100) + '%',
      ].join(';'));
    }
    lines.push([
      'TOTAL',
      '',
      '',
      fmt(report.totals.plannedCost),
      fmt(report.totals.actualCost),
      fmt(report.totals.costDelta),
      fmt(report.totals.costDeltaPct * 100) + '%',
    ].join(';'));
    return lines.join('\n');
  }
}
