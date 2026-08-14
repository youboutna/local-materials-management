/**
 * BoqResourcePropagationService
 * Traduit les lignes DQE validées en ressources PLANIFIÉES :
 *   • famille matériau  -> btp.phase_materials (si material_id connu) sinon btp.project_resources
 *   • famille main d'œuvre -> btp.phase_employees
 *   • autres familles (équipement, sous-traitance…) -> btp.project_resources
 *
 * Service pur (aucun React), les accès base passent par le port de propagation.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type {
  IBoqPropagationRepository,
  PhaseEmployeeAllocation,
  PhaseMaterialAllocation,
  PhaseResourceCounts,
  ProjectResourceAllocation,
} from '@/domain/repositories/IBoqPropagationRepository';
import { boqPropagationRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqPropagationAdapter';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface PropagationResult {
  linesConsidered: number;
  phaseMaterials: number;
  phaseEmployees: number;
  projectResources: number;
  skippedWithoutPhase: number;
}

const LABOUR_TYPES = new Set(['labour', 'labor', 'main_doeuvre', 'human', 'employee', 'workforce']);
const MATERIAL_TYPES = new Set(['material', 'materiau', 'materiaux', 'supply']);

function family(line: BoqLineDTO): 'labour' | 'material' | 'other' {
  const raw = String(line.resourceType ?? '').toLowerCase();
  if (LABOUR_TYPES.has(raw)) return 'labour';
  if (MATERIAL_TYPES.has(raw) || line.materialId) return 'material';
  return 'other';
}

export class BoqResourcePropagationService {
  constructor(private readonly repository: IBoqPropagationRepository) {}

  /** Propage les lignes validées d'un projet (optionnellement un seul document). */
  async propagateValidatedBoq(projectId: string, documentId?: string): Promise<PropagationResult> {
    if (!projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');

    const lines = await boqRepository.list({ source: 'dqe', contextId: projectId, projectId, documentId });
    const validated = lines.filter((line) => line.status === 'validated' || line.status === 'signed');

    return this.propagateLines(projectId, validated);
  }

  /** Propage une sélection de lignes déjà en mémoire (mêmes règles métier). */
  async propagateLines(projectId: string, lines: BoqLineDTO[]): Promise<PropagationResult> {
    const materials: PhaseMaterialAllocation[] = [];
    const employees: PhaseEmployeeAllocation[] = [];
    const resources: ProjectResourceAllocation[] = [];
    let skippedWithoutPhase = 0;

    for (const line of lines) {
      const quantity = Number(line.quantity) || 0;
      if (quantity <= 0) continue;
      const kind = family(line);
      const phaseId = line.phaseId ?? null;

      if (kind === 'material' && line.materialId && phaseId) {
        materials.push({ phaseId, projectId, materialId: line.materialId, quantity });
        continue;
      }

      if (kind === 'labour' && phaseId) {
        employees.push({
          phaseId,
          employeeName: line.designation,
          employeeRole: line.category ?? line.elementType ?? 'Main d\'œuvre',
          dailyRate: line.unitPrice ?? null,
        });
        continue;
      }

      if (!phaseId) skippedWithoutPhase += 1;

      resources.push({
        projectId,
        type: kind === 'labour' ? 'human' : kind === 'material' ? 'material' : 'equipment',
        name: line.designation,
        quantity,
        unit: line.unit,
        costPerUnit: line.unitPrice ?? null,
        totalCost: line.totalHt ?? (line.unitPrice ? quantity * Number(line.unitPrice) : null),
        notes: line.code ? `DQE ${line.code}` : null,
      });
    }

    const [phaseMaterials, phaseEmployees, projectResources] = await Promise.all([
      this.repository.upsertPhaseMaterials(materials),
      this.repository.upsertPhaseEmployees(employees),
      this.repository.upsertProjectResources(resources),
    ]);

    return {
      linesConsidered: lines.length,
      phaseMaterials,
      phaseEmployees,
      projectResources,
      skippedWithoutPhase,
    };
  }

  /** Compteurs réels par phase : matériaux, rôles et métrés (analyse métré séparée). */
  async getPhaseResourceCounts(projectId: string): Promise<PhaseResourceCounts[]> {
    if (!projectId) return [];
    return this.repository.countPhaseResources(projectId);
  }
}

let instance: BoqResourcePropagationService | null = null;

export function getBoqResourcePropagationService(): BoqResourcePropagationService {
  if (!instance) instance = new BoqResourcePropagationService(boqPropagationRepository);
  return instance;
}
