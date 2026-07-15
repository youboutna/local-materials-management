/**
 * BoqWorkflowService — status transitions on BOQ documents.
 * Pure TS, no React. Consumers call transition(state, action) to obtain
 * the next status. Persistence is handled by BoqService / hooks.
 */
export type BoqStatus =
  | 'draft'
  | 'submitted'
  | 'validated'
  | 'rejected'
  | 'signed'
  | 'invoiced'
  | 'paid';

export type BoqTransitionAction =
  | 'submit'
  | 'validate'
  | 'reject'
  | 'sign'
  | 'invoice'
  | 'pay'
  | 'reset';

const GRAPH: Record<BoqStatus, Partial<Record<BoqTransitionAction, BoqStatus>>> = {
  draft:      { submit: 'submitted', sign: 'signed' },
  submitted:  { validate: 'validated', reject: 'rejected', sign: 'signed' },
  validated:  { invoice: 'invoiced', sign: 'signed' },
  signed:     { submit: 'submitted', invoice: 'invoiced' },
  invoiced:   { pay: 'paid', reject: 'rejected' },
  rejected:   { reset: 'draft' },
  paid:       {},
};

export const BoqWorkflowService = {
  next(current: BoqStatus, action: BoqTransitionAction): BoqStatus | null {
    return GRAPH[current]?.[action] ?? null;
  },
  can(current: BoqStatus, action: BoqTransitionAction): boolean {
    return this.next(current, action) !== null;
  },
};
