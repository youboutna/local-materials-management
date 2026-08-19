/**
 * BoqTransferService — exécute l'étape « suivante » du workflow d'un document BOQ.
 * Chaque contexte a une cible métier distincte :
 *   • project-dqe       → soumission pour validation hiérarchique (statut `submitted`)
 *   • tender-estimate   → publication vers le portail fournisseur (statut `validated`)
 *   • supplier-bid      → rattachement à une soumission d'appel d'offres (statut `submitted`)
 *   • supplier-invoice  → soumission pour paiement (statut `invoiced`)
 *
 * La transition est persistée : statut + traçabilité dans `metadata.transfer`.
 * Pur TypeScript — pas de React, accès DB uniquement via le repository BOQ.
 */
import type { BoqStatus } from '@/domain/entities/boq/BoqLine';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import { boqRepository } from '@/infrastructure/adapters/supabase/SupabaseBoqRepository';
import type { BoqRouteContext } from './BoqContextService';

export interface BoqTransferTarget {
  status: BoqStatus;
  stage: string;
  label: string;
  successMessage: string;
}

export const BOQ_TRANSFER_TARGETS: Record<BoqRouteContext, BoqTransferTarget> = {
  'project-dqe': {
    status: 'submitted',
    stage: 'hierarchy_validation',
    label: 'Soumettre pour validation',
    successMessage: 'Document soumis à la validation hiérarchique.',
  },
  'tender-estimate': {
    status: 'validated',
    stage: 'published_to_suppliers',
    label: 'Publier vers fournisseurs',
    successMessage: 'DQE publié : visible depuis le portail fournisseur.',
  },
  'supplier-bid': {
    status: 'submitted',
    stage: 'attached_to_submission',
    label: 'Joindre à ma soumission',
    successMessage: 'Devis rattaché à la soumission.',
  },
  'supplier-invoice': {
    status: 'invoiced',
    stage: 'payment_requested',
    label: 'Soumettre pour paiement',
    successMessage: 'Décompte soumis au circuit de paiement.',
  },
};

export interface BoqTransferInput {
  routeContext: BoqRouteContext;
  lines: BoqLineDTO[];
  actorName?: string | null;
  submissionId?: string | null;
}

export interface BoqTransferResult {
  transferred: number;
  status: BoqStatus;
  stage: string;
  message: string;
}

export const BoqTransferService = {
  target(routeContext: BoqRouteContext): BoqTransferTarget {
    return BOQ_TRANSFER_TARGETS[routeContext];
  },

  async transfer(input: BoqTransferInput): Promise<BoqTransferResult> {
    const target = BOQ_TRANSFER_TARGETS[input.routeContext];
    const persistable = input.lines.filter((l) => !!l.id);
    if (!persistable.length) {
      throw new Error('Aucune ligne enregistrée : sauvegardez le document avant de le transférer.');
    }

    const transferredAt = new Date().toISOString();
    await Promise.all(
      persistable.map((line) =>
        boqRepository.update(line.id as string, {
          source: line.source,
          status: target.status,
          metadata: {
            ...(line.metadata ?? {}),
            transfer: {
              stage: target.stage,
              routeContext: input.routeContext,
              transferredAt,
              transferredBy: input.actorName ?? null,
              submissionId: input.submissionId ?? null,
            },
          },
        } as Partial<BoqLineDTO>),
      ),
    );

    return {
      transferred: persistable.length,
      status: target.status,
      stage: target.stage,
      message: target.successMessage,
    };
  },
};
