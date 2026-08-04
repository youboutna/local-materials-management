/**
 * PhaseConstructionTransformer
 * ----------------------------
 * Mapping bidirectionnel pour les phases côté UI:
 *   - UI camelCase (`CreatePhaseDTO`) → contrat snake_case du hook `usePhasesHex`
 *   - Row brute (snake_case) → `PhaseSummaryDTO` (camelCase)
 * 
 * Intégration avec ReferentialService pour la normalisation des phase_type
 */
import { ReferentialService } from '@/application/services/ReferentialService';
import type {
  CreatePhaseDTO,
  PhaseStageSummaryDTO,
  PhaseSummaryDTO,
} from '@/dtos/entities/PhaseConstructionDTO';
import { PHASE_TYPES, PhaseTransformer, VALID_PHASE_TYPES } from '@/dtos/transforms/PhaseTransformer';

export interface CreatePhaseHookPayload {
  phase_name: string;
  description: string;
  construction_phase?: string;
  construction_stage?: string;
  start_date?: string;
  end_date?: string;
  estimated_cost?: number;
  estimated_duration?: number;
  phase_type?: string;  // ← NOUVEAU: pour la contrainte CHECK
  phase_code?: string;  // ← NOUVEAU: code métier source
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
  phase_type?: string | null;    // ← NOUVEAU: stocké en DB
  phase_code?: string | null;    // ← NOUVEAU: code métier
  custom_phase_data?: Record<string, unknown> | null;
  stages?: Array<{ name?: string; status?: string; order?: number }> | null;
}

export class PhaseConstructionTransformer {
  /**
   * UI camelCase → contrat snake_case du hook/adapter.
   * Utilise PhaseTransformer pour normaliser phase_type.
   */
  static toCreatePayload(dto: CreatePhaseDTO): CreatePhaseHookPayload {
    // Normaliser le phase_type
    const rawType = dto.phaseType ?? dto.constructionPhase ?? dto.phaseName;
    const normalizedType = PhaseTransformer.normalizeDbPhaseType(rawType);
    const phaseCode = dto.phaseCode ?? dto.constructionPhase ?? dto.phaseName;

    return {
      phase_name: dto.phaseName,
      description: dto.description,
      construction_phase: dto.constructionPhase || undefined,
      construction_stage: dto.constructionStage || undefined,
      start_date: dto.startDate || undefined,
      end_date: dto.endDate || undefined,
      estimated_cost: dto.estimatedCost,
      estimated_duration: dto.estimatedDuration ?? 30,
      // NOUVEAU: valeurs normalisées pour la DB
      phase_type: normalizedType,
      phase_code: phaseCode,
    };
  }

  /**
   * Row hétérogène (snake/camel) → DTO camelCase.
   * Lecture avec fallback sur ReferentialService.
   */
  static toSummary(raw: RawPhaseRow): PhaseSummaryDTO {
    const stages: PhaseStageSummaryDTO[] = (raw.stages ?? []).map((s, idx) => ({
      name: s?.name ?? `Étape ${idx + 1}`,
      status: s?.status ?? 'planned',
      order: s?.order ?? idx + 1,
    }));

    // Récupérer le phase_type normalisé
    let phaseType = raw.phase_type ?? 'standard';
    
    // Vérifier si la valeur est valide
    if (!VALID_PHASE_TYPES.includes(phaseType as any)) {
      // Essayer de normaliser via ReferentialService
      try {
        const referentialService = ReferentialService.getInstance();
        const referentials = referentialService.getAllReferentials();
        
        // Chercher le code dans les référentiels
        const found = referentials.some(ref => 
          ref.phases.some(p => {
            const code = typeof p === 'string' ? p : p.code;
            return code && code.toLowerCase() === phaseType?.toLowerCase();
          })
        );
        
        if (found) {
          phaseType = phaseType?.toLowerCase() ?? 'standard';
        } else {
          // Fallback via PhaseTransformer
          phaseType = PhaseTransformer.normalizeDbPhaseType(phaseType);
        }
      } catch (error) {
        // Fallback
        phaseType = PhaseTransformer.normalizeDbPhaseType(phaseType);
      }
    }

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
      // NOUVEAU: informations de phase
      phaseType: phaseType,
      phaseCode: raw.phase_code ?? raw.phase_name ?? raw.phase ?? undefined,
      customPhaseData: raw.custom_phase_data ?? undefined,
    };
  }

  /**
   * Valider un phase_type avant insertion
   */
  static validatePhaseType(phaseType: string): boolean {
    const normalized = phaseType.toLowerCase().trim();
    
    // Vérifier dans les valeurs autorisées
    if (VALID_PHASE_TYPES.includes(normalized as any)) {
      return true;
    }
    
    // Vérifier via ReferentialService
    try {
      const referentialService = ReferentialService.getInstance();
      const referentials = referentialService.getAllReferentials();
      
      for (const ref of referentials) {
        for (const phase of ref.phases) {
          const code = typeof phase === 'string' ? phase : phase.code;
          if (code && code.toLowerCase() === normalized) {
            return true;
          }
        }
      }
    } catch (error) {
      // Silencieux
    }
    
    return false;
  }

  /**
   * Récupérer la liste complète des phase_type valides
   */
  static getValidPhaseTypes(): string[] {
    const types = [...VALID_PHASE_TYPES];
    
    try {
      const referentialService = ReferentialService.getInstance();
      const referentials = referentialService.getAllReferentials();
      
      for (const ref of referentials) {
        for (const phase of ref.phases) {
          const code = typeof phase === 'string' ? phase : phase.code;
          if (code && !types.includes(code.toLowerCase())) {
            types.push(code.toLowerCase());
          }
        }
      }
    } catch (error) {
      // Silencieux
    }
    
    return types;
  }

  /**
   * Normalisation centralisée (délègue à PhaseTransformer)
   */
  static normalizePhaseType(raw?: string | null): string {
    return PhaseTransformer.normalizeDbPhaseType(raw);
  }
}

// Exporter les constantes pour usage externe
export { PHASE_TYPES, VALID_PHASE_TYPES };
