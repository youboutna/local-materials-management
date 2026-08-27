/**
 * LotPhaseBudgetService — calcule le montant estimé d'un lot d'appel d'offres
 * à partir des lignes DQE du projet, agrégées par phase (WBS).
 *
 * Doctrine :
 *  - Le montant estimé d'un lot n'est JAMAIS saisi manuellement quand un DQE
 *    existe : il est dérivé des lignes DQE rattachées aux phases liées au lot.
 *  - Service pur TypeScript (aucun React, aucun accès direct Supabase hors
 *    repository hexagonal).
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { IBoqRepository } from '@/domain/repositories/IBoqRepository';

export interface PhaseBudgetDTO {
  phaseId: string;
  amountHt: number;
  lineCount: number;
}

export interface ProjectLotBudgetsDTO {
  projectId: string;
  /** Montants DQE par phase (clé = phaseId). */
  byPhase: Record<string, PhaseBudgetDTO>;
  /** Lignes DQE sans phase rattachée (non imputables à un lot). */
  unassignedHt: number;
  /** Total DQE du projet. */
  totalHt: number;
  /** Vrai dès qu'au moins une ligne DQE existe : verrouille la saisie manuelle. */
  hasDqe: boolean;
}

const EMPTY: Omit<ProjectLotBudgetsDTO, 'projectId'> = {
  byPhase: {},
  unassignedHt: 0,
  totalHt: 0,
  hasDqe: false,
};

export class LotPhaseBudgetService {
  constructor(private readonly boqRepository: IBoqRepository) {}

  /** Agrège les lignes DQE d'un projet par phase. */
  async getProjectBudgets(projectId?: string | null): Promise<ProjectLotBudgetsDTO> {
    if (!projectId) return { projectId: '', ...EMPTY };

    let lines: BoqLineDTO[] = [];
    try {
      lines = await this.boqRepository.list({ source: 'dqe', projectId });
    } catch {
      return { projectId, ...EMPTY };
    }

    return { projectId, ...LotPhaseBudgetService.aggregate(lines) };
  }

  /** Agrégation pure (testable sans I/O). */
  static aggregate(lines: BoqLineDTO[]): Omit<ProjectLotBudgetsDTO, 'projectId'> {
    const byPhase: Record<string, PhaseBudgetDTO> = {};
    let unassignedHt = 0;
    let totalHt = 0;

    for (const line of lines) {
      const amount = Number(line.totalHt ?? 0) || 0;
      totalHt += amount;
      const phaseId = line.phaseId ?? null;
      if (!phaseId) {
        unassignedHt += amount;
        continue;
      }
      const current = byPhase[phaseId] ?? { phaseId, amountHt: 0, lineCount: 0 };
      current.amountHt += amount;
      current.lineCount += 1;
      byPhase[phaseId] = current;
    }

    return { byPhase, unassignedHt, totalHt, hasDqe: lines.length > 0 };
  }

  /** Montant estimé d'un lot = somme des phases liées. */
  static computeLotAmount(budgets: ProjectLotBudgetsDTO | null | undefined, phaseIds: string[]): number {
    if (!budgets) return 0;
    return phaseIds.reduce((sum, id) => sum + (budgets.byPhase[id]?.amountHt ?? 0), 0);
  }

  /** Nombre de lignes DQE couvertes par les phases liées (traçabilité UI). */
  static countLotLines(budgets: ProjectLotBudgetsDTO | null | undefined, phaseIds: string[]): number {
    if (!budgets) return 0;
    return phaseIds.reduce((sum, id) => sum + (budgets.byPhase[id]?.lineCount ?? 0), 0);
  }
}

export default LotPhaseBudgetService;
