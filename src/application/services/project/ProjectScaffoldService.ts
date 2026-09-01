/**
 * ProjectScaffoldService — complète un projet « vide » (créé ou importé) depuis
 * les référentiels : phases → statuts calendaires → DQE socle (réparti sur le
 * budget) → ressources planifiées → tâches d'exécution.
 *
 * Doctrine : TypeScript pur (aucun hook, aucun accès direct au client Supabase
 * autre que le port IBoqRepository), toutes les valeurs métier proviennent de
 * `src/config/referentials`.
 */
import { getPhaseService } from '@/application/services/PhaseService';
import { getProjectService } from '@/application/services/ProjectService';
import { getBoqResourcePropagationService } from '@/application/services/boq/BoqResourcePropagationService';
import { getPhaseTaskGenerationService } from '@/application/services/phase/PhaseTaskGenerationService';
import { TaxService } from '@/application/services/TaxService';
import {
  PROJECT_BASELINE_REFERENTIAL as BASELINE,
  baselineDesignation,
  resolveBaselinePhaseWeights,
} from '@/config/referentials/projects/project-baseline.referential';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { IBoqRepository } from '@/domain/repositories/IBoqRepository';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';

export interface ProjectScaffoldPlanDTO {
  projectId: string;
  budgetTotal: number;
  currency: string;
  phaseCount: number;
  phasesWithoutDates: number;
  boqLineCount: number;
  taskCount: number;
  pendingTaskLines: number;
  needsBaselineDqe: boolean;
  needsTasks: boolean;
  needsStatusSync: boolean;
}

export interface ProjectScaffoldResultDTO {
  boqLinesCreated: number;
  resourcesCreated: number;
  tasksCreated: number;
  phasesStatusUpdated: number;
  plan: ProjectScaffoldPlanDTO;
}

interface PhaseLike {
  id?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  progress?: number;
  budget?: number;
}

const DAY_MS = 86_400_000;

/** Statut attendu d'une phase d'après son calendrier et sa progression. */
export function resolvePhaseCalendarStatus(phase: PhaseLike, now = new Date()): string | null {
  const progress = Number(phase.progress ?? 0);
  if (progress >= BASELINE.statusRules.autoCompleteProgress) return 'completed';

  const start = phase.startDate ? new Date(phase.startDate) : null;
  const end = phase.endDate ? new Date(phase.endDate) : null;
  if (!start || Number.isNaN(start.getTime())) return null;

  const tolerance = BASELINE.statusRules.startToleranceDays * DAY_MS;
  if (now.getTime() + tolerance < start.getTime()) return 'pending';
  if (end && !Number.isNaN(end.getTime()) && now.getTime() > end.getTime()) return 'delayed';
  return 'in_progress';
}

export class ProjectScaffoldService {
  constructor(private readonly boq: IBoqRepository) {}

  private async listDqeLines(projectId: string): Promise<BoqLineDTO[]> {
    try {
      return await this.boq.list({ source: 'dqe', contextId: projectId, projectId });
    } catch {
      return [];
    }
  }

  private async loadPhases(projectId: string): Promise<PhaseLike[]> {
    try {
      const phases = await getPhaseService().getPhasesByProject(projectId);
      return (phases ?? []) as unknown as PhaseLike[];
    } catch {
      return [];
    }
  }

  /** Diagnostic : ce qui manque au projet pour être opérationnel. */
  async getPlan(projectId: string): Promise<ProjectScaffoldPlanDTO> {
    const empty: ProjectScaffoldPlanDTO = {
      projectId,
      budgetTotal: 0,
      currency: 'MRU',
      phaseCount: 0,
      phasesWithoutDates: 0,
      boqLineCount: 0,
      taskCount: 0,
      pendingTaskLines: 0,
      needsBaselineDqe: false,
      needsTasks: false,
      needsStatusSync: false,
    };
    if (!projectId) return empty;

    const [project, phases, lines] = await Promise.all([
      getProjectService().getProjectById(projectId).catch(() => null),
      this.loadPhases(projectId),
      this.listDqeLines(projectId),
    ]);

    const budgetTotal = Number((project as { budget?: number } | null)?.budget ?? 0) || 0;
    const taskPlans = await Promise.all(
      phases
        .filter((p) => !!p.id)
        .map((p) => getPhaseTaskGenerationService().getPlan(projectId, p.id!).catch(() => null)),
    );

    const pendingTaskLines = taskPlans.reduce((sum, p) => sum + (p?.pendingLines ?? 0), 0);
    const taskCount = taskPlans.reduce((sum, p) => sum + (p?.linkedLines ?? 0), 0);
    const needsStatusSync = phases.some(
      (p) => !!p.id && !!resolvePhaseCalendarStatus(p) && resolvePhaseCalendarStatus(p) !== p.status,
    );

    return {
      projectId,
      budgetTotal,
      currency: (project as { currency?: string } | null)?.currency ?? 'MRU',
      phaseCount: phases.length,
      phasesWithoutDates: phases.filter((p) => !p.startDate || !p.endDate).length,
      boqLineCount: lines.length,
      taskCount,
      pendingTaskLines,
      needsBaselineDqe: lines.length === 0 && budgetTotal > 0 && phases.length > 0,
      needsTasks: pendingTaskLines > 0,
      needsStatusSync,
    };
  }

