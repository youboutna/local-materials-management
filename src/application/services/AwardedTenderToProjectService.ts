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
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';
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

    // 2. Application directe via les repositories (respecte l'ordre : phase → tasks → milestones).
    const phaseRepo = RepositoryFactory.getPhaseRepository();
    const taskRepo = RepositoryFactory.getTaskRepository();
    const milestoneRepo = RepositoryFactory.getMilestoneRepository();
    const tenderRepo = RepositoryFactory.getTenderRepository();

    const createdPhaseIds: string[] = [];
    const createdTaskIds: string[] = [];
    const createdMilestoneIds: string[] = [];

    for (const phase of payload.phases) {
      let phaseId: string | undefined;
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
        const saved: any = await phaseRepo.create(phaseData);
        phaseId = saved?.id;
        if (phaseId) createdPhaseIds.push(phaseId);
      } catch (err) {
        warnings.push(`Phase "${phase.name}" : ${(err as Error).message}`);
        continue;
      }

      // Tâches
      for (const task of phase.tasks) {
        try {
          const t: any = await (taskRepo as any).create({
            projectId: req.projectId,
            phaseId,
            name: task.name,
            orderIndex: task.order,
            estimatedDurationDays: task.durationDays,
            budgetAmount: task.amount,
            quantity: task.quantity,
            unit: task.unit,
            referenceCode: task.itemCode,
            status: 'PENDING',
          });
          if (t?.id) createdTaskIds.push(t.id);
        } catch (err) {
          warnings.push(`Tâche "${task.name}" : ${(err as Error).message}`);
        }
      }

      // Jalons
      for (const ms of phase.milestones) {
        try {
          const m: any = await (milestoneRepo as any).create({
            projectId: req.projectId,
            phaseId,
            name: ms.name,
            progressPercent: ms.progressPercent,
            targetAmount: ms.targetAmount,
            status: 'PENDING',
          });
          if (m?.id) createdMilestoneIds.push(m.id);
        } catch (err) {
          warnings.push(`Jalon "${ms.name}" : ${(err as Error).message}`);
        }
      }
    }

    // 3. Marquer le tender comme "contracted".
    try {
      await (tenderRepo as any).update?.(req.tenderId, { status: 'contracted' });
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
}

let _instance: AwardedTenderToProjectService | undefined;
export function getAwardedTenderToProjectService(): AwardedTenderToProjectService {
  if (!_instance) _instance = new AwardedTenderToProjectService();
  return _instance;
}

