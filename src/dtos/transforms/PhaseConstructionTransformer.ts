/**
 * PhaseConstructionTransformer
 * ----------------------------
 * Mapping bidirectionnel pour les phases côté UI:
 *   - UI camelCase (`CreatePhaseDTO`) → contrat snake_case du hook `usePhasesHex`
 *   - Row brute (snake_case) → `PhaseSummaryDTO` (camelCase)
 */
import type {
  CreatePhaseDTO,
  PhaseSummaryDTO,
  PhaseStageSummaryDTO,
} from '@/dtos/entities/PhaseConstructionDTO';

export interface CreatePhaseHookPayload {
  phase_name: string;
  description: string;
  construction_phase?: string;
  construction_stage?: string;
  start_date?: string;
  end_date?: string;
  estimated_cost?: number;
  estimated_duration?: number;
}

interface RawPhaseRow {
  id: string;
  phase_name?: string | null;
  phaseName?: string | null;
  phase?: string | null;
  description?: string | null;
  status?: string | null;
  progress?: number | null;
  start_date?: string | null;
  startDate?: string | null;
  end_date?: string | null;
  endDate?: string | null;
  estimated_cost?: number | null;
  budget?: number | null;
  stages?: Array<{ name?: string; status?: string; order?: number }> | null;
}

export class PhaseConstructionTransformer {
  /** UI camelCase → contrat snake_case du hook/adapter. */
  static toCreatePayload(dto: CreatePhaseDTO): CreatePhaseHookPayload {
    return {
      phase_name: dto.phaseName,
      description: dto.description,
      construction_phase: dto.constructionPhase || undefined,
      construction_stage: dto.constructionStage || undefined,
      start_date: dto.startDate || undefined,
      end_date: dto.endDate || undefined,
      estimated_cost: dto.estimatedCost,
      estimated_duration: dto.estimatedDuration ?? 30,
    };
  }

  /** Row hétérogène (snake/camel) → DTO camelCase. */
  static toSummary(raw: RawPhaseRow): PhaseSummaryDTO {
    const stages: PhaseStageSummaryDTO[] = (raw.stages ?? []).map((s, idx) => ({
      name: s?.name ?? `Étape ${idx + 1}`,
      status: s?.status ?? 'planned',
      order: s?.order ?? idx + 1,
    }));
    return {
      id: raw.id,
      phaseName: raw.phase_name ?? raw.phaseName ?? raw.phase ?? '',
      description: raw.description ?? null,
      status: raw.status ?? 'planned',
      progress: Number(raw.progress ?? 0),
      startDate: raw.start_date ?? raw.startDate ?? null,
      endDate: raw.end_date ?? raw.endDate ?? null,
      budget: raw.budget ?? raw.estimated_cost ?? null,
      stages,
    };
  }
}
