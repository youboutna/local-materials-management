/**
 * ProjectFinancialDTO — synthèse financière DOCTRINALE, unique pour tous les modules
 * (projets, phases, contrôle des paiements, portails prestataire/consultant,
 * appels d'offres, tableau de bord, rapports).
 *
 * Chaîne canonique :
 *   Budget (DQE validé)
 *     → Engagé (devis acceptés)
 *       → Dépensé (décomptes validés)
 *         → Payé (transactions)
 *           → Restant (Budget − Dépensé)
 */

export type FinancialScope = 'project' | 'phase';

export interface ProjectFinancialDTO {
  scope: FinancialScope;
  /** Projet ou phase concerné. */
  entityId: string;
  currency: string;

  /** Budget de référence : DQE validé si disponible, sinon budget saisi. */
  budgetTotal: number;
  /** Source du budget affiché (traçabilité, jamais de valeur non sourcée). */
  budgetSource: 'dqe' | 'phases' | 'declared' | 'none';
  /** Somme des devis acceptés / signés (engagement contractuel). */
  engaged: number;
  /** Dépensé = Σ décomptes validés (factures acceptées). */
  spent: number;
  /** Payé = Σ paiements rattachés aux décomptes. */
  paid: number;
  /** Reste à payer sur décomptes validés = Dépensé − Payé. */
  remainingToPay: number;
  /** Restant budgétaire = Budget − Dépensé. */
  remaining: number;
  /** Taux de consommation = Dépensé / Budget × 100. */
  consumptionRate: number;
  /** Taux d'engagement = Engagé / Budget × 100. */
  engagementRate: number;

  decompteCount: number;
  validatedDecompteCount: number;
  pendingDecompteCount: number;
}

export const emptyProjectFinancial = (
  scope: FinancialScope,
  entityId: string,
  currency = 'MRU',
): ProjectFinancialDTO => ({
  scope,
  entityId,
  currency,
  budgetTotal: 0,
  budgetSource: 'none',
  engaged: 0,
  spent: 0,
  paid: 0,
  remainingToPay: 0,
  remaining: 0,
  consumptionRate: 0,
  engagementRate: 0,
  decompteCount: 0,
  validatedDecompteCount: 0,
  pendingDecompteCount: 0,
});
