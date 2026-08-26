/**
 * DocumentLifecycleService — moteur du cycle de vie documentaire étendu.
 *
 * Responsabilités (pure TS, hexagonal) :
 *   • résoudre l'étape courante du stepper (7 jalons du référentiel) ;
 *   • déterminer si les lignes du document sont éditables (DRAFT / REOPEN) ;
 *   • lister les transitions INVERSES autorisées pour l'acteur ;
 *   • appliquer une transition inverse (persistance via InvoiceWorkflowService).
 *
 * Aucune règle codée en dur : tout provient de `document-lifecycle.referential`
 * et de `invoice-document-types.referential`.
 */
import {
  EDITABLE_STATUSES,
  FROZEN_STATUSES,
  LIFECYCLE_STAGES,
  REVERSE_TRANSITIONS,
  type LifecycleStageDef,
  type ReverseTransitionDef,
} from '@/config/referentials/documents/document-lifecycle.referential';
import {
  getInvoiceDocumentType,
  type InvoiceDocumentType,
} from '@/config/referentials/invoices/invoice-document-types.referential';
import { InvoiceWorkflowService } from '@/application/services/invoice/InvoiceWorkflowService';
import type { BoqLineDTO } from '@/dtos/boq/BoqLineDTO';

export interface LifecycleState {
  documentType: InvoiceDocumentType;
  status: string;
  /** Index du jalon courant dans `LIFECYCLE_STAGES`. */
  stageIndex: number;
  stage: LifecycleStageDef;
  /** Les lignes peuvent-elles être ajoutées / modifiées ? */
  editable: boolean;
  /** Document figé (payé / terminé) : aucune transition possible. */
  frozen: boolean;
}

export interface LifecycleActor {
  roles?: string[];
}

const norm = (v?: string | null) =>
  String(v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_v\d+$/, '')
    .trim();

export const DocumentLifecycleService = {
  stages(): LifecycleStageDef[] {
    return LIFECYCLE_STAGES;
  },

  /** Étape courante : jalon documentaire, avancé au jalon de gouvernance atteint. */
  resolve(input: { documentType: InvoiceDocumentType; status?: string | null }): LifecycleState {
    const def = getInvoiceDocumentType(input.documentType);
    const status = norm(input.status) || def.initialStatus;
    const docIndex = LIFECYCLE_STAGES.findIndex((s) => s.documentType === def.code);
    let stageIndex = docIndex < 0 ? 0 : docIndex;

    // Jalon de gouvernance immédiatement suivant : franchi si le statut le permet.
    const nextGate = LIFECYCLE_STAGES[stageIndex + 1];
    if (nextGate?.kind === 'gate' && (nextGate.reachedWhenStatusIn ?? []).includes(status)) {
      stageIndex += 1;
    }

    const frozen = FROZEN_STATUSES.includes(status);
    return {
      documentType: def.code,
      status,
      stageIndex,
      stage: LIFECYCLE_STAGES[stageIndex],
      editable: !frozen && EDITABLE_STATUSES.includes(status),
      frozen,
    };
  },

  /** Étape courante déduite directement des lignes d'un document. */
  resolveFromLines(documentType: InvoiceDocumentType, lines: BoqLineDTO[]): LifecycleState {
    const status = lines.find((l) => l.businessStatus)?.businessStatus ?? null;
    return this.resolve({ documentType, status });
  },

  /** Transitions inverses disponibles pour l'acteur (permissions incluses). */
  reverseActions(input: {
    documentType: InvoiceDocumentType;
    status?: string | null;
    actor?: LifecycleActor;
  }): ReverseTransitionDef[] {
    const status = norm(input.status) || getInvoiceDocumentType(input.documentType).initialStatus;
    if (FROZEN_STATUSES.includes(status)) return [];
    const roles = (input.actor?.roles ?? []).map((r) => norm(r));
    return REVERSE_TRANSITIONS.filter(
      (t) =>
        t.documentType === input.documentType &&
        t.fromStatuses.includes(status) &&
        (roles.length === 0 ? false : t.roles.some((r) => roles.includes(norm(r)))),
    );
  },

  /** Le jalon cliqué autorise-t-il un retour arrière ? */
  reverseActionForStage(input: {
    documentType: InvoiceDocumentType;
    status?: string | null;
    stageCode: string;
    actor?: LifecycleActor;
  }): ReverseTransitionDef | null {
    const available = this.reverseActions(input);
    if (!available.length) return null;
    const current = this.resolve({ documentType: input.documentType, status: input.status });
    const targetIndex = LIFECYCLE_STAGES.findIndex((s) => s.code === input.stageCode);
    if (targetIndex < 0 || targetIndex > current.stageIndex) return null;
    // Retour au jalon de publication → annulation de publication ; sinon réouverture.
    const stage = LIFECYCLE_STAGES[targetIndex];
    if (stage.kind === 'gate') {
      return available.find((a) => a.action === 'UNPUBLISH') ?? available[0];
    }
    return available.find((a) => a.action !== 'UNPUBLISH') ?? available[0];
  },

  /** Applique une transition inverse : persiste le statut cible sur les lignes. */
  async applyReverse(input: {
    transition: ReverseTransitionDef;
    lines: BoqLineDTO[];
  }): Promise<{ status: string; updated: number }> {
    if (!input.lines.length) throw new Error('Aucune ligne à déverrouiller');
    return InvoiceWorkflowService.advanceStatus({
      type: input.transition.documentType,
      lines: input.lines,
      target: input.transition.targetStatus,
      // Transition inverse : aucune propagation métier (dé-publication gérée à part).
      propagate: false,
    });
  },
};

export default DocumentLifecycleService;
