/**
 * PhaseTaskGenerationService — transforme les lignes du bordereau (DQE / métré /
 * devis accepté) rattachées à une phase en tâches d'exécution.
 *
 * Doctrine : une phase alimentée par la chaîne documentaire ne peut pas rester
 * sans tâches. Chaque ligne de bordereau devient une tâche traçable
 * (`metadata.boqLineId`), idempotente : une ligne déjà transformée n'est jamais
 * dupliquée.
 *
 * TypeScript pur : aucun hook, aucun accès direct au client Supabase.
 */
import { getPhaseResourceLinkService } from '@/application/services/boq/PhaseResourceLinkService';
import { getTaskAssignmentService } from '@/application/services/TaskAssignmentService';
import type { PhaseResourceLineDTO } from '@/dtos/entities/PhasePlannedResourcesDTO';
import {
  TaskPriority,
  TaskStatus,
  TaskType,
  type TaskAssignmentDTO,
} from '@/dtos/entities/TaskAssignmentDTO';

export interface PhaseTaskGenerationPlanDTO {
  projectId: string;
  phaseId: string;
  /** Lignes de bordereau rattachées à la phase. */
  totalLines: number;
  /** Lignes déjà converties en tâche. */
  linkedLines: number;
  /** Lignes en attente de conversion. */
  pendingLines: number;
  linkedToBoq: boolean;
}

export interface PhaseTaskGenerationResultDTO {
  created: number;
  skipped: number;
  plan: PhaseTaskGenerationPlanDTO;
}

const TASK_TYPE_BY_FAMILY: Record<PhaseResourceLineDTO['family'], TaskType> = {
  material: TaskType.MATERIAL,
  equipment: TaskType.EXECUTION,
  labor: TaskType.EXECUTION,
};

/** Identifiant de la ligne source portée par une tâche déjà générée. */
const sourceLineId = (task: TaskAssignmentDTO): string | null => {
  const meta = (task.metadata ?? {}) as Record<string, unknown>;
  const id = meta.boqLineId ?? meta.sourceLineId;
  return typeof id === 'string' && id.length > 0 ? id : null;
};

export class PhaseTaskGenerationService {
  /** Diagnostic : combien de lignes de bordereau restent à convertir en tâches. */
  async getPlan(projectId: string, phaseId: string): Promise<PhaseTaskGenerationPlanDTO> {
    const empty: PhaseTaskGenerationPlanDTO = {
      projectId,
      phaseId,
      totalLines: 0,
      linkedLines: 0,
      pendingLines: 0,
      linkedToBoq: false,
    };
    if (!projectId || !phaseId) return empty;

    const [resources, tasks] = await Promise.all([
      getPhaseResourceLinkService().getPhaseResources(projectId, phaseId),
      getTaskAssignmentService()
        .getByPhase(phaseId)
        .catch(() => [] as TaskAssignmentDTO[]),
    ]);

    const lines = this.collectLines(resources);
    const known = new Set(tasks.map(sourceLineId).filter((id): id is string => !!id));
    const linkedLines = lines.filter((l) => known.has(l.id)).length;

    return {
      projectId,
      phaseId,
      totalLines: lines.length,
      linkedLines,
      pendingLines: lines.length - linkedLines,
      linkedToBoq: resources.linkedToBoq,
    };
  }

  /** Génère (idempotent) une tâche par ligne de bordereau non encore convertie. */
  async generate(projectId: string, phaseId: string): Promise<PhaseTaskGenerationResultDTO> {
    const plan = await this.getPlan(projectId, phaseId);
    if (plan.totalLines === 0) return { created: 0, skipped: 0, plan };

    const [resources, tasks] = await Promise.all([
      getPhaseResourceLinkService().getPhaseResources(projectId, phaseId),
      getTaskAssignmentService()
        .getByPhase(phaseId)
        .catch(() => [] as TaskAssignmentDTO[]),
    ]);

    const known = new Set(tasks.map(sourceLineId).filter((id): id is string => !!id));
    const titles = new Set(tasks.map((t) => (t.title ?? '').trim().toLowerCase()));
    const service = getTaskAssignmentService();

    let created = 0;
    let skipped = 0;

    for (const line of this.collectLines(resources)) {
      const title = line.designation?.trim() || 'Ligne de bordereau';
      if (known.has(line.id) || titles.has(title.toLowerCase())) {
        skipped += 1;
        continue;
      }
      try {
        await service.create({
          title,
          description: [line.code, line.category].filter(Boolean).join(' · ') || undefined,
          projectId,
          phaseId,
          status: TaskStatus.PENDING,
          priority: line.family === 'labor' ? TaskPriority.HIGH : TaskPriority.MEDIUM,
          progress: 0,
          type: TASK_TYPE_BY_FAMILY[line.family],
          quantity: line.quantity || undefined,
          unit: line.unit || undefined,
          estimatedCost: line.totalHt || undefined,
          metadata: {
            boqLineId: line.id,
            boqOrigin: line.origin,
            boqFamily: line.family,
            materialId: line.materialId ?? null,
          },
        });
        created += 1;
        known.add(line.id);
        titles.add(title.toLowerCase());
      } catch {
        skipped += 1;
      }
    }

    return { created, skipped, plan: await this.getPlan(projectId, phaseId) };
  }

  private collectLines(resources: {
    materials: { lines: PhaseResourceLineDTO[] };
    equipment: { lines: PhaseResourceLineDTO[] };
    labor: { lines: PhaseResourceLineDTO[] };
  }): PhaseResourceLineDTO[] {
    return [...resources.materials.lines, ...resources.equipment.lines, ...resources.labor.lines];
  }
}

let instance: PhaseTaskGenerationService | null = null;

export function getPhaseTaskGenerationService(): PhaseTaskGenerationService {
  if (!instance) instance = new PhaseTaskGenerationService();
  return instance;
}
