/**
 * ProcurementChainService — moteur de la chaîne métier
 *
 *   Expression de besoin (DQE) VALIDÉE
 *     → 1. Planification (phases / jalons / tâches / ressources)
 *     → 2. Prévisions budgétaires du projet
 *     → 3. Appel d'offres rattaché au DQE
 *     → 4. Publication sur les portails prestataire / consultant
 *
 * Service pur (TypeScript, aucun React) : persistance via repositories.
 * Les paramètres (délais, statuts, tolérance budgétaire) viennent du
 * référentiel `procurement-chain.referential`.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import {
  getInvoiceDocumentType,
  resolveInvoiceDocumentType,
} from '@/config/referentials/invoices/invoice-document-types.referential';
import { PROCUREMENT_CHAIN_REFERENTIAL as REF } from '@/config/referentials/procurement/procurement-chain.referential';
import { getBoqDispatchService, type DispatchResult } from '@/application/services/boq/BoqDispatchService';
import { RepositoryFactory } from '@/infrastructure/RepositoryFactory';
import { AppError, ErrorCode } from '@/utils/errorHandling';

export interface ProcurementChainInput {
  projectId: string;
  /** Document DQE d'origine (`btp.boq_lines.document_id`). */
  documentId?: string | null;
  lines: BoqLineDTO[];
  /** Titre de l'appel d'offres (défaut : titre du projet). */
  tenderTitle?: string | null;
  /** Publier immédiatement sur les portails (défaut : true). */
  publish?: boolean;
}

export interface ProcurementForecastResult {
  previousBudget: number | null;
  dqeTotal: number;
  differencePercent: number | null;
  updated: boolean;
}

export interface ProcurementTenderResult {
  tenderId: string | null;
  reused: boolean;
  status: string;
  publishedAt: string | null;
  deadlineDate: string | null;
}

export interface ProcurementChainResult {
  planning: DispatchResult;
  forecast: ProcurementForecastResult;
  tender: ProcurementTenderResult;
  warnings: string[];
}

export interface ProcurementConsistencyReport {
  dqeTotal: number;
  projectBudget: number | null;
  differencePercent: number | null;
  planningFed: boolean;
  tenderPublished: boolean;
  issues: string[];
}

function totalHt(lines: BoqLineDTO[]): number {
  return lines.reduce(
    (acc, l) => acc + Number(l.totalHt ?? (Number(l.quantity) || 0) * Number(l.unitPrice ?? 0)),
    0,
  );
}

/** Les lignes appartiennent-elles à une expression de besoin (DQE) ? */
function isDqeLine(line: BoqLineDTO): boolean {
  return (
    resolveInvoiceDocumentType({
      source: line.source,
      documentType: line.documentType,
      dqeType: line.dqeType,
    }).code === 'dqe'
  );
}

export class ProcurementChainService {
  /** Le lot de lignes est-il une expression de besoin validée ? */
  static isValidatedDqe(lines: BoqLineDTO[]): boolean {
    const dqe = lines.filter(isDqeLine);
    if (!dqe.length) return false;
    return dqe.every(
      (l) =>
        String(l.businessStatus ?? '') === REF.requiredDqeStatus ||
        String(l.status ?? '') === 'validated',
    );
  }

