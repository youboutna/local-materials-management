/**
 * ResourceService — centralise le lookup PU / TVA / unité par ressource
 * (matériau, main d'œuvre, équipement) pour DQE, Tender et Portail.
 *
 * Fine surface au-dessus de MaterialPriceResolver : ajoute la notion de
 * `override_reason` (dérogation ligne par ligne) et un ResourceLookup uniforme.
 *
 * Pure TS — pas de React, pas de Supabase.
 */
import type { BoqResourceType } from '@/domain/entities/boq/BoqLine';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { MaterialPriceResolver, type MaterialLike } from './MaterialPriceResolver';

export interface ResourceRecord {
  id: string;
  type: BoqResourceType;
  name: string;
  unit?: string;
  unitPrice?: number | null;
  vatRate?: number | null;
}

export interface PricedLine extends BoqLineDTO {
  overrideReason?: string;
}

export class ResourceService {
  private byId = new Map<string, ResourceRecord>();

  constructor(resources: ResourceRecord[] = []) {
    for (const r of resources) this.byId.set(r.id, r);
  }

  static fromMaterials(mats: (MaterialLike & { name?: string; unit?: string; vatRate?: number | null })[]): ResourceService {
    return new ResourceService(
      mats.map((m) => ({
        id: m.id,
        type: 'material' as const,
        name: m.name ?? m.id,
        unit: m.unit,
        unitPrice: (m.pricePerUnit ?? m.unit_price ?? null) as number | null,
        vatRate: m.vatRate ?? null,
      })),
    );
  }

  get(id: string | null | undefined): ResourceRecord | undefined {
    return id ? this.byId.get(id) : undefined;
  }

  /** Enrich lines with PU/TVA from catalog; explicit unitPrice = override. */
  applyPricing(lines: BoqLineDTO[]): PricedLine[] {
    return lines.map((l) => {
      const res = this.get(l.materialId ?? null);
      const hasOverride = l.unitPrice != null && l.unitPrice > 0
        && res?.unitPrice != null && res.unitPrice > 0
        && Math.abs((l.unitPrice ?? 0) - (res.unitPrice ?? 0)) > 0.0001;
      if (!res) return l;
      const unitPrice = l.unitPrice ?? res.unitPrice ?? null;
      const vatRate = l.vatRate ?? res.vatRate ?? null;
      const out: PricedLine = { ...l, unitPrice, vatRate };
      if (hasOverride) out.overrideReason = 'manual_override';
      return out;
    });
  }

  /** Delegate to legacy resolver for BC. */
  static applyMaterialPrices(lines: BoqLineDTO[], map: Map<string, number>) {
    return MaterialPriceResolver.applyPrices(lines, map);
  }
}

let resourceServiceInstance: ResourceService | null = null;
export function getResourceService(): ResourceService {
  if (!resourceServiceInstance) {
    resourceServiceInstance = new ResourceService();
  }
  return resourceServiceInstance;
}