  /** Construit les lignes DQE socle réparties sur les phases selon le budget. */
  private buildBaselineLines(
    projectId: string,
    phases: PhaseLike[],
    budgetTotal: number,
    documentId: string,
  ): BoqLineDTO[] {
    const declared = phases.map((p) => Number(p.budget ?? 0) || 0);
    const declaredTotal = declared.reduce((s, v) => s + v, 0);
    const weights = resolveBaselinePhaseWeights(phases.length);

    const lines: BoqLineDTO[] = [];
    phases.forEach((phase, index) => {
      if (!phase.id) return;
      const phaseBudget =
        declaredTotal > 0 ? declared[index] : budgetTotal * (weights[index] ?? 1 / phases.length);
      if (phaseBudget <= 0) return;

      for (const template of BASELINE.lineTemplates) {
        const amount = Math.round(phaseBudget * template.share * 100) / 100;
        if (amount <= 0) continue;
        const base: BoqLineDTO = {
          source: 'dqe',
          contextId: projectId,
          projectId,
          documentId,
          phaseId: phase.id,
          designation: `${baselineDesignation(template)} — ${phase.name ?? `Phase ${index + 1}`}`,
          code: `${template.code}-${index + 1}`,
          category: template.category,
          unit: template.unit,
          quantity: 1,
          unitPrice: amount,
          totalHt: amount,
          resourceType: template.family,
          dqeType: BASELINE.dqeType,
          status: BASELINE.lineStatus,
          sourceType: 'rapide',
          metadata: {
            baseline: BASELINE.code,
            phaseName: phase.name ?? null,
            generatedFrom: 'project-baseline-referential',
          },
        } as BoqLineDTO;

        const tax = TaxService.resolve(base);
        lines.push({
          ...base,
          vatRate: tax.vatRate,
          rasRate: tax.rasRate,
          taxRegimeCode: base.taxRegimeCode ?? tax.regimeCode,
          accountCode: base.accountCode ?? tax.accountCode,
          totalHt: tax.totalHt,
        });
      }
    });
    return lines;
  }

  /**
   * Complète le projet : statuts de phases, DQE socle, ressources, tâches.
   * Idempotent : rien n'est régénéré si les données existent déjà.
   */
  async scaffold(projectId: string): Promise<ProjectScaffoldResultDTO> {
    const plan = await this.getPlan(projectId);
    const result: ProjectScaffoldResultDTO = {
      boqLinesCreated: 0,
      resourcesCreated: 0,
      tasksCreated: 0,
      phasesStatusUpdated: 0,
      plan,
    };
    if (!projectId || plan.phaseCount === 0) return result;

    const phases = await this.loadPhases(projectId);

    // 1. Statuts des phases alignés sur le calendrier réel.
    for (const phase of phases) {
      if (!phase.id) continue;
      const target = resolvePhaseCalendarStatus(phase);
      if (!target || target === phase.status) continue;
      try {
        await getPhaseService().updatePhase(phase.id, { status: target } as never);
        result.phasesStatusUpdated += 1;
      } catch {
        /* une phase verrouillée ne bloque pas le reste du socle */
      }
    }

    // 2. DQE socle depuis le budget si aucune ligne n'existe.
    if (plan.needsBaselineDqe) {
      const documentId = crypto.randomUUID();
      const lines = this.buildBaselineLines(projectId, phases, plan.budgetTotal, documentId);
      if (lines.length) {
        const created = await this.boq.bulkCreate(lines);
        result.boqLinesCreated = created.length;
        try {
          const propagation = await getBoqResourcePropagationService().propagateLines(projectId, created);
          result.resourcesCreated =
            (propagation.phaseMaterials ?? 0) +
            (propagation.phaseEmployees ?? 0) +
            (propagation.projectResources ?? 0);
        } catch {
          /* la propagation peut être rejouée depuis l'onglet Ressources */
        }
      }
    }

    // 3. Tâches d'exécution pour chaque phase alimentée.
    for (const phase of phases) {
      if (!phase.id) continue;
      try {
        const generated = await getPhaseTaskGenerationService().generate(projectId, phase.id);
        result.tasksCreated += generated.created;
      } catch {
        /* phase sans ligne rattachée : rien à générer */
      }
    }

    result.plan = await this.getPlan(projectId);
    return result;
  }
}

let instance: ProjectScaffoldService | null = null;
export function getProjectScaffoldService(): ProjectScaffoldService {
  if (!instance) instance = new ProjectScaffoldService(boqRepository);
  return instance;
}
