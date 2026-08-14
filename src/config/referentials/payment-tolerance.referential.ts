/**
 * Payment tolerance referential
 * Ratio applied to the progress-based allowed payment amount to compute
 * the maximum tolerated payment amount (business rule, not a magic number).
 */
export const PAYMENT_TOLERANCE_RATIO = 1.5;

/**
 * Seuils de contrôle des paiements (présentation + surveillance).
 * Centralisés ici pour éviter tout seuil codé en dur dans l'UI.
 */
export interface PaymentControlThreshold {
  key: string;
  label: string;
  days: number;
  tone: 'info' | 'warning' | 'high' | 'critical';
  description: string;
}

export const PAYMENT_CONTROL_THRESHOLDS: PaymentControlThreshold[] = [
  {
    key: 'missing_document',
    label: 'Document manquant',
    days: 15,
    tone: 'info',
    description: 'Pièce justificative absente depuis 15 jours ou plus',
  },
  {
    key: 'payment_delay',
    label: 'Retard de paiement',
    days: 30,
    tone: 'warning',
    description: 'Paiement non validé 30 jours après la date prévue',
  },
  {
    key: 'insurance_expired',
    label: 'Assurance expirée',
    days: 0,
    tone: 'high',
    description: 'Blocage immédiat dès expiration de la couverture',
  },
  {
    key: 'auto_block',
    label: 'Blocage automatique',
    days: 45,
    tone: 'critical',
    description: 'Blocage automatique du paiement au-delà de 45 jours',
  },
];
