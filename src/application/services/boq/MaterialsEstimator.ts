import type { MaterialEstimateDTO } from '@/dtos/boq/MeterInputDTO';
import { DEFAULT_METERING_POLICY, type MeteringPolicy } from '@/config/referentials/boq/metering-policy.referential';

/** Estimates only; never creates resource records or applies taxes. */
export class MaterialsEstimator {
  static estimate(elementType: string, quantity: number, policy: MeteringPolicy = DEFAULT_METERING_POLICY): MaterialEstimateDTO[] {
    if (!Number.isFinite(quantity) || quantity < 0) throw new Error('Invalid material basis');
    return (policy.materials[elementType] ?? []).map((coefficient) => {
      if (!Number.isFinite(coefficient.perUnit) || coefficient.perUnit < 0) throw new Error('Invalid material coefficient');
      const value = quantity * coefficient.perUnit;
      return {
        code: coefficient.code, labels: coefficient.labels, unit: coefficient.unit,
        quantity: coefficient.rounding === 'ceil' ? Math.ceil(value) : value,
      };
    });
  }
}