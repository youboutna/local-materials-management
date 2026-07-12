import { describe, it, expect } from 'vitest';
import { MeterService } from '../MeterService';
import type { MeterInputDTO } from '@/dtos/boq/MeterInputDTO';

describe('MeterService', () => {
  it('routes basic elements through the calculator', () => {
    const dto: MeterInputDTO = {
      source: 'quantity_takeoff', contextId: 'p1', designation: 'Saisie rapide',
      elementType: 'basic_calculator', unit: 'unité', quantity: 3, unitPrice: 10, vatRate: 0.2,
    };
    const r = MeterService.compute(dto);
    expect(r.mode).toBe('basic');
    expect(r.quantity).toBe(3);
    expect(r.totals.totalHt).toBe(30);
    expect(r.totals.totalTtc).toBeCloseTo(36);
  });

  it('routes advanced elements through the advanced engine', () => {
    const dto: MeterInputDTO = {
      source: 'dqe', contextId: 'p1', designation: 'Mur',
      elementType: 'masonry_wall', unit: 'm²', length: 4, height: 2.5, unitPrice: 50,
    };
    const r = MeterService.compute(dto);
    expect(r.mode).toBe('advanced');
    expect(r.advanced?.grossQuantity).toBeGreaterThan(0);
  });

  it('normalize applies engine on batches', () => {
    const dtos: MeterInputDTO[] = [
      { source: 'dqe', contextId: 'p1', designation: 'x', elementType: 'basic_calculator', unit: 'm', quantity: 5 },
      { source: 'dqe', contextId: 'p1', designation: 'Mur', elementType: 'masonry_wall', unit: 'm²', length: 3, height: 2 },
    ];
    const out = MeterService.normalize(dtos);
    expect(out[0].quantity).toBe(5);
    expect(out[1].quantity).toBeGreaterThan(0);
  });
});
