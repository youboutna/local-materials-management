/**
 * Formulas — moteur de métré dimensionnel piloté par le référentiel
 * `element-types` (aucune règle codée en dur ici : la formule découle des
 * dimensions déclarées significatives pour chaque type d'ouvrage).
 *
 *   • 3 dimensions actives  → Quantité = L × l × h   (m³)
 *   • 2 dimensions actives  → Quantité = L × l       (m²) — hauteur ignorée
 *   • 1 dimension active    → Quantité = L           (ml)
 *   • 0 dimension active    → Quantité = 1           (forfait / unité)
 */

import { getElementType, type ElementTypeCode } from './element-types.referential';

export interface FormulaContext {
  length?: number | null;
  width?: number | null;
  height?: number | null;
}

const val = (n: number | null | undefined): number => {
  const x = Number(n ?? 0);
  return Number.isFinite(x) && x > 0 ? x : 0;
};

/** Dimensions significatives d'un type d'ouvrage (référentiel). */
export function activeDimensions(code: ElementTypeCode): { length: boolean; width: boolean; height: boolean } {
  return getElementType(code)?.dimensions ?? { length: true, width: false, height: false };
}

/** Unité attendue (et verrouillée dans l'UI) pour un type d'ouvrage. */
export function unitForElementType(code: ElementTypeCode): string | null {
  return getElementType(code)?.defaultUnit ?? null;
}

/** Compute the primary quantity (m³/m²/m/unité) for a given element type. */
export function computeQuantityByElementType(
  code: ElementTypeCode,
  ctx: FormulaContext,
): number {
  const dims = activeDimensions(code);
  const factors: number[] = [];
  if (dims.length) factors.push(val(ctx.length));
  if (dims.width) factors.push(val(ctx.width));
  if (dims.height) factors.push(val(ctx.height));
  // Forfait / unité : aucune dimension requise.
  if (factors.length === 0) return 1;
  // Une dimension manquante ne doit pas annuler le métré : elle vaut 1.
  const product = factors.reduce((acc, f) => acc * (f || 1), 1);
  const anyProvided = factors.some((f) => f > 0);
  return anyProvided ? product : 0;
}

/** Formule lisible affichée dans l'UI (« 8 × 5 × 3.5 = 140 »). */
export function formulaLabel(code: ElementTypeCode, ctx: FormulaContext): string {
  const dims = activeDimensions(code);
  const parts: string[] = [];
  if (dims.length) parts.push(String(val(ctx.length) || 1));
  if (dims.width) parts.push(String(val(ctx.width) || 1));
  if (dims.height) parts.push(String(val(ctx.height) || 1));
  const q = computeQuantityByElementType(code, ctx);
  if (!parts.length) return `Forfait = 1`;
  return `${parts.join(' × ')} = ${Number(q.toFixed(3))}`;
}
