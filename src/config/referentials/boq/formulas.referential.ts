/**
 * Formulas — dimensional calculation helpers per element type.
 * The heavy per-material dispatcher stays in `src/utils/btpCalculations.ts`;
 * this file only exposes the pure quantity formula (m³ / m² / m / unité).
 */

import type { ElementTypeCode } from './element-types.referential';

export interface FormulaContext {
  length?: number | null;
  width?: number | null;
  height?: number | null;
}

/** Compute the primary quantity (m³/m²/m/unité) for a given element type. */
export function computeQuantityByElementType(
  code: ElementTypeCode,
  ctx: FormulaContext,
): number {
  const l = Number(ctx.length ?? 0);
  const w = Number(ctx.width ?? 0);
  const h = Number(ctx.height ?? 0);
  switch (code) {
    case 'concrete_slab':
    case 'concrete_beam':
    case 'concrete_column':
    case 'concrete_footing':
    case 'excavation':
      return l * (w || 1) * (h || 1);
    case 'masonry_wall':
      return l * (h || 1);
    case 'plaster':
    case 'painting':
    case 'roofing':
      return l * (w || 1);
    case 'cable':
      return l;
    case 'wooden_door':
    case 'window':
      return l || 1;
    default:
      return l || 1;
  }
}
