/**
 * AwardedTenderTransformer
 * Transforme un TenderEstimate lauréat + une config de mapping en payload projet.
 *
 * Flow hexagonal : Service → Transformer → Entities (Phase/Task/Milestone) → Repository.
 */

import type { TenderEstimateItemDTO } from '@/dtos/entities/TenderEstimateDTO';
import {
  DEFAULT_DQE_MAPPING,
  type DqeLine,
  type DqeMappingConfig,
  type MappedPhase,
  mapDqeToProjectStructure,
} from '@/config/referentials/tender/dqe-mapping.referential';

export interface AwardedProjectHydrationPayload {
  projectId: string;
  contractAmount: number;
  currency: string;
  supplierId?: string;
  supplierName?: string;
  phases: MappedPhase[];
  generatedAt: string;
  sourceEstimateId?: string;
  sourceTenderId?: string;
}

export class AwardedTenderTransformer {
  /** Convertit les lignes d'un TenderEstimate en DqeLine normalisées + métadonnées ressources. */
  static estimateItemsToDqeLines(items: TenderEstimateItemDTO[] | undefined | null): DqeLine[] {
    if (!items || items.length === 0) return [];
    return items.map((it) => {
      const cat = (it.category || '').trim();
      const spec = (it.specifications || '').trim();
      return {
        lotCode: cat || undefined,
        lotLabel: cat || undefined,
        sublotCode: spec || undefined,
        sublotLabel: spec || undefined,
        itemCode: it.item_code || it.id || 'ITEM',
        designation: it.description || '',
        unit: it.unit || 'u',
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unit_price) || 0,
        totalPrice: Number(it.total_price) || 0,
        // Métadonnées RH/Prestataires (v10) — propagées vers le payload d'hydratation.
        resourceKind: it.resource_kind,
        employeeQualificationId: it.employee_qualification_id,
        supplierId: it.supplier_id,
        supplierContractRef: it.supplier_contract_ref,
        estimatedHours: it.estimated_hours,
      } as DqeLine & Record<string, unknown>;
    });
  }

  /**
   * Construit le payload d'hydratation projet complet.
   * @param projectId projet cible
   * @param items lignes DQE du lauréat
   * @param opts contexte tender/fournisseur + override config mapping
   */
  static buildHydrationPayload(
    projectId: string,
    items: TenderEstimateItemDTO[] | null | undefined,
    opts: {
      currency?: string;
      supplierId?: string;
      supplierName?: string;
      sourceEstimateId?: string;
      sourceTenderId?: string;
      mappingConfig?: Partial<DqeMappingConfig>;
    } = {},
  ): AwardedProjectHydrationPayload {
    const cfg: DqeMappingConfig = { ...DEFAULT_DQE_MAPPING, ...(opts.mappingConfig ?? {}) };
    const lines = this.estimateItemsToDqeLines(items);
    const phases = mapDqeToProjectStructure(lines, cfg);
    const contractAmount = lines.reduce((s, l) => s + l.totalPrice, 0);

    return {
      projectId,
      contractAmount,
      currency: opts.currency ?? 'MRU',
      supplierId: opts.supplierId,
      supplierName: opts.supplierName,
      phases,
      generatedAt: new Date().toISOString(),
      sourceEstimateId: opts.sourceEstimateId,
      sourceTenderId: opts.sourceTenderId,
    };
  }
}
