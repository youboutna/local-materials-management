import { describe, it, expect } from 'vitest';
import { resolveLineTax, buildVatBuckets } from '../tax-regimes.referential';
import { BoqCalculatorService } from '@/application/services/boq/BoqCalculatorService';
import { getFiscalProfile } from '../default-values.referential';

const profile = getFiscalProfile('MR_STANDARD');

describe('tax regimes', () => {
  it('résout un régime différencié selon la nature du poste', () => {
    expect(resolveLineTax({ category: 'travaux' }, profile).regimeCode).toBe('TRAVAUX_BTP');
    expect(resolveLineTax({ category: 'consulting' }, profile).rasRate).toBe(0.05);
    expect(resolveLineTax({ designation: 'Transport de matériel' }, profile).vatRate).toBe(0.05);
    const exempt = resolveLineTax({ category: 'exonere bailleur' }, profile);
    expect(exempt.vatRate).toBe(0);
    expect(exempt.vatCategoryCode).toBe('E');
    expect(exempt.exemptionReason).toBeTruthy();
  });

  it('priorise un taux saisi explicitement', () => {
    expect(resolveLineTax({ category: 'travaux', vatRate: 0.2 }, profile).vatRate).toBe(0.2);
  });

  it('ventile la TVA par taux et vérifie la cohérence des totaux', () => {
    const lines = [
      { unit: 'unite', quantity: 2, unitPrice: 100, category: 'travaux' },
      { unit: 'unite', quantity: 1, unitPrice: 100, category: 'transport' },
    ];
    const buckets = BoqCalculatorService.vatBuckets(lines, profile);
    expect(buckets.map((b) => b.vatRate)).toEqual([0.16, 0.05]);
    expect(buildVatBuckets([{ totalHt: 100, vatRate: 0.16, vatCategoryCode: 'S' }])[0].taxAmount).toBeCloseTo(16);
    const agg = BoqCalculatorService.aggregate(lines, profile);
    const check = BoqCalculatorService.checkConsistency(lines, { totalHt: agg.totalHt, totalTva: agg.totalTva, totalTtc: agg.totalTtc }, profile);
    expect(check.consistent).toBe(true);
  });
});
