/**
 * Unit conversion table — raw units extracted from PDF/Excel to internal BoqUnit.
 * Non-metric units are converted with a multiplier applied to the numeric value.
 */

import type { BoqUnit } from './units.referential';

export interface UnitMapping {
  aliases: RegExp;
  target: BoqUnit;
  /** Multiplier applied to raw numeric quantity to reach the target unit. */
  factor: number;
}

/** Order matters — more specific patterns first. */
export const UNIT_MAPPINGS: UnitMapping[] = [
  { aliases: /^\s*(m3|m\^?3|m³|mètre\s*cube|metre\s*cube)\s*$/i, target: 'm³', factor: 1 },
  { aliases: /^\s*(m2|m\^?2|m²|mètre\s*carr[eé]|metre\s*carre)\s*$/i, target: 'm²', factor: 1 },
  { aliases: /^\s*(ml|m\.?l\.?|mètre\s*lin[eé]aire|mètre|metre|m)\s*$/i, target: 'm', factor: 1 },
  { aliases: /^\s*(ft|foot|feet|pieds?)\s*$/i, target: 'm', factor: 0.3048 },
  { aliases: /^\s*(in|inch|inches|pouces?)\s*$/i, target: 'm', factor: 0.0254 },
  { aliases: /^\s*(cm)\s*$/i, target: 'm', factor: 0.01 },
  { aliases: /^\s*(mm)\s*$/i, target: 'm', factor: 0.001 },
  { aliases: /^\s*(u|un|unit[eé]s?|nb|nbre|pce|pcs|pi[eè]ces?|ea)\s*$/i, target: 'unité', factor: 1 },
];

export interface NormalizedUnit {
  unit: BoqUnit;
  factor: number;
  originalUnit: string;
}

/** Normalize an arbitrary unit string. Falls back to 'unité' when unknown. */
export function normalizeUnit(raw: string | null | undefined): NormalizedUnit {
  const s = String(raw ?? '').trim();
  if (!s) return { unit: 'unité', factor: 1, originalUnit: '' };
  const m = UNIT_MAPPINGS.find((u) => u.aliases.test(s));
  if (m) return { unit: m.target, factor: m.factor, originalUnit: s };
  return { unit: 'unité', factor: 1, originalUnit: s };
}
