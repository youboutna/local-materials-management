/** Structural lifecycle vocabulary and injectable business policy. */
export const OPERATION_CONTEXTS = [
  'unreconciled', 'purchase', 'stock_usage', 'labor', 'equipment_usage',
  'invoice_link', 'customer_receipt',
] as const;
export type OperationContext = typeof OPERATION_CONTEXTS[number];
export interface OperationPolicy {
  contexts: readonly string[];
  validatedStatuses: readonly string[];
  excludedPaymentStatuses: readonly string[];
  dqeStages: readonly string[];
  commitmentStages: readonly string[];
  acceptedStatuses: readonly string[];
}
export const DEFAULT_OPERATION_POLICY: OperationPolicy = {
  contexts: OPERATION_CONTEXTS,
  validatedStatuses: ['validated', 'invoiced', 'paid', 'archived'],
  excludedPaymentStatuses: ['draft', 'pending', 'rejected', 'cancelled', 'failed'],
  dqeStages: ['dqe', 'previsionnel', 'prévisionnel', 'estimate'],
  commitmentStages: ['devis', 'quote', 'offre', 'contrat', 'contract'],
  acceptedStatuses: ['accepted', 'accepte', 'accepté', 'signe', 'signé', 'signed', 'valide', 'validé', 'validated', 'awarded', 'attribue', 'attribué'],
};