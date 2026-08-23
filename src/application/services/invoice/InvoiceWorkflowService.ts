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
  type InvoiceActor,
  type InvoiceDocumentType,
  type InvoiceDocumentTypeDef,
} from '@/config/referentials/invoices/invoice-document-types.referential';
import { FacturXTransformer } from './FacturXTransformer';
import { reconcileLinePrice } from '@/application/services/boq/parsers/priceCoherence';

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
}

export interface InvoiceTransformResult {
  documentId: string;
  documentType: InvoiceDocumentType;
  facturxTypeCode: '310' | '380';
  status: string;
  lines: BoqLineDTO[];
  totalHt: number;
  totalTtc: number;
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

    const { lines, documentId, def } = this.build(input, source);
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
    };
  },
};
