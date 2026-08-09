/**
 * BoqContextService — pure TS. Given route + role, returns the BOQ context:
 *   { lineType, projectId, tenderId, submissionId, senderId, allowedActions }.
 * Consumed by DqeWorkspace / BoqActionsBar to hide non-authorized actions.
 */
import type { BoqSource } from '@/domain/entities/boq/BoqLine';

export type BoqAction =
  | 'create'
  | 'import'
  | 'generatePdf'
  | 'sign'
  | 'email'
  | 'download'
  | 'distribute'
  | 'attachToSubmission'
  | 'submitInvoice'
  | 'publish'
  | 'transfer';

export type BoqRouteContext =
  | 'project-dqe'
  | 'tender-estimate'
  | 'supplier-bid'
  | 'supplier-invoice';

export interface BoqContext {
  routeContext: BoqRouteContext;
  source: BoqSource;
  projectId?: string;
  tenderId?: string;
  submissionId?: string;
  senderId?: string;
  contextId: string;
  allowedActions: BoqAction[];
  title: string;
  docPrefix: string;
}

interface ResolveInput {
  routeContext: BoqRouteContext;
  projectId?: string;
  tenderId?: string;
  submissionId?: string;
  senderId?: string;
}

const MATRIX: Record<BoqRouteContext, { source: BoqSource; actions: BoqAction[]; title: string; docPrefix: string }> = {
  'project-dqe':      { source: 'dqe',              actions: ['create', 'import', 'generatePdf', 'sign', 'email', 'download', 'distribute', 'transfer'], title: 'Expression de besoin (DQE)', docPrefix: 'dqe' },
  'tender-estimate':  { source: 'tender_estimate',  actions: ['create', 'import', 'generatePdf', 'sign', 'email', 'download', 'publish', 'transfer'],    title: 'DQE Appel d’offres',          docPrefix: 'estimation' },
  'supplier-bid':     { source: 'supplier_bid',     actions: ['create', 'import', 'generatePdf', 'sign', 'email', 'download', 'attachToSubmission', 'transfer'], title: 'Devis fournisseur',   docPrefix: 'devis' },
  'supplier-invoice': { source: 'invoice',          actions: ['create', 'import', 'generatePdf', 'sign', 'email', 'download', 'submitInvoice'],           title: 'Décompte / Facture',   docPrefix: 'facture' },
};

export const BoqContextService = {
  resolve(input: ResolveInput): BoqContext {
    const cfg = MATRIX[input.routeContext];
    const contextId =
      input.routeContext === 'project-dqe' ? (input.projectId ?? '')
      : input.routeContext === 'tender-estimate' ? (input.tenderId ?? '')
      : (input.submissionId ?? input.senderId ?? '');
    return {
      routeContext: input.routeContext,
      source: cfg.source,
      projectId: input.projectId,
      tenderId: input.tenderId,
      submissionId: input.submissionId,
      senderId: input.senderId,
      contextId,
      allowedActions: cfg.actions,
      title: cfg.title,
      docPrefix: cfg.docPrefix,
    };
  },
  can(ctx: BoqContext, action: BoqAction): boolean {
    return ctx.allowedActions.includes(action);
  },
};
