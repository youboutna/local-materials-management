/**
 * Validation constraints for BOQ lines — used by the UI (inline edit) and by
 * BoqValidatorService before persistence.
 */

export const BOQ_VALIDATION = {
  quantity: { min: 0, max: 1_000_000 },
  unitPrice: { min: 0, max: 1_000_000_000 },
  length: { min: 0, max: 10_000 },
  width: { min: 0, max: 10_000 },
  height: { min: 0, max: 10_000 },
} as const;

export function isNumericInRange(
  value: number,
  key: keyof typeof BOQ_VALIDATION,
): { ok: true } | { ok: false; message: string } {
  const rule = BOQ_VALIDATION[key];
  if (!Number.isFinite(value)) return { ok: false, message: `${key} n'est pas un nombre` };
  if (value < rule.min) return { ok: false, message: `${key} < ${rule.min}` };
  if (value > rule.max) return { ok: false, message: `${key} > ${rule.max}` };
  return { ok: true };
}
