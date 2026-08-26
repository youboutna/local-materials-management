/**
 * InvoiceWorkflowService — moteur des 5 transformations documentaires :
 *   DQE → Devis → Contrat → Décompte(%) → Facture finale
 *
 * Le document est un ensemble de lignes `btp.boq_lines` partageant un
 * `document_id`. Chaque transformation clone les lignes source, applique le
 * type/statut issu du référentiel et trace la filiation dans `metadata`.
 *
 * Pure TS (hexagonal) : persistance via le repository BOQ, zéro React.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqSource } from '@/domain/entities/boq/BoqLine';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import {
  getInvoiceDocumentType,
  getNextBusinessStatus,
  isSourceStatusSatisfied,
  type InvoiceActor,
  type InvoiceDocumentType,
  type InvoiceDocumentTypeDef,
} from '@/config/referentials/invoices/invoice-document-types.referential';
import { FacturXTransformer } from './FacturXTransformer';
import { reconcileLinePrice } from '@/application/services/boq/parsers/priceCoherence';
import {
  InvoiceBudgetGuardService,
  type InvoiceBudgetVerdict,
} from './InvoiceBudgetGuardService';

export interface InvoiceTransformInput {
  /** Type du document source. */
  fromType: InvoiceDocumentType;
  /** Lignes du document source (déjà chargées) — sinon rechargées par contexte. */
  lines?: BoqLineDTO[];
  sourceContextId: string;
  /** `source` cible dans boq_lines (dqe / supplier_bid / invoice / tender_estimate). */
  targetSource?: BoqSource;
  targetContextId?: string;
  projectId?: string;
  tenderId?: string;
  /** Avancement facturé (décompte uniquement). */
  percentage?: number;
  title?: string;
  actor?: InvoiceActor;
  reference?: string;
  /** Verrou budgétaire (T11) : plafonds de contrôle avant émission. */
  projectBudget?: number | null;
  contractAmount?: number | null;
  alreadyInvoiced?: number | null;
  currency?: string;
}

export interface InvoiceTransformResult {
  documentId: string;
  documentType: InvoiceDocumentType;
  facturxTypeCode: '310' | '380';
  status: string;
  lines: BoqLineDTO[];
  totalHt: number;
  totalTtc: number;
  /** Verdict du verrou budgétaire appliqué avant persistance. */
  budget?: InvoiceBudgetVerdict;
}


function clampPct(p?: number): number {
  if (!Number.isFinite(p as number) || (p as number) <= 0) return 100;
  return Math.min(100, p as number);
}

