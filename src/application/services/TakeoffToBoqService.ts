/**
 * TakeoffToBoqService — orchestration service (Phase 3 chaining).
 * Transforms a project's quantity takeoffs (métré) into:
 *   1. Idempotent DQE lines in btp.boq_lines (source = 'quantity_takeoff', line_type = 'quantity_takeoff').
 *   2. Phase resources in btp.phase_materials (visible in the phase "Ressources" tab).
 *
 * Zero React, zero direct component access — pure application service consumed by hooks.
 */
import type { IQuantityTakeoffRepository } from '@/domain/repositories/IQuantityTakeoffRepository';
import type { IBoqRepository } from '@/domain/repositories/IBoqRepository';
import type { IPhaseMaterialRepository } from '@/domain/repositories/IPhaseMaterialRepository';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { QuantityTakeoffWithDetails } from '@/dtos/types/quantityTakeoff';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';

/** Marker stored in boq_lines.note to make the sync idempotent (one line per takeoff). */
const TAKEOFF_MARKER_PREFIX = 'takeoff:';

export interface TakeoffSyncResult {
  boqLinesCreated: number;
  boqLinesSkipped: number;
  resourcesUpserted: number;
  totalHt: number;
}

export class TakeoffToBoqService {
  constructor(
    private readonly takeoffRepository: IQuantityTakeoffRepository,
    private readonly boqRepo: IBoqRepository,
    private readonly phaseMaterialRepository: IPhaseMaterialRepository,
  ) {}

  /**
   * Sync all quantity takeoffs of a project into boq_lines (DQE) and phase_materials (resources).
   * Idempotent: re-running does not duplicate boq_lines nor phase_materials rows.
   */
  async syncProject(projectId: string): Promise<TakeoffSyncResult> {
    if (!projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');

    const takeoffs = await this.takeoffRepository.findByProjectId(projectId);
    if (!takeoffs.length) {
      return { boqLinesCreated: 0, boqLinesSkipped: 0, resourcesUpserted: 0, totalHt: 0 };
    }

    const existingLines = await this.boqRepo.list({ source: 'quantity_takeoff', projectId });
    const alreadySynced = new Set(
      existingLines
        .map((l) => this.extractTakeoffMarker(l.note))
        .filter((id): id is string => Boolean(id)),
    );

    const toCreate: BoqLineDTO[] = [];
    let skipped = 0;

    for (const takeoff of takeoffs) {
      if (!takeoff.id || alreadySynced.has(takeoff.id)) {
        skipped += 1;
        continue;
      }
      const unitPrice = takeoff.material?.price_per_unit ?? null;
      const quantity = Number(takeoff.quantity ?? 0);
      toCreate.push({
        source: 'quantity_takeoff',
        contextId: projectId,
        designation: takeoff.material?.name ?? takeoff.element_type ?? 'Métré',
        elementType: takeoff.element_type ?? null,
        unit: takeoff.unit,
        length: takeoff.length ?? null,
        width: takeoff.width ?? null,
        height: takeoff.height ?? null,
        quantity,
        unitPrice,
        materialId: takeoff.material_id ?? null,
        phaseId: (takeoff as { phase_id?: string | null }).phase_id ?? null,
        resourceType: 'material',
        sourceType: 'import',
        note: this.buildTakeoffMarker(takeoff.id),
        status: 'draft',
      });
    }

    if (toCreate.length) {
      await this.boqRepo.bulkCreate(toCreate);
    }

    const resourcesUpserted = await this.syncPhaseResources(projectId, takeoffs);

    const totalHt = toCreate.reduce((sum, l) => sum + (l.quantity * (l.unitPrice ?? 0)), 0)
      + existingLines.reduce((sum, l) => sum + (l.totalHt ?? 0), 0);

    return {
      boqLinesCreated: toCreate.length,
      boqLinesSkipped: skipped,
      resourcesUpserted,
      totalHt,
    };
  }

  /**
   * Aggregate takeoff quantities per (phase, material) and upsert them as phase resources
   * (btp.phase_materials) so the phase "Ressources" tab reflects the métré.
   * Idempotent: aggregated quantity replaces the existing row for the same (phase, material).
   */
  private async syncPhaseResources(
    projectId: string,
    takeoffs: QuantityTakeoffWithDetails[],
  ): Promise<number> {
    const byPhaseMaterial = new Map<string, { phaseId: string; materialId: string; quantity: number }>();

    for (const t of takeoffs) {
      const phaseId = (t as { phase_id?: string | null }).phase_id;
      const materialId = t.material_id;
      if (!phaseId || !materialId) continue; // no WBS attachment -> cannot become a phase resource
      const key = `${phaseId}::${materialId}`;
      const current = byPhaseMaterial.get(key);
      const quantity = Number(t.quantity ?? 0);
      byPhaseMaterial.set(key, {
        phaseId,
        materialId,
        quantity: (current?.quantity ?? 0) + quantity,
      });
    }

    let count = 0;
    for (const { phaseId, materialId, quantity } of byPhaseMaterial.values()) {
      await this.phaseMaterialRepository.upsert({ projectId, phaseId, materialId, quantity });
      count += 1;
    }
    return count;
  }

  private buildTakeoffMarker(takeoffId: string): string {
    return `${TAKEOFF_MARKER_PREFIX}${takeoffId}`;
  }

  private extractTakeoffMarker(note: string | null | undefined): string | null {
    if (!note || !note.startsWith(TAKEOFF_MARKER_PREFIX)) return null;
    return note.slice(TAKEOFF_MARKER_PREFIX.length);
  }
}

let instance: TakeoffToBoqService | null = null;

export function getTakeoffToBoqService(): TakeoffToBoqService {
  if (!instance) {
    instance = new TakeoffToBoqService(
      RepositoryFactory.getQuantityTakeoffRepository(),
      boqRepository,
      RepositoryFactory.getPhaseMaterialRepository(),
    );
  }
  return instance;
}
