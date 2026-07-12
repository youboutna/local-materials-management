import { describe, expect, it } from 'vitest';
import { TenderEstimatorService, type TenderEstimatorLineInput } from './TenderEstimatorService';

const sample: TenderEstimatorLineInput[] = [
  { designation: 'Béton dalle', category: 'material', unit: 'm3', quantity: 10, unitPrice: 1000, vatRate: 0.2 },
  { designation: 'Maçon', category: 'labour', unit: 'h', quantity: 20, unitPrice: 500, vatRate: 0.2 },
  { designation: 'Pelle', category: 'equipment', unit: 'j', quantity: 2, unitPrice: 2500, vatRate: 0 },
];

describe('TenderEstimatorService', () => {
  it('computes per-category totals and grand total', () => {
    const s = TenderEstimatorService.summarize(sample);
    expect(s.byCategory.material.totalHt).toBe(10_000);
    expect(s.byCategory.labour.totalHt).toBe(10_000);
    expect(s.byCategory.equipment.totalHt).toBe(5_000);
    expect(s.totals.totalHt).toBe(25_000);
    expect(s.totals.totalTva).toBeCloseTo(4_000);
    expect(s.totals.totalTtc).toBeCloseTo(29_000);
  });

  it('maps estimator lines to BoqLineDTO with source=tender_estimate', () => {
    const dtos = TenderEstimatorService.toBoqLines(sample, { tenderId: 'T1' });
    expect(dtos).toHaveLength(3);
    expect(dtos[0].source).toBe('tender_estimate');
    expect(dtos[0].contextId).toBe('T1');
    expect(dtos[1].resourceType).toBe('labour');
    expect(dtos[2].resourceType).toBe('equipment');
    expect(dtos[0].totalHt).toBe(10_000);
  });

  it('skips lines with empty designation', () => {
    const dtos = TenderEstimatorService.toBoqLines([
      { designation: '   ', category: 'material', unit: 'u', quantity: 5, unitPrice: 10 },
      ...sample,
    ], { tenderId: 'T2' });
    expect(dtos).toHaveLength(3);
  });
});
