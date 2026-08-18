/**
 * BoqInvoiceService — génère un décompte / facture (source `invoice`) à partir
 * d'un devis fournisseur validé (source `supplier_bid`), au pourcentage
 * d'avancement demandé. Pure TS (hexagonal) : la persistance passe par le
 * repository BOQ, aucune dépendance React.
 */
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';

export interface CreateDecompteInput {
  /** Lignes du devis source (déjà chargées) ou vide pour recharger. */
  quoteLines?: BoqLineDTO[];
  /** Contexte du devis (submissionId / senderId fournisseur). */
  quoteContextId: string;
  /** Contexte cible de la facture (généralement identique). */
  invoiceContextId?: string;
  /** Avancement facturé (1 → 100 %). */
  percentage: number;
  projectId?: string;
  tenderId?: string;
  documentId?: string;
  title?: string;
}

export interface CreateDecompteResult {
  lines: BoqLineDTO[];
  totalHt: number;
}

function pct(p: number): number {
  if (!Number.isFinite(p) || p <= 0) return 100;
  return Math.min(100, p);
}

export const BoqInvoiceService = {
  /** Construit les lignes de décompte sans les persister (aperçu). */
  build(input: CreateDecompteInput, quoteLines: BoqLineDTO[]): CreateDecompteResult {
    const ratio = pct(input.percentage) / 100;
    const lines = quoteLines.map<BoqLineDTO>((l) => {
      const quantity = Number(((l.quantity ?? 0) * ratio).toFixed(4));
      const unitPrice = l.unitPrice ?? null;
      return {
        ...l,
        id: undefined,
        source: 'invoice',
        contextId: input.invoiceContextId ?? input.quoteContextId,
        quantity,
        unitPrice,
        totalHt: unitPrice != null ? quantity * unitPrice : null,
        status: 'draft',
        dqeType: 'decompte',
        documentId: input.documentId ?? null,
        title: input.title ?? null,
        metadata: {
          ...(l.metadata ?? {}),
          decompte: {
            percentage: pct(input.percentage),
            quoteContextId: input.quoteContextId,
            quoteLineId: l.id ?? null,
          },
        },
      };
    });
    const totalHt = lines.reduce((s, l) => s + (l.totalHt ?? 0), 0);
    return { lines, totalHt };
  },

  /** Charge le devis si besoin, construit puis persiste le décompte. */
  async createFromQuote(input: CreateDecompteInput): Promise<CreateDecompteResult> {
    const source = input.quoteLines?.length
      ? input.quoteLines
      : await boqRepository.list({ source: 'supplier_bid', contextId: input.quoteContextId });
    if (!source.length) throw new Error('Aucune ligne de devis à facturer');
    const built = this.build(input, source);
    const persisted = await boqRepository.bulkCreate(built.lines);
    return { lines: persisted, totalHt: built.totalHt };
  },
};
