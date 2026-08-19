/**
 * BoqDispatchService — transfert explicite des lignes DQE vers le WBS.
 *
 * Étape distincte de l'import : l'import ne persiste que `btp.boq_lines`.
 * Ce service est déclenché par le chef de projet via l'UI :
 *   • « Transférer vers les phases » -> dispatchToWbs()
 *   • « Demander validation »        -> requestValidation()
 *
 * Mapping Lot → Phase / Jalon / Tâche piloté par DQE_DISPATCH_REFERENTIAL.
 * Service pur (aucun React), accès base via les ports du domaine.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import {
  DQE_DISPATCH_REFERENTIAL,
  applyDispatchTemplate,
  resolveDqeEffort,
  resolveDqeLot,
} from '@/config/referentials/dqe/dqe-dispatch.referential';
import type { IPhaseRepository } from '@/domain/repositories/IPhaseRepository';
import type { IMilestoneRepository } from '@/domain/repositories/IMilestoneRepository';
import type { ITaskAssignmentRepository } from '@/domain/repositories/ITaskAssignmentRepository';
import type { IAlertRepository } from '@/domain/repositories/IAlertRepository';
import type { Alert } from '@/domain/entities/Alert';
import { TaskAssignment } from '@/domain/entities/TaskAssignment';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { getBoqResourcePropagationService } from './BoqResourcePropagationService';
import { BoqInjectionGateService } from './BoqInjectionGateService';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface DispatchResult {
  linesConsidered: number;
  phasesCreated: number;
  phasesReused: number;
  milestonesCreated: number;
  tasksCreated: number;
  phaseMaterials: number;
  phaseEmployees: number;
  projectResources: number;
  lots: string[];
}

export interface ValidationRequestResult {
  alertId: string | null;
  discrepancy: number;
  ratio: number;
  options: typeof DQE_DISPATCH_REFERENTIAL.validationOptions;
}

interface LotGroup {
  lot: string;
  lines: BoqLineDTO[];
}

export class BoqDispatchService {
  constructor(
    private readonly phases: IPhaseRepository,
    private readonly milestones: IMilestoneRepository,
    private readonly tasks: ITaskAssignmentRepository,
    private readonly alerts: IAlertRepository,
  ) {}

  /** Lignes éligibles au transfert selon le référentiel. */
  static transferable(lines: BoqLineDTO[]): BoqLineDTO[] {
    const allowed = new Set(DQE_DISPATCH_REFERENTIAL.transferableStatuses);
    return lines.filter((line) => allowed.has(String(line.status ?? 'draft')));
  }

  private static groupByLot(lines: BoqLineDTO[]): LotGroup[] {
    const map = new Map<string, BoqLineDTO[]>();
    for (const line of lines) {
      const metaLot = (line.metadata as { lot?: string } | null | undefined)?.lot;
      const lot = resolveDqeLot([metaLot, line.code, line.category, line.btpCode, line.designation]);
      const bucket = map.get(lot) ?? [];
      bucket.push(line);
      map.set(lot, bucket);
    }
    return [...map.entries()].map(([lot, lotLines]) => ({ lot, lines: lotLines }));
  }

  private static sum(lines: BoqLineDTO[]): number {
    return lines.reduce(
      (acc, l) => acc + Number(l.totalHt ?? (Number(l.quantity) || 0) * Number(l.unitPrice ?? 0)),
      0,
    );
  }

  /**
   * Transfère les lignes DQE vers phases / jalons / tâches / ressources.
   */
  async dispatchToWbs(projectId: string, lines: BoqLineDTO[]): Promise<DispatchResult> {
    if (!projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');
    const eligible = BoqDispatchService.transferable(lines);
    if (!eligible.length) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Aucune ligne transférable : enregistrez puis soumettez les lignes DQE avant le transfert.',
      );
    }

    // Porte de gouvernance : devis validés par le gestionnaire de projet,
    // décomptes validés par le consultant, avant toute injection WBS.
    BoqInjectionGateService.assertInjectable(eligible);

    const rule = DQE_DISPATCH_REFERENTIAL.rule;
    const groups = BoqDispatchService.groupByLot(eligible);
    const existing = await this.phases.findByProjectId(projectId).catch(() => []);

    let phasesCreated = 0;
    let phasesReused = 0;
    let milestonesCreated = 0;
    let tasksCreated = 0;
    const propagationLines: BoqLineDTO[] = [];

    for (const [index, group] of groups.entries()) {
      const phaseCode = applyDispatchTemplate(rule.phaseCodeTemplate, group.lot);
      const phaseName = applyDispatchTemplate(rule.phaseNameTemplate, group.lot);
      const estimatedCost = BoqDispatchService.sum(group.lines);

      let phaseId: string | undefined = existing.find(
        (p) => (p as { phaseCode?: string; phaseName?: string }).phaseCode === phaseCode
          || (p as { phaseName?: string }).phaseName === phaseName,
      )?.id;

      if (phaseId) {
        phasesReused += 1;
        await this.phases.update(phaseId, { estimatedCost } as never).catch(() => undefined);
      } else {
        const created = await this.phases.create({
          projectId,
          phaseName,
          phaseCode,
          phaseType: rule.phaseType,
          status: 'pending',
          progress: 0,
          orderIndex: (existing.length || 0) + index + 1,
          estimatedCost,
          weight: rule.milestoneWeight,
        } as never);
        phaseId = created?.id;
        phasesCreated += 1;
      }

      if (!phaseId) continue;

      // Jalon de fin de lot
      const phaseMilestones = await this.milestones.findByPhaseId(phaseId).catch(() => []);
      const milestoneTitle = applyDispatchTemplate(rule.milestoneTitleTemplate, group.lot);
      const milestoneTargetDate = (phaseMilestones.find((m) => m.title === milestoneTitle) as
        | { targetDate?: string | null; target_date?: string | null }
        | undefined)?.targetDate
        ?? (phaseMilestones.find((m) => m.title === milestoneTitle) as
          | { target_date?: string | null }
          | undefined)?.target_date
        ?? null;
      if (!phaseMilestones.some((m) => m.title === milestoneTitle)) {
        const created = await this.milestones
          .create({
            project_id: projectId,
            phase_id: phaseId,
            title: milestoneTitle,
            description: `Jalon généré depuis le DQE (${group.lines.length} poste(s))`,
            target_date: new Date().toISOString(),
            status: 'pending',
            weight: rule.milestoneWeight,
          })
          .catch(() => null);
        if (created) milestonesCreated += 1;
      }

      // Dates héritées : phase > jalon > projet (fallback pour le calcul de délai)
      const phaseRecord = (existing.find((p) => p.id === phaseId) ?? null) as
        | { startDate?: string | null; endDate?: string | null }
        | null;
      const inheritedStart = phaseRecord?.startDate ?? null;
      const inheritedEnd = phaseRecord?.endDate ?? milestoneTargetDate ?? null;

      // Tâches = postes DQE (quantité / unité / délai / taux journalier reportés)
      const existingTasks = await this.tasks.findByPhaseId(phaseId).catch(() => []);
      const existingByTitle = new Map(existingTasks.map((t) => [t.title, t]));
      for (const line of group.lines) {
        propagationLines.push({ ...line, phaseId });
        const meta = (line.metadata ?? {}) as { durationDays?: number; crewSize?: number };
        const effort = resolveDqeEffort({
          quantity: line.quantity,
          unit: line.unit,
          unitPrice: line.unitPrice,
          totalHt: line.totalHt,
          durationDays: meta.durationDays ?? null,
          crewSize: meta.crewSize ?? null,
          inheritedStart,
          inheritedEnd,
        });

        const taskProps = {
          title: line.designation,
          description: `${effort.quantity} ${effort.unit ?? ''} — ${line.code ?? group.lot}`.trim(),
          projectId,
          phaseId,
          status: rule.taskStatus,
          priority: rule.taskPriority,
          progress: 0,
          quantity: effort.quantity,
          unit: effort.unit ?? undefined,
          dailyRate: effort.dailyRate ?? undefined,
          estimatedCost: effort.estimatedCost,
          estimatedDuration: effort.durationDays || undefined,
          startDate: effort.startDate ? new Date(effort.startDate) : undefined,
          endDate: effort.endDate ? new Date(effort.endDate) : undefined,
          dueDate: effort.endDate ? new Date(effort.endDate) : undefined,
          notes: `DQE ${line.code ?? group.lot}`,
          metadata: {
            source: 'dqe_dispatch',
            boqLineId: line.id,
            lot: group.lot,
            effortKind: effort.kind,
            isLabor: effort.isLabor,
            manDays: effort.manDays,
            durationSource: effort.durationSource,
          },
        };

        const existingTask = existingByTitle.get(line.designation);
        if (existingTask) {
          // CRUD : mise à jour des données DQE sur la tâche déjà générée
          await this.tasks
            .update(
              existingTask.id,
              TaskAssignment.create({ ...taskProps, id: existingTask.id, createdAt: existingTask.createdAt }),
            )
            .catch(() => undefined);
          continue;
        }

        const task = TaskAssignment.create({ id: crypto.randomUUID(), ...taskProps });
        const saved = await this.tasks.save(task).catch(() => null);
        if (saved) tasksCreated += 1;
      }
    }

    const propagation = await getBoqResourcePropagationService().propagateLines(projectId, propagationLines);

    return {
      linesConsidered: eligible.length,
      phasesCreated,
      phasesReused,
      milestonesCreated,
      tasksCreated,
      phaseMaterials: propagation.phaseMaterials,
      phaseEmployees: propagation.phaseEmployees,
      projectResources: propagation.projectResources,
      lots: groups.map((g) => g.lot),
    };
  }

  /**
   * Crée le workflow de validation : alerte budgétaire + options A/B/C.
   */
  async requestValidation(
    projectId: string,
    lines: BoqLineDTO[],
    remainingBudget?: number | null,
  ): Promise<ValidationRequestResult> {
    if (!projectId) throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID is required');

    const total = BoqDispatchService.sum(lines);
    const budget = Number(remainingBudget ?? 0);
    const discrepancy = budget > 0 ? total - budget : 0;
    const ratio = budget > 0 ? Math.abs(discrepancy) / budget : 0;
    const options = DQE_DISPATCH_REFERENTIAL.validationOptions;

    if (ratio <= DQE_DISPATCH_REFERENTIAL.budgetDiscrepancyThreshold) {
      return { alertId: null, discrepancy, ratio, options };
    }

    const now = new Date().toISOString();
    const alert = {
      id: crypto.randomUUID(),
      type: 'budget',
      severity: DQE_DISPATCH_REFERENTIAL.budgetAlertSeverity,
      title: 'Écart budgétaire DQE à arbitrer',
      message: `Total DQE ${total.toFixed(2)} MRU vs budget restant ${budget.toFixed(2)} MRU — écart ${discrepancy.toFixed(2)} MRU (${(ratio * 100).toFixed(2)} %).`,
      projectId,
      source: 'budget',
      timestamp: now,
      triggerDate: now,
      acknowledged: false,
      actionRequired: true,
      status: 'open',
      metadata: { options, total, remainingBudget: budget, discrepancy, ratio },
    } as unknown as Alert;

    const created = await this.alerts.create(alert).catch(() => null);
    return { alertId: created?.id ?? null, discrepancy, ratio, options };
  }
}

let instance: BoqDispatchService | null = null;

export function getBoqDispatchService(): BoqDispatchService {
  if (!instance) {
    instance = new BoqDispatchService(
      RepositoryFactory.getPhaseRepository(),
      RepositoryFactory.getMilestoneRepository(),
      RepositoryFactory.getTaskAssignmentRepository(),
      RepositoryFactory.getAlertRepository(),
    );
  }
  return instance;
}
