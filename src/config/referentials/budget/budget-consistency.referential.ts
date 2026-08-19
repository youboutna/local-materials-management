/**
 * Référentiel — cohérence budgétaire (Loi de Finances ↔ projet ↔ phases ↔ DQE)
 *
 * Aucune règle codée en dur dans l'UI : toutes les tolérances et sévérités
 * de contrôle budgétaire sont déclarées ici et consommées par
 * `BudgetConsistencyService`.
 */

export type BudgetRuleSeverity = 'info' | 'warning' | 'error';

export interface BudgetConsistencyRule {
  code: string;
  label: string;
  description: string;
  severity: BudgetRuleSeverity;
  /** Tolérance relative acceptée avant émission de l'alerte (0.02 = 2 %). */
  tolerancePct: number;
}

export const BUDGET_CONSISTENCY_RULES: readonly BudgetConsistencyRule[] = [
  {
    code: 'PROJECT_BUDGET_WITHIN_CP_CE',
    label: 'Budget projet encadré par CP et CE',
    description:
      "Lorsqu'un lien budgétaire est configuré, le budget du projet doit être compris entre le total des Crédits de Paiement (plancher annuel) et le total des Crédits d'Engagement (plafond pluriannuel).",
    severity: 'warning',
    tolerancePct: 0.02,
  },
  {
    code: 'PROJECT_BUDGET_OVER_CE',
    label: "Budget projet supérieur aux Crédits d'Engagement",
    description:
      "Le budget du projet dépasse le plafond d'engagement autorisé par les lignes budgétaires liées.",
    severity: 'error',
    tolerancePct: 0.02,
  },
  {
    code: 'ALLOCATION_OVER_REFERENTIAL_CEILING',
    label: 'Allocation supérieure au plafond du référentiel',
    description:
      "Le montant CE/CP saisi dépasse le montant inscrit dans la Loi de Finances pour l'action ou la ligne sélectionnée.",
    severity: 'warning',
    tolerancePct: 0,
  },
  {
    code: 'PHASES_BUDGET_OVER_PROJECT',
    label: 'Somme des phases supérieure au budget projet',
    description:
      "Le cumul des budgets de phases doit rester inférieur ou égal au budget du projet.",
    severity: 'error',
    tolerancePct: 0.01,
  },
  {
    code: 'PHASES_BUDGET_UNDER_COVERAGE',
    label: 'Couverture budgétaire des phases incomplète',
    description:
      'Une part significative du budget projet n’est pas encore répartie sur les phases.',
    severity: 'info',
    tolerancePct: 0.1,
  },
  {
    code: 'BOQ_RESIDUAL_UNASSIGNED',
    label: 'Résidu DQE non affecté à la WBS',
    description:
      'Des lignes DQE ne sont rattachées à aucune phase / jalon : le suivi prévu vs réel est incomplet.',
    severity: 'warning',
    tolerancePct: 0.05,
  },
  {
    code: 'BOQ_ACTUAL_OVER_PLANNED',
    label: 'Réalisé supérieur au planifié',
    description: 'Le montant réel consolidé dépasse le montant planifié (expression de besoin).',
    severity: 'warning',
    tolerancePct: 0.05,
  },
  {
    code: 'BOQ_OVER_PROJECT_BUDGET',
    label: 'DQE supérieur au budget projet',
    description: 'Le montant réel consolidé dépasse le budget inscrit au projet.',
    severity: 'error',
    tolerancePct: 0.02,
  },
];

export const getBudgetRule = (code: string): BudgetConsistencyRule | undefined =>
  BUDGET_CONSISTENCY_RULES.find((r) => r.code === code);