  /** Porte P0 : refuse toute propagation depuis un DQE non validé. */
  static assertValidatedDqe(lines: BoqLineDTO[]): void {
    if (!lines.length) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Aucune ligne DQE à propager.');
    }
    if (!ProcurementChainService.isValidatedDqe(lines)) {
      const def = getInvoiceDocumentType('dqe');
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        `« ${def.label} » non validée : passez le document au statut « ${REF.requiredDqeStatus} » avant d'alimenter la planification et l'appel d'offres.`,
      );
    }
  }

  /** Étape 2 — synchronise le budget prévisionnel du projet sur le total DQE. */
  static async syncForecast(projectId: string, lines: BoqLineDTO[]): Promise<ProcurementForecastResult> {
    const dqeTotal = Number(totalHt(lines).toFixed(2));
    const projects = RepositoryFactory.getProjectRepository();
    const project = await projects.findById(projectId).catch(() => null);
    const previousBudget = project ? Number(project.budget ?? 0) : null;
    const differencePercent =
      previousBudget && previousBudget > 0
        ? Number((((dqeTotal - previousBudget) / previousBudget) * 100).toFixed(2))
        : null;

    const mustUpdate =
      previousBudget === null ||
      previousBudget === 0 ||
      Math.abs(differencePercent ?? 0) > REF.budgetTolerancePercent;

    if (mustUpdate && dqeTotal > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await projects.update(projectId, { budget: dqeTotal } as any);
    }
    return { previousBudget, dqeTotal, differencePercent, updated: mustUpdate && dqeTotal > 0 };
  }

  /** Étape 3 & 4 — crée (ou réutilise) l'appel d'offres du DQE et le publie. */
  static async publishTender(input: ProcurementChainInput, amount: number): Promise<ProcurementTenderResult> {
    const tenders = RepositoryFactory.getTenderRepository();
    const publish = input.publish !== false;
    const now = new Date();
    const deadline = new Date(now.getTime() + REF.consultationDays * 86_400_000);
    const status = publish ? REF.publishedTenderStatus : REF.draftTenderStatus;

    const existing = input.documentId
      ? (await tenders.findByProjectId(input.projectId).catch(() => [])).find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t: any) => (t.sourceDqeDocumentId ?? t.source_dqe_document_id) === input.documentId,
        )
      : undefined;

    if (existing?.id) {
      await tenders.update(existing.id, {
        status,
        publication_date: publish ? now.toISOString() : null,
        portal_published_at: publish ? now.toISOString() : null,
        deadline_date: deadline.toISOString(),
        submission_deadline: deadline.toISOString(),
        estimated_value: amount,
        budget_max: amount,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      return {
        tenderId: existing.id,
        reused: true,
        status,
        publishedAt: publish ? now.toISOString() : null,
        deadlineDate: deadline.toISOString(),
      };
    }

    const title = input.tenderTitle?.trim() || "Appel d'offres — expression de besoin validée";
    const created = await tenders.save({
      project_id: input.projectId,
      title,
      description: title,
      status,
      launch_date: now.toISOString(),
      publication_date: publish ? now.toISOString() : null,
      portal_published_at: publish ? now.toISOString() : null,
      deadline_date: deadline.toISOString(),
      submission_deadline: deadline.toISOString(),
      estimated_value: amount,
      budget_max: amount,
      source_dqe_document_id: input.documentId ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    return {
      tenderId: created?.id ?? null,
      reused: false,
      status,
      publishedAt: publish ? now.toISOString() : null,
      deadlineDate: deadline.toISOString(),
    };
  }

  /**
   * Exécute la chaîne complète depuis une expression de besoin validée.
   * Ordre imposé : planification → prévisions → appel d'offres → portails.
   */
  static async runFromValidatedDqe(input: ProcurementChainInput): Promise<ProcurementChainResult> {
    if (!input.projectId) {
      throw new AppError(ErrorCode.VALIDATION_ERROR, 'Project ID requis');
    }
    ProcurementChainService.assertValidatedDqe(input.lines);

    const warnings: string[] = [];

    // 1. Planification (la porte DQE validé est également appliquée côté dispatch).
    const planning = await getBoqDispatchService().dispatchToWbs(input.projectId, input.lines);

    // 2. Prévisions budgétaires.
    const forecast = await ProcurementChainService.syncForecast(input.projectId, input.lines);
    if (forecast.differencePercent !== null && Math.abs(forecast.differencePercent) > 10) {
      warnings.push(
        `Écart budget projet ↔ DQE de ${forecast.differencePercent}% : vérifiez le financement avant publication.`,
      );
    }

    // 3 & 4. Appel d'offres + publication portails.
    const tender = await ProcurementChainService.publishTender(input, forecast.dqeTotal);
    if (!tender.tenderId) warnings.push("L'appel d'offres n'a pas pu être créé : reprenez la publication.");

    return { planning, forecast, tender, warnings };
  }

  /** Contrôle de cohérence DQE ↔ Planification ↔ Appel d'offres. */
  static async checkConsistency(
    projectId: string,
    lines: BoqLineDTO[],
    documentId?: string | null,
  ): Promise<ProcurementConsistencyReport> {
    const dqeTotal = Number(totalHt(lines).toFixed(2));
    const issues: string[] = [];

    const projects = RepositoryFactory.getProjectRepository();
    const project = await projects.findById(projectId).catch(() => null);
    const projectBudget = project ? Number(project.budget ?? 0) : null;
    const differencePercent =
      projectBudget && projectBudget > 0
        ? Number((((dqeTotal - projectBudget) / projectBudget) * 100).toFixed(2))
        : null;
    if (differencePercent !== null && Math.abs(differencePercent) > REF.budgetTolerancePercent) {
      issues.push(`Budget prévisionnel désynchronisé (${differencePercent}%).`);
    }

    const phases = await RepositoryFactory.getPhaseRepository().findByProjectId(projectId).catch(() => []);
    const planningFed = phases.length > 0;
    if (!planningFed) issues.push("La planification n'est pas alimentée par le DQE validé.");

    const projectTenders = await RepositoryFactory.getTenderRepository()
      .findByProjectId(projectId)
      .catch(() => []);
    const linked = documentId
      ? projectTenders.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (t: any) => (t.sourceDqeDocumentId ?? t.source_dqe_document_id) === documentId,
        )
      : projectTenders;
    const tenderPublished = linked.some((t) =>
      [REF.publishedTenderStatus, 'open'].includes(String(t.status)),
    );
    if (!tenderPublished) issues.push("Aucun appel d'offres publié pour ce DQE.");

    return { dqeTotal, projectBudget, differencePercent, planningFed, tenderPublished, issues };
  }
}