function newDocumentId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const InvoiceWorkflowService = {
  /** Définition référentielle d'un type de document. */
  definition(type: InvoiceDocumentType): InvoiceDocumentTypeDef {
    return getInvoiceDocumentType(type);
  },

  /** Étape suivante du cycle (null si terminal). */
  nextType(type: InvoiceDocumentType): InvoiceDocumentType | null {
    return getInvoiceDocumentType(type).next;
  },

  /** L'acteur peut-il produire ce type de document ? */
  canActorProduce(type: InvoiceDocumentType, actor: InvoiceActor): boolean {
    return getInvoiceDocumentType(type).actors.includes(actor);
  },

  /** Transition de statut contrôlée par le référentiel. */
  transitionStatus(type: InvoiceDocumentType, target: string): string {
    const def = getInvoiceDocumentType(type);
    return def.statuses.includes(target) ? target : def.initialStatus;
  },

  /**
   * Avance le statut métier du document (DQE : brouillon → soumis → validé ;
   * devis : reçu → en analyse → accepté). Les statuts sont ceux du référentiel
   * propre à l'étape : aucun statut de devis n'est applicable à un DQE.
   *
   * Effet de bord métier imposé : lorsqu'un DQE atteint son statut de
   * validation, la chaîne d'approvisionnement est déclenchée AUTOMATIQUEMENT
   * (planification → prévisions budgétaires → appel d'offres → publication
   * portails). Aucun clic supplémentaire n'est requis.
   */
  async advanceStatus(input: {
    type: InvoiceDocumentType;
    lines: BoqLineDTO[];
    target?: string;
    /** Désactive la propagation automatique (transitions inverses). */
    propagate?: boolean;
  }): Promise<{ status: string; updated: number; chain?: AutoChainOutcome }> {
    const def = getInvoiceDocumentType(input.type);
    const current = input.lines[0]?.businessStatus ?? def.initialStatus;
    const target = input.target
      ? this.transitionStatus(input.type, input.target)
      : getNextBusinessStatus(input.type, current);
    if (!target) throw new Error(`Aucun statut suivant pour « ${def.label} »`);

    const persistable = input.lines.filter((l) => !!l.id);
    await Promise.all(
      persistable.map((l) =>
        boqRepository.update(l.id as string, {
          source: l.source,
          documentType: def.code,
          businessStatus: target,
        } as Partial<BoqLineDTO>),
      ),
    );

    const chain =
      input.propagate === false
        ? undefined
        : await this.propagateOnValidation({ type: input.type, target, lines: persistable });

    return { status: target, updated: persistable.length, chain };
  },

  /**
   * Propagation automatique post-validation d'une expression de besoin.
   * Ne lève jamais : un échec de propagation est retourné en diagnostic afin de
   * ne pas annuler la transition de statut déjà persistée.
   */
  async propagateOnValidation(input: {
    type: InvoiceDocumentType;
    target: string;
    lines: BoqLineDTO[];
  }): Promise<AutoChainOutcome | undefined> {
    const def = getInvoiceDocumentType(input.type);
    if (def.code !== 'dqe' || input.target !== def.validationStatus) return undefined;

    const projectId = input.lines.find((l) => l.projectId)?.projectId ?? null;
    const documentId = input.lines.find((l) => l.documentId)?.documentId ?? null;
    if (!projectId) {
      return { triggered: false, error: 'Projet introuvable sur les lignes du document.' };
    }

    try {
      const { ProcurementChainService } = await import(
        '@/application/services/procurement/ProcurementChainService'
      );
      const validated = input.lines.map((l) => ({ ...l, businessStatus: input.target }));
      const result = await ProcurementChainService.runFromValidatedDqe({
        projectId,
        documentId,
        lines: validated,
        publish: true,
      });
      return {
        triggered: true,
        tenderId: result.tender.tenderId,
        tenderStatus: result.tender.status,
        publishedAt: result.tender.publishedAt,
        phases: result.planning.phases ?? 0,
        milestones: result.planning.milestones ?? 0,
        tasks: result.planning.tasks ?? 0,
        linesDispatched: result.planning.linesUpdated ?? 0,
        budgetSynced: result.forecast.updated,
        warnings: result.warnings,
      };
    } catch (error) {
      return { triggered: false, error: error instanceof Error ? error.message : String(error) };
    }
  },


  /** Construit (sans persister) les lignes du document cible. */
  build(input: InvoiceTransformInput, sourceLines: BoqLineDTO[]): { lines: BoqLineDTO[]; documentId: string; def: InvoiceDocumentTypeDef } {
    const nextType = this.nextType(input.fromType);
    if (!nextType) throw new Error(`Aucune étape suivante après « ${input.fromType} »`);
    const def = getInvoiceDocumentType(nextType);
    const documentId = newDocumentId();
    const ratio = def.requiresPercentage ? clampPct(input.percentage) / 100 : 1;

    const lines = sourceLines.map<BoqLineDTO>((l) => {
      // Réconciliation arithmétique : le montant source fait foi, le P.U. est
      // recalculé si nécessaire afin que la proratisation reste fidèle.
      const coherent = reconcileLinePrice({
        quantity: l.quantity ?? 0,
        unitPrice: l.unitPrice,
        totalHt: l.totalHt,
      });
      const quantity = Number((((l.quantity ?? 0) * ratio)).toFixed(4));
      const unitPrice = coherent.unitPrice;
      return {
        ...l,
        id: undefined,
        source: input.targetSource ?? l.source,
        contextId: input.targetContextId ?? input.sourceContextId,
        quantity,
        unitPrice,
        totalHt: coherent.totalHt != null ? Number((coherent.totalHt * ratio).toFixed(2)) : null,

        status: 'draft',
        dqeType: def.dqeType,
        documentId,
        title: input.title ?? def.label,
        // Colonnes dédiées (T10) : le cycle documentaire est requêtable en SQL
        // sans dépendre du contenu de `metadata`.
        documentType: def.code,
        businessStatus: def.initialStatus,
        // Traçabilité P0 : le document cible référence son document source.
        sourceDocumentId: l.documentId ?? null,
        sourceDocumentType: input.fromType,
        facturxTypeCode: def.facturxTypeCode,
        billedPercentage: def.requiresPercentage ? clampPct(input.percentage) : null,
        metadata: {
          ...(l.metadata ?? {}),
          invoiceWorkflow: {
            documentType: def.code,
            facturxTypeCode: def.facturxTypeCode,
            businessStatus: def.initialStatus,
            percentage: def.requiresPercentage ? clampPct(input.percentage) : null,
            priceCorrected: coherent.corrected || undefined,
            fromType: input.fromType,
            fromLineId: l.id ?? null,
            fromDocumentId: l.documentId ?? null,
            actor: input.actor ?? 'manager',
            reference: input.reference ?? null,
          },
        },
      };
    });

    return { lines, documentId, def };
  },

  /** Transforme et persiste le document cible. */
  async transform(input: InvoiceTransformInput): Promise<InvoiceTransformResult> {
    const source = input.lines?.length
      ? input.lines
      : await boqRepository.list({
          source: input.targetSource ?? 'dqe',
          contextId: input.sourceContextId,
          projectId: input.projectId,
        });
    if (!source.length) throw new Error('Aucune ligne à transformer');

    // P1 — un devis ne peut naître que d'un DQE validé, un contrat que d'un
    // devis accepté : le statut du document source est contrôlé ici.
    const nextTypeCode = this.nextType(input.fromType);
    const sourceStatus =
      source[0]?.businessStatus ?? getInvoiceDocumentType(input.fromType).initialStatus;
    if (nextTypeCode && !isSourceStatusSatisfied(nextTypeCode, sourceStatus)) {
      const fromDef = getInvoiceDocumentType(input.fromType);
      const required = getInvoiceDocumentType(nextTypeCode).requiredSourceStatus;
      throw new Error(
        `« ${getInvoiceDocumentType(nextTypeCode).label} » impossible : le document « ${fromDef.label} » doit être au statut « ${required} » (statut actuel : « ${sourceStatus} »).`,
      );
    }

    const { lines, documentId, def } = this.build(input, source);

    // Verrou budgétaire (T11) : bloque décompte/facture au-delà du plafond.
    const budget = InvoiceBudgetGuardService.assert({
      targetType: def.code,
      lines,
      projectBudget: input.projectBudget ?? null,
      contractAmount: input.contractAmount ?? null,
      alreadyInvoiced: input.alreadyInvoiced ?? null,
      currency: input.currency,
    });

    const persisted = await boqRepository.bulkCreate(lines);
    const totals = FacturXTransformer.computeTotals(persisted.length ? persisted : lines);
    return {
      documentId,
      documentType: def.code,
      facturxTypeCode: def.facturxTypeCode,
      status: def.initialStatus,
      lines: persisted.length ? persisted : lines,
      totalHt: totals.totalHt,
      totalTtc: totals.totalTtc,
      budget,
    };

  },
};
