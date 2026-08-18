/**
 * EdbValidationDTO — rapport de validation d'une Expression de Besoin (EDB / DQE)
 * produit AVANT toute écriture en base. Le validateur (chef de projet /
 * responsable financier) doit trancher explicitement sur les écarts budgétaires.
 */

export type EdbValidationStatus =
  | 'READY'
  | 'AWAITING_VALIDATOR_DECISION'
  | 'BLOCKED_BY_ERRORS';

/** Décision du validateur sur l'écart budget projet ↔ total DQE. */
export type EdbBudgetDecision =
  /** A — réévaluer le budget du projet pour absorber l'écart. */
  | 'ADJUST_PROJECT_BUDGET'
  /** B — réduire le DQE au budget restant (répartition proportionnelle). */
  | 'ADJUST_DQE'
  /** C — conserver l'écart, alerte permanente. */
  | 'KEEP_DISCREPANCY';

export interface EdbLineError {
  /** Lot / phase d'origine dans l'EDB. */
  lotId: string | null;
  designation: string;
  unit: string | null;
  quantity: number | null;
  unitPrice: number | null;
  /** Montant déclaré dans le fichier. */
  declaredTotal: number;
  /** Montant recalculé (quantité × PU). */
  computedTotal: number;
  message: string;
  /** Correction proposée : unité forfaitaire, quantité 1, PU = montant déclaré. */
  suggestedFix: { unit: string; quantity: number; unitPrice: number };
}

export interface EdbWarning {
  code: 'BUDGET_DISCREPANCY' | 'PHASE_OUT_OF_WINDOW' | 'PHASE_BUDGET_MISMATCH' | 'INFO';
  message: string;
}

export interface EdbBudgetDiscrepancy {
  /** Reste à réaliser déclaré côté projet. */
  projectBudget: number;
  /** Total des postes DQE (lots). */
  dqeTotal: number;
  /** dqeTotal - projectBudget. */
  difference: number;
  /** |difference| / projectBudget × 100 (2 décimales). */
  percentage: number;
}

export interface EdbValidationReport {
  status: EdbValidationStatus;
  errors: EdbLineError[];
  warnings: EdbWarning[];
  budgetDiscrepancy: EdbBudgetDiscrepancy | null;
  /** Totaux utiles à l'affichage. */
  totals: { lines: number; dqeTotal: number; lotsRemaining: number };
}
