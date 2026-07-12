import { describe, expect, it } from 'vitest';
import { VarianceService } from './VarianceService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

function line(over: Partial<BoqLineDTO>): BoqLineDTO {
  return {
    source: 'quantity_takeoff',
    contextId: 'P1',
    designation: 'x',
    unit: 'm3',
    quantity: 0,
    ...over,
  };
}

describe('VarianceService', () => {
  it('computes cost delta per phase', () => {
    const planned = [
      line({ phaseId: 'gros-oeuvre', quantity: 10, unitPrice: 1000, totalHt: 10_000 }),
      line({ phaseId: 'second-oeuvre', quantity: 5, unitPrice: 500, totalHt: 2_500 }),
    ];
    const actual = [
      line({ source: 'supplier_bid', phaseId: 'gros-oeuvre', quantity: 12, unitPrice: 1000, totalHt: 12_000 }),
      line({ source: 'supplier_bid', phaseId: 'second-oeuvre', quantity: 5, unitPrice: 400, totalHt: 2_000 }),
    ];
    const report = VarianceService.compare(planned, actual, 'phaseId');
    expect(report.totals.plannedCost).toBe(12_500);
    expect(report.totals.actualCost).toBe(14_000);
    expect(report.totals.costDelta).toBe(1_500);
    expect(report.totals.costDeltaPct).toBeCloseTo(0.12);
    const gros = report.rows.find((r) => r.key === 'gros-oeuvre');
    expect(gros?.costDelta).toBe(2_000);
    expect(gros?.quantityDelta).toBe(2);
  });

  it('bucket-groups unassigned keys and produces CSV with total row', () => {
    const planned = [line({ quantity: 4, unitPrice: 100, totalHt: 400 })];
    const actual = [line({ source: 'supplier_bid', quantity: 5, unitPrice: 100, totalHt: 500 })];
    const report = VarianceService.compare(planned, actual);
    expect(report.rows[0].key).toBe('__unassigned__');
    const csv = VarianceService.toCsv(report);
    expect(csv.split('\n').at(-1)).toContain('TOTAL');
  });
});
