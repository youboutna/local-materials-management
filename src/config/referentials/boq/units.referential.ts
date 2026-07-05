/**
 * BOQ Units Referential
 * Central source of truth for unit-of-measure rules (which dimensions are required).
 * Reused by QuantityTakeoff, Tender DQE Estimator, and DQE Import.
 */

export type BoqUnit = 'm³' | 'm²' | 'm' | 'unité';

export interface BoqUnitDefinition {
  code: BoqUnit;
  label: string;
  /** Dimensions required to compute quantity (length is always required). */
  requires: {
    length: boolean;
    width: boolean;
    height: boolean;
  };
  /** Compute quantity given raw dims (missing dims default to 1 where allowed). */
  compute: (length: number, width?: number, height?: number) => number;
}

export const BOQ_UNITS: BoqUnitDefinition[] = [
  {
    code: 'm³',
    label: 'm³ (volume)',
    requires: { length: true, width: true, height: true },
    compute: (l, w, h) => l * (w ?? 0) * (h ?? 0),
  },
  {
    code: 'm²',
    label: 'm² (surface)',
    requires: { length: true, width: true, height: false },
    compute: (l, w) => l * (w ?? 0),
  },
  {
    code: 'm',
    label: 'm (linéaire)',
    requires: { length: true, width: false, height: false },
    compute: (l) => l,
  },
  {
    code: 'unité',
    label: 'unité',
    requires: { length: true, width: false, height: false },
    compute: (l) => l,
  },
];

export const BOQ_UNIT_BY_CODE: Record<BoqUnit, BoqUnitDefinition> =
  BOQ_UNITS.reduce((acc, u) => {
    acc[u.code] = u;
    return acc;
  }, {} as Record<BoqUnit, BoqUnitDefinition>);

export function isBoqUnit(value: string): value is BoqUnit {
  return value in BOQ_UNIT_BY_CODE;
}
