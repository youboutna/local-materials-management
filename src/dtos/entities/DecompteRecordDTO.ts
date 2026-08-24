/**
 * DecompteRecordDTO — DOCTRINE MÉTIER (Dépensé vs Décompte vs Paiement)
 *
 *  1. DQE       → expression de besoin (prévisionnel, NON dépensé)
 *  2. Devis     → proposition prestataire (engagement)
 *  3. Contrat   → engagement formel signé
 *  4. Décompte  → FACTURE ACCEPTÉE (validée / payée) ⇒ **dépensé réel**
 *  5. Paiement  → transaction réelle (date, montant, référence) ⇒ réconciliation
 *
 * Règle unique : `dépensé = Σ décomptes validés` ; `payé = Σ paiements rattachés`.
 * Les lignes DQE, devis et tâches ne participent JAMAIS au dépensé.
 */

/** Statut canonique d'un décompte (facture acceptée). */
export type DecompteStatus =
  | 'draft'
  | 'submitted'
  | 'validated'
  | 'paid'
  | 'rejected';

/** Statuts DB (btp.progress_invoices.status) considérés comme validés. */
export const DECOMPTE_VALIDATED_DB_STATUSES = [
  'validated',
  'approved',
  'ministry_validated',
  'consultant_validated',
  'donor_approved',
  'payment_processing',
  'paid',
] as const;

/** Statuts DB considérés comme réellement payés. */
export const DECOMPTE_PAID_DB_STATUSES = ['paid'] as const;

export interface DecompteRecordDTO {
  id: string;
  /** Numéro du décompte (D-2026-001) — dérivé du numéro de facture si absent. */
  decompteNumber: string;
  /** Numéro de la facture financière rattachée (F-2026-001). */
  invoiceNumber: string | null;
  projectId: string | null;
  phaseId: string | null;
  status: DecompteStatus;
  /** Statut brut en base (traçabilité workflow). */
  rawStatus: string | null;
  /** Montant facturé. */
  amount: number;
  /** Montant validé (retenue de garantie déduite). */
  validatedAmount: number;
  /** Montant effectivement payé (transactions rattachées). */
  paidAmount: number;
  retentionAmount: number;
  progressPercentage: number;
  workDescription: string | null;
  invoiceDocumentId: string | null;
  submittedAt: string | null;
  paidAt: string | null;
  createdAt: string | null;
}

/** Transaction réelle rattachée à un décompte. */
export interface DecomptePaymentDTO {
  id: string;
  decompteId: string | null;
  phaseId: string | null;
  projectId: string | null;
  invoiceNumber: string | null;
  amount: number;
  paymentDate: string | null;
  paymentMethod: string | null;
  transactionId: string | null;
  receiverName: string | null;
}

/** Synthèse financière canonique d'un projet ou d'une phase. */
export interface DecompteFinancialSummaryDTO {
  /** Budget initial (projet ou phase). */
  initialBudget: number;
  /** Dépensé = Σ décomptes validés (doctrine). */
  decomptedValidated: number;
  /** Payé = Σ paiements rattachés / décomptes soldés. */
  paid: number;
  /** Reste à payer = décomptes validés − payé. */
  remainingToPay: number;
  /** Reste au budget = budget − décomptés validés. */
  budgetRemaining: number;
  /** Engagé prévisionnel (DQE / ressources) — jamais compté comme dépensé. */
  engaged: number;
  /** Nombre de décomptes validés. */
  validatedCount: number;
  /** Nombre de décomptes en attente de validation. */
  pendingCount: number;
  currency: string;
}

export const isDecompteValidated = (d: DecompteRecordDTO): boolean =>
  d.status === 'validated' || d.status === 'paid';

export const isDecomptePaid = (d: DecompteRecordDTO): boolean => d.status === 'paid';
