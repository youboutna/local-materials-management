/**
 * MaterialPriceResolver — enriches BoqLineDTO[] with unit prices sourced from
 * the Material catalog. Pure service (no React), hexagonal-safe.
 *
 * Usage:
 *   const map = await MaterialPriceResolver.buildPriceMap(materialIds);
 *   const enriched = MaterialPriceResolver.applyPrices(lines, map);
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

export interface MaterialLike {
  id: string;
  pricePerUnit?: number | null;
  unit_price?: number | null;
}

export class MaterialPriceResolver {
  /** Build id → unit price map from a materials list already in memory. */
  static buildPriceMap(materials: MaterialLike[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const m of materials) {
      const p = (m.pricePerUnit ?? m.unit_price ?? 0) as number;
      if (Number.isFinite(p) && p > 0) map.set(m.id, p);
    }
    return map;
  }

  /**
   * Fill `unitPrice` and `totalHt` on lines that carry a `materialId` but no
   * price yet. Lines already priced (explicit unitPrice) are preserved.
   */
  static applyPrices(lines: BoqLineDTO[], priceMap: Map<string, number>): BoqLineDTO[] {
    return lines.map((l) => {
      if (l.unitPrice != null && l.unitPrice > 0) return l;
      if (!l.materialId) return l;
      const pu = priceMap.get(l.materialId);
      if (pu == null) return l;
      return { ...l, unitPrice: pu, totalHt: (l.quantity ?? 0) * pu };
    });
  }
}
