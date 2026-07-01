/**
 * AwardedTenderToProjectService
 * Orchestre l'hydratation d'un projet à partir du DQE du lauréat après attribution
 * et signature du contrat.
 *
 * Respecte la règle "Project Aggregate" : appels via ProjectWorkflowService,
 * jamais directement les repositories phase/task/milestone.
 *
 * Flow : Signer contrat → charger DQE → Transformer → preview → apply → workflow projet.
 */

import { TenderEstimateService } from './TenderEstimateService';
import { TenderService } from './TenderService';
import { getProjectWorkflowService } from './ProjectWorkflowService';
import { AwardedTenderTransformer, type AwardedProjectHydrationPayload } from '@/dtos/transforms/AwardedTenderTransformer';
import type { DqeMappingConfig } from '@/config/referentials/tender/dqe-mapping.referential';
import type { TenderEstimateItemDTO } from '@/dtos/entities/TenderEstimateDTO';

export interface HydrateFromWinnerRequest {
  projectId: string;
  tenderId: string;
  winningEstimateId: string;
  supplierId?: string;
  supplierName?: string;
  mappingConfig?: Partial<DqeMappingConfig>;
  /** Si true, applique directement. Sinon renvoie juste le payload preview. */
  apply?: boolean;
  /** Payload déjà édité en preview (renommages, ajustements) — court-circuite le chargement DQE. */
  overridePayload?: AwardedProjectHydrationPayload;
}

export interface HydrateFromWinnerResult {
  payload: AwardedProjectHydrationPayload;
  applied: boolean;
  createdPhaseIds?: string[];
  createdTaskIds?: string[];
  createdMilestoneIds?: string[];
  warnings: string[];
}

export class AwardedTenderToProjectService {
  private estimateService: TenderEstimateService;

  constructor() {
    this.estimateService = new TenderEstimateService();
  }

  /**
   * Chargement + mapping + (optionnel) application au projet.
   */
  async hydrateFromWinner(req: HydrateFromWinnerRequest): Promise<HydrateFromWinnerResult> {
    const warnings: string[] = [];

    // 1. Payload : soit fourni depuis le dialog preview, soit reconstruit depuis DQE.
    let payload: AwardedProjectHydrationPayload;
    if (req.overridePayload) {
      payload = req.overridePayload;
      console.debug('[AwardedTenderToProjectService] Using override payload from preview', {
        projectId: req.projectId, phases: payload.phases.length,
      });
    } else {
      const items: TenderEstimateItemDTO[] = await this.estimateService.getEstimateItems({
        estimate_id: req.winningEstimateId,
      });
      if (!items || items.length === 0) {
        warnings.push('Le DQE du lauréat est vide — aucune phase ne sera générée.');
      }
      payload = AwardedTenderTransformer.buildHydrationPayload(req.projectId, items, {
        supplierId: req.supplierId,
        supplierName: req.supplierName,
        sourceEstimateId: req.winningEstimateId,
        sourceTenderId: req.tenderId,
        mappingConfig: req.mappingConfig,
      });
      console.debug('[AwardedTenderToProjectService] Payload built from DQE', {
        projectId: req.projectId, itemsCount: items.length, phases: payload.phases.length,
        contractAmount: payload.contractAmount,
      });
    }

    if (!req.apply) {
      return { payload, applied: false, warnings };
    }

    // 2. Application via ProjectWorkflowService (respecte Project Aggregate).
    const workflow = getProjectWorkflowService();
    const createdPhaseIds: string[] = [];
    const createdTaskIds: string[] = [];
    const createdMilestoneIds: string[] = [];

    for (const phase of payload.phases) {
      try {
        const phaseData: any = {
          projectId: req.projectId,
          name: phase.name,
          description: phase.description ?? `Généré depuis DQE lauréat (${phase.amount.toFixed(0)} ${payload.currency})`,
          orderIndex: phase.order,
          status: 'PENDING',
          type: 'STRUCTURAL',
          priority: 'MEDIUM',
          progress: 0,
          budgetAmount: phase.amount,
          durationDays: phase.durationDays,
        };
        // Réutilise saveRelatedData via une saveStep-like injection minimaliste.
        const saved: any = await (workflow as any).phaseRepository?.create(phaseData);
        const phaseId = saved?.id;
        if (phaseId) createdPhaseIds.push(phaseId);

        // Tâches
        for (const task of phase.tasks) {
          try {
            const taskId = await this.createTaskSafe(workflow, {
              projectId: req.projectId,
              phaseId,
              name: task.name,
              orderIndex: task.order,
              estimatedDurationDays: task.durationDays,
              budgetAmount: task.amount,
              quantity: task.quantity,
              unit: task.unit,
              referenceCode: task.itemCode,
            });
            if (taskId) createdTaskIds.push(taskId);
          } catch (err) {
            warnings.push(`Tâche "${task.name}" : ${(err as Error).message}`);
          }
        }

        // Jalons
        for (const ms of phase.milestones) {
          try {
            const msId = await this.createMilestoneSafe(workflow, {
              projectId: req.projectId,
              phaseId,
              name: ms.name,
              progressPercent: ms.progressPercent,
              targetAmount: ms.targetAmount,
            });
            if (msId) createdMilestoneIds.push(msId);
          } catch (err) {
            warnings.push(`Jalon "${ms.name}" : ${(err as Error).message}`);
          }
        }
      } catch (err) {
        warnings.push(`Phase "${phase.name}" : ${(err as Error).message}`);
      }
    }

    // 3. Marquer le tender comme "contracted".
    try {
      await TenderService.updateTenderStatus?.(req.tenderId, 'contracted');
    } catch (err) {
      warnings.push(`Statut tender non mis à jour : ${(err as Error).message}`);
    }

    console.debug('[AwardedTenderToProjectService] Hydration applied', {
      projectId: req.projectId,
      phases: createdPhaseIds.length,
      tasks: createdTaskIds.length,
      milestones: createdMilestoneIds.length,
      warnings: warnings.length,
    });

    return { payload, applied: true, createdPhaseIds, createdTaskIds, createdMilestoneIds, warnings };
  }

  private async createTaskSafe(workflow: any, data: any): Promise<string | undefined> {
    if (workflow.taskService?.createTask) {
      const t = await workflow.taskService.createTask(data);
      return t?.id;
    }
    return undefined;
  }

  private async createMilestoneSafe(workflow: any, data: any): Promise<string | undefined> {
    if (workflow.milestoneService?.createMilestone) {
      const m = await workflow.milestoneService.createMilestone(data);
      return m?.id;
    }
    return undefined;
  }
}

let _instance: AwardedTenderToProjectService | undefined;
export function getAwardedTenderToProjectService(): AwardedTenderToProjectService {
  if (!_instance) _instance = new AwardedTenderToProjectService();
  return _instance;
}
