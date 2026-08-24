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

import type { DqeMappingConfig } from '@/config/referentials/tender/dqe-mapping.referential';
import type { TenderEstimateItemDTO } from '@/dtos/entities/TenderEstimateDTO';
import { AwardedTenderTransformer, type AwardedProjectHydrationPayload } from '@/dtos/transforms/AwardedTenderTransformer';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { getContractService } from './ContractService';
import { TenderEstimateService } from './TenderEstimateService';

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
  /** Contrat d'attribution persisté (btp.contracts). */
  contractId?: string;
  contractNumber?: string;
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
    // Charger les items bruts systématiquement lorsque nécessaire pour le plan de charge.
    let rawItems: TenderEstimateItemDTO[] = [];
    if (req.overridePayload) {
      payload = req.overridePayload;
      // Reload items pour l'étape plan de charge, sans bloquer si indisponibles.
      if (req.winningEstimateId) {
        try {
          rawItems = await this.estimateService.getEstimateItems({ estimateId: req.winningEstimateId });
        } catch (err) {
          warnings.push(`Items DQE non rechargés pour plan de charge : ${(err as Error).message}`);
        }
      }
      console.debug('[AwardedTenderToProjectService] Using override payload from preview', {
        projectId: req.projectId, phases: payload.phases.length, rawItems: rawItems.length,
      });
    } else {
      rawItems = await this.estimateService.getEstimateItems({ estimateId: req.winningEstimateId });
      if (!rawItems || rawItems.length === 0) {
        warnings.push('Le DQE du lauréat est vide — aucune phase ne sera générée.');
      }
      payload = AwardedTenderTransformer.buildHydrationPayload(req.projectId, rawItems, {
        supplierId: req.supplierId,
        supplierName: req.supplierName,
        sourceEstimateId: req.winningEstimateId,
        sourceTenderId: req.tenderId,
        mappingConfig: req.mappingConfig,
      });
      console.debug('[AwardedTenderToProjectService] Payload built from DQE', {
        projectId: req.projectId, itemsCount: rawItems.length, phases: payload.phases.length,
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

      // Plan de charge RH / Prestataires (v10 §2 Lot 4) — insertion phase_employees.
      const lotKey = (phase.name || '').trim();
      const lotItems = rawItems.filter((it) => (it.category || '').trim() === lotKey && it.resourceKind);
      for (const it of lotItems) {
        try {
          const row = {
            phase_id: phaseId!,
            employee_name: it.resourceKind === 'internal_qualification'
              ? (it.description || it.itemCode || 'Qualification')
              : (it.supplierId ? `Prestataire ${it.supplierId.slice(0, 8)}` : (it.description || 'Prestataire')),
            employee_role: it.resourceKind === 'internal_qualification'
              ? 'internal_qualification'
              : (it.resourceKind === 'external_provider' ? 'external_provider' : 'material'),
            employee_contact: it.supplierContractRef ?? null,
            daily_rate: it.estimatedHours && it.unitPrice
              ? Number((it.unitPrice * (it.estimatedHours / 8)).toFixed(2))
              : it.unitPrice ?? null,
            is_primary_supplier: it.resourceKind === 'external_provider',
          };
          await phaseRepo.insertPhaseEmployee(row);
        } catch (err) {
          warnings.push(`Plan de charge (${it.itemCode}) : ${(err as Error).message}`);
        }
      }
    }


    // 3. Marquer le tender comme "contracted".
    try {
      await (tenderRepo as any).update?.(req.tenderId, { status: 'contracted' });
    } catch (err) {
      warnings.push(`Statut tender non mis à jour : ${(err as Error).message}`);
    }

    // 4. Trace contractuelle (devis accepté → contrat), idempotente par appel d'offres.
    let contractId: string | undefined;
    let contractNumber: string | undefined;
    try {
      const contract = await getContractService().awardFromAcceptedQuote({
        projectId: req.projectId,
        tenderId: req.tenderId,
        supplierId: req.supplierId ?? null,
        supplierName: req.supplierName ?? null,
        sourceEstimateId: req.winningEstimateId ?? null,
        totalAmount: payload.contractAmount ?? 0,
        currency: payload.currency,
      });
      contractId = contract.id;
      contractNumber = contract.contractNumber;
    } catch (err) {
      warnings.push(`Contrat non enregistré : ${(err as Error).message}`);
    }

    console.debug('[AwardedTenderToProjectService] Hydration applied', {
      projectId: req.projectId,
      phases: createdPhaseIds.length,
      tasks: createdTaskIds.length,
      milestones: createdMilestoneIds.length,
      contractId,
      warnings: warnings.length,
    });

    return {
      payload, applied: true, createdPhaseIds, createdTaskIds, createdMilestoneIds,
      contractId, contractNumber, warnings,
    };
  }
}

let _instance: AwardedTenderToProjectService | undefined;
export function getAwardedTenderToProjectService(): AwardedTenderToProjectService {
  if (!_instance) _instance = new AwardedTenderToProjectService();
  return _instance;
}

