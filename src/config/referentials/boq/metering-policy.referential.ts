/** Default metering policy; coefficients are illustrative, not regulatory evidence. */
export interface MaterialCoefficient {
  code: string;
  labels: { fr: string; en: string; ar: string };
  unit: string;
  perUnit: number;
  rounding: 'ceil' | 'none';
}

export interface MeteringPolicy {
  code: string;
  version: string;
  absolutePriceTolerance: number;
  relativeQuantityTolerance: number;
  blockUnresolvedCorrections: boolean;
  materials: Record<string, readonly MaterialCoefficient[]>;
}

export const DEFAULT_METERING_POLICY: MeteringPolicy = {
  code: 'metering_default', version: '1.0.0',
  absolutePriceTolerance: 1,
  relativeQuantityTolerance: 0.005,
  blockUnresolvedCorrections: true,
  materials: {
    masonry_wall: [
      { code: 'brick', labels: { fr: 'Briques', en: 'Bricks', ar: 'طوب' }, unit: 'u', perUnit: 13, rounding: 'ceil' },
      // 2 cm mortar × 400 kg/m³ × 1.3 waste / 50 kg per bag.
      { code: 'cement_50kg', labels: { fr: 'Ciment 50 kg', en: 'Cement 50 kg', ar: 'أسمنت 50 كغ' }, unit: 'sac', perUnit: 0.208, rounding: 'ceil' },
    ],
  },
};