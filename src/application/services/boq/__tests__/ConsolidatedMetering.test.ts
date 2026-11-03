import { describe, it, expect } from 'vitest';
import { MeterService } from '../MeterService';
import { MaterialsEstimator } from '../MaterialsEstimator';
import { BoqConsistencyService } from '../BoqConsistencyService';
import { DEFAULT_METERING_POLICY } from '@/config/referentials/boq/metering-policy.referential';
import type { MeterInputDTO } from '@/dtos/boq/MeterInputDTO';

const base: MeterInputDTO = { source: 'dqe', contextId: 'project', designation: 'Mur', unit: 'm²', quantity: 82, elementType: 'masonry_wall' };

describe('Consolidated metering policy', () => {
  it('estimates 1066 bricks for the illustrative 82 m² fixture', () => {
    expect(MaterialsEstimator.estimate('masonry_wall', 82).find((item) => item.code === 'brick')?.quantity).toBe(1066);
  });
  it('estimates 18 bags for the declared mortar coefficient', () => {
    expect(MaterialsEstimator.estimate('masonry_wall', 82).find((item) => item.code === 'cement_50kg')?.quantity).toBe(18);
  });
  it('accepts injectable material coefficients instead of an entity-specific engine', () => {
    const policy = { ...DEFAULT_METERING_POLICY, materials: { masonry_wall: [{ code: 'test', labels: { fr: 'Test', en: 'Test', ar: 'اختبار' }, unit: 'u', perUnit: 2, rounding: 'ceil' as const }] } };
    expect(MaterialsEstimator.estimate('masonry_wall', 82, policy)[0].quantity).toBe(164);
  });
  it('preserves an explicit source quantity even when geometry differs', () => {
    expect(MeterService.enrich([{ ...base, length: 4, height: 2 }])[0].quantity).toBe(82);
  });
  it('enrichment is idempotent', () => {
    const first = MeterService.enrich([base]);
    expect(MeterService.enrich(first)).toEqual(first);
  });
  it('deducts an opening once from a calculated wall', () => {
    const first = MeterService.enrich([{ ...base, quantity: 0, length: 5, height: 4, openings: [{ width: 0.9, height: 2.1 }], provenance: { format: 'calculator' } }]);
    expect(first[0].quantity).toBeCloseTo(18.11);
    expect(MeterService.enrich(first)).toEqual(first);
  });
  it.each([['2-5.1', 206, 1500, 308535, 465], ['2-9.1', 1212, 200, 242358, 42]])('detects real source discrepancy %s at one currency unit tolerance', (code, quantity, unitPrice, totalHt, delta) => {
    const issues = BoqConsistencyService.inspect([{ ...base, code, quantity, unitPrice, totalHt }]);
    expect(issues[0]?.delta).toBe(delta);
  });
  it('does not erase original price errors after automatic reconciliation', () => {
    const line = { ...base, quantity: 206, unitPrice: 308535 / 206, totalHt: 308535, metadata: { priceCorrection: { originalUnitPrice: 1500 } } };
    expect(() => BoqConsistencyService.assertReady([line])).toThrow('unresolved');
    expect(() => BoqConsistencyService.assertReady(BoqConsistencyService.review([line]))).not.toThrow();
    expect(() => BoqConsistencyService.assertReady(BoqConsistencyService.review([line]).map((item) => ({ ...item, quantity: 205 })))).toThrow('unresolved');
  });
  it('compares the illustrative 12000 and 20000 source prices', () => {
    expect(BoqConsistencyService.compare([{ ...base, code: '2-1.3', unitPrice: 12000 }], [{ ...base, code: '2-1.3', unitPrice: 20000 }])[0]?.delta).toBe(8000);
  });
  it('retains the real PDF masonry discrepancy instead of forcing a warning count', () => {
    const issues = BoqConsistencyService.inspect([{ ...base, code: '2-1.3', quantity: 821, unitPrice: 2000, totalHt: 1642500 }]);
    expect(issues[0].expected).toBe(1642000);
    expect(issues[0].delta).toBe(500);
    expect(() => BoqConsistencyService.assertReady([{ ...base, code: '2-1.3', quantity: 821, unitPrice: 2000, totalHt: 1642500 }])).toThrow('unresolved');
  });
});