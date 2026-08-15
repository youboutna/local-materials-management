// src/config/referentials/payment-origin.referential.ts

/**
 * Référentiel des origines de paiement
 * Définit les types d'origine, les statuts initiaux, les méthodes de paiement par défaut
 * Utilisé par le formulaire unifié de paiement et les hooks associés
 */

// ============================================================
// TYPES
// ============================================================

export type PaymentOriginKey = 'auto-post-inspection' | 'project' | 'supplier-portal' | 'manual';

export type PaymentRequestTypeKey = 'demande' | 'programme' | 'validation';

export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'blocked' | 'paid';

export interface PaymentOriginConfig {
  label: string;
  shortLabel: string;
  initialStatus: PaymentStatus;
  requestType: PaymentRequestTypeKey;
  defaultType: PaymentRequestTypeKey;   // ✅ Ajouté
  lockType?: boolean;                   // ✅ Ajouté (si on peut changer le type)
  submitLabel: string;                 // ✅ Ajouté
}

export interface PaymentMethodOption {
  value: string;
  label: string;
}

export interface PaymentRequestTypeInfo {
  key: PaymentRequestTypeKey;
  label: string;
  description: string;
  initialStatus: PaymentStatus;
}

// ============================================================
// CONSTANTES
// ============================================================

export const PAYMENT_ORIGINS: Record<PaymentOriginKey, PaymentOriginConfig> = {
  'auto-post-inspection': {
    label: 'Auto post-inspection',
    shortLabel: 'Auto',
    initialStatus: 'pending',
    requestType: 'validation',
    defaultType: 'validation',
    lockType: true,
    submitLabel: 'Confirmer la demande',
  },
  'project': {
    label: 'Projet',
    shortLabel: 'Projet',
    initialStatus: 'pending',
    requestType: 'programme',
    defaultType: 'programme',
    lockType: false,
    submitLabel: 'Programmer le paiement',
  },
  'supplier-portal': {
    label: 'Portail fournisseur',
    shortLabel: 'Fournisseur',
    initialStatus: 'pending',
    requestType: 'demande',
    defaultType: 'demande',
    lockType: true,
    submitLabel: 'Soumettre ma demande',
  },
  'manual': {
    label: 'Manuel',
    shortLabel: 'Manuel',
    initialStatus: 'pending',
    requestType: 'demande',
    defaultType: 'demande',
    lockType: false,
    submitLabel: 'Enregistrer la demande',
  },
};

export const PAYMENT_STATUSES: Record<PaymentStatus, string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  blocked: 'Bloqué',
  paid: 'Payé',
};

// ✅ PAYMENT_REQUEST_TYPES est maintenant un tableau (pour .map())
export const PAYMENT_REQUEST_TYPES: PaymentRequestTypeInfo[] = [
  {
    key: 'demande',
    label: 'Demande',
    description: 'Soumettre une demande de paiement (statut initial : En attente)',
    initialStatus: 'pending',
  },
  {
    key: 'programme',
    label: 'Programmé',
    description: 'Paiement programmé (statut initial : En attente)',
    initialStatus: 'pending',
  },
  {
    key: 'validation',
    label: 'Validation',
    description: 'Validation de paiement (statut initial : En attente)',
    initialStatus: 'pending',
  },
];

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'check', label: 'Chèque' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'cash', label: 'Espèces' },
  { value: 'card', label: 'Carte bancaire' },
];

export const PAYMENT_DEFAULT_LEAD_TIME_DAYS: number = 7;

// ============================================================
// FONCTIONS
// ============================================================

export function getPaymentOrigin(origin: PaymentOriginKey): PaymentOriginConfig | undefined {
  return PAYMENT_ORIGINS[origin];
}

/**
 * Retourne le type de demande par défaut pour une origine
 */
export function getDefaultRequestType(origin: PaymentOriginKey): PaymentRequestTypeKey {
  return PAYMENT_ORIGINS[origin]?.defaultType || 'demande';
}

/**
 * Retourne les informations complètes d’un type de demande
 */
export function getPaymentRequestType(typeKey: PaymentRequestTypeKey): PaymentRequestTypeInfo | undefined {
  return PAYMENT_REQUEST_TYPES.find((t) => t.key === typeKey);
}

/**
 * Retourne le statut initial pour une origine donnée
 */
export function getInitialStatusForOrigin(origin: PaymentOriginKey): PaymentStatus {
  return PAYMENT_ORIGINS[origin]?.initialStatus || 'pending';
}

/**
 * Retourne la méthode de paiement par défaut
 */
export function getDefaultPaymentMethod(): string {
  return 'bank_transfer';
}

/**
 * Retourne le délai de livraison par défaut (en jours)
 */
export function getDefaultDeliveryDelay(): number {
  return PAYMENT_DEFAULT_LEAD_TIME_DAYS;
}

// ============================================================
// EXPORT PAR DÉFAUT
// ============================================================

export default {
  PAYMENT_ORIGINS,
  PAYMENT_STATUSES,
  PAYMENT_REQUEST_TYPES,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_DEFAULT_LEAD_TIME_DAYS,
  getPaymentOrigin,
  getDefaultRequestType,
  getPaymentRequestType,
  getInitialStatusForOrigin,
  getDefaultPaymentMethod,
  getDefaultDeliveryDelay,
};