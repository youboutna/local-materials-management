/**
 * TenderToPlanningService — orchestrates conversion of an accepted tender
 * (winning estimate) into a planned project with cascading BOQ lines.
 *
 * Steps:
 *   1. Load winning `BoqLine[]` (source='tender_estimate') for `estimateId`.
 *   2. Reproject each line into project scope (source='quantity_takeoff', contextId=projectId).
 *   3. Bulk-persist lines against btp.quantity_takeoffs via SupabaseBoqRepository.
 *   4. Return summary (phases, milestones, lines copied).
 *
 * Consumer (UI): <AwardedTenderPreviewDialog> "Convertir en projet planifié" button.
 */

import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { BoqLineMapper } from '@/dtos/boq/BoqLineMapper';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';

export interface TenderToPlanningInput {
  estimateId: string;
  projectId: string;
}

export interface TenderToPlanningResult {
  linesCopied: number;
  distinctPhases: string[];
  distinctMilestones: string[];
  distinctMaterials: string[];
  totalHt: number;
}

export class TenderToPlanningService {
  async convert(input: TenderToPlanningInput): Promise<TenderToPlanningResult> {
    const tenderLines = await boqRepository.list({
      source: 'tender_estimate',
      estimateId: input.estimateId,
      contextId: input.estimateId,
    });

    const reprojected: BoqLineDTO[] = tenderLines.map((l) =>
      BoqLineMapper.reproject(l, input.projectId),
    );

    if (!reprojected.length) {
      return {
        linesCopied: 0, distinctPhases: [], distinctMilestones: [],
        distinctMaterials: [], totalHt: 0,
      };
    }

    await boqRepository.bulkCreate(reprojected);

    const phases = new Set<string>();
    const milestones = new Set<string>();
    const materials = new Set<string>();
    let total = 0;
    for (const l of reprojected) {
      if (l.phaseId) phases.add(l.phaseId);
      if (l.milestoneId) milestones.add(l.milestoneId);
      if (l.materialId) materials.add(l.materialId);
      total += l.totalHt ?? (l.quantity * (l.unitPrice ?? 0));
    }
    return {
      linesCopied: reprojected.length,
      distinctPhases: Array.from(phases),
      distinctMilestones: Array.from(milestones),
      distinctMaterials: Array.from(materials),
      totalHt: total,
    };
  }
}

export const tenderToPlanningService = new TenderToPlanningService();
