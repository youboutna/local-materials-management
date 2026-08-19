/**
 * BoqPartyResolverService — résolution contextuelle des parties prenantes
 * (émetteur / destinataire) d'un document BOQ, à partir du référentiel
 * `DQE_CONTEXT_MAPPING` et des métadonnées d'en-tête extraites par le parseur.
 *
 * Trois contextes métier :
 *   • Expression de besoin (project-dqe)   : émetteur = organisation projet, destinataire = organisation fixe
 *   • Devis fournisseur (supplier-bid / tender-estimate) : émetteur = fournisseur, destinataire = organisation projet
 *   • Décompte / facture (supplier-invoice): émetteur = fournisseur, destinataire = organisation projet
 *
 * Pur TypeScript — aucune dépendance React ni Supabase.
 */
import { DQE_CONTEXT_MAPPING, type DQEContext, type DQEPartySource } from '@/config/referentials/dqe-context-mapping.referential';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';
import type { BoqRouteContext } from './BoqContextService';

export interface BoqPartyHints {
  /** Organisation porteuse du projet (maître d'ouvrage / gestionnaire). */
  organizationName?: string | null;
  /** Fournisseur / soumissionnaire. */
  supplierName?: string | null;
}

export interface BoqPartyResolution {
  senderName?: string;
  recipientName?: string;
  emitterSource: DQEPartySource;
  recipientSource: DQEPartySource;
  mappingCode?: string;
}

const CONTEXT_ALIAS: Record<BoqRouteContext, DQEContext> = {
  'project-dqe': 'project-dqe',
  'tender-estimate': 'supplier-bid',
  'supplier-bid': 'supplier-bid',
  'supplier-invoice': 'supplier-invoice',
};

/** Extrait les parties détectées par le parseur d'en-tête (metadata des lignes). */
export function partyHintsFromLines(lines: BoqLineDTO[]): BoqPartyHints {
  const hints: BoqPartyHints = {};
  for (const line of lines) {
    const meta = (line.metadata ?? {}) as Record<string, unknown>;
    const org = meta.organizationName;
    const sup = meta.supplierName;
    if (!hints.organizationName && typeof org === 'string' && org.trim()) hints.organizationName = org.trim();
    if (!hints.supplierName && typeof sup === 'string' && sup.trim()) hints.supplierName = sup.trim();
    if (hints.organizationName && hints.supplierName) break;
  }
  return hints;
}

export const BoqPartyResolverService = {
  resolve(routeContext: BoqRouteContext, hints: BoqPartyHints = {}): BoqPartyResolution {
    const context = CONTEXT_ALIAS[routeContext];
    const mapping = DQE_CONTEXT_MAPPING.find((m) => m.context === context);

    const emitterSource: DQEPartySource = mapping?.emitterSource ?? 'project_organization';
    const recipientSource: DQEPartySource = mapping?.recipientSource ?? 'project_organization';

    const nameOf = (source: DQEPartySource, fixed?: { organizationId?: string }): string | undefined => {
      switch (source) {
        case 'supplier':
          return hints.supplierName ?? undefined;
        case 'project_organization':
          return hints.organizationName ?? undefined;
        case 'fixed_organization':
          return fixed?.organizationId ?? undefined;
        default:
          return undefined;
      }
    };

    return {
      senderName: nameOf(emitterSource, mapping?.defaultEmitter),
      recipientName: nameOf(recipientSource, mapping?.defaultRecipient),
      emitterSource,
      recipientSource,
      mappingCode: mapping?.code,
    };
  },
};
