/**
 * Référentiel « Origine & cycle de vie des demandes de paiement ».
 * Centralise les points d'entrée (auto inspection, projet, portail fournisseur, manuel),
 * les types de demande et leur statut initial, ainsi que les méthodes de paiement.
 * Aucun libellé ni seuil ne doit être codé en dur dans l'UI.
 */

export type PaymentOriginKey = 'auto_inspection' | 'project' | 'supplier_portal' | 'manual';

export interface PaymentOriginDef {
  key: PaymentOriginKey;
  label: string;
  shortLabel: string;
  description: string;
  /** Type de paiement proposé par défaut */
  defaultType: PaymentRequestTypeKey;
  /** Le type est-il verrouillé pour ce point d'entrée ? */
  lockType: boolean;
  /** Libellé du bouton principal */
  submitLabel: string;
}

export type PaymentRequestTypeKey = 'demande' | 'programme' | 'validation';

export interface PaymentRequestTypeDef {
  key: PaymentRequestTypeKey;
  label: string;
  description: string;
  /** Statut applicatif initial (mappé sur les statuts existants du DTO) */
  initialStatus: 'pending' | 'approved' | 'processed';
}

export const PAYMENT_ORIGINS: Record<PaymentOriginKey, PaymentOriginDef> = {
  auto_inspection: {
    key: 'auto_inspection',
    label: 'Automatique – post-inspection',
    shortLabel: 'Auto',
    description: 'Demande pré-remplie à partir d’une inspection validée.',
    defaultType: 'demande',
    lockType: true,
    submitLabel: 'Confirmer la demande',
  },
  project: {
    key: 'project',
    label: 'Gestionnaire – page projet',
    shortLabel: 'Projet',
    description: 'Saisie par le chef de projet depuis le détail du projet.',
    defaultType: 'demande',
    lockType: false,
    submitLabel: 'Enregistrer la demande',
  },
  supplier_portal: {
    key: 'supplier_portal',
    label: 'Portail fournisseur',
    shortLabel: 'Portail',
    description: 'Demande soumise par le contractant depuis son espace.',
    defaultType: 'demande',
    lockType: true,
    submitLabel: 'Soumettre ma demande',
  },
  manual: {
    key: 'manual',
    label: 'Saisie manuelle',
    shortLabel: 'Manuel',
    description: 'Création depuis la page Contrôle des Paiements.',
    defaultType: 'demande',
    lockType: false,
    submitLabel: 'Enregistrer le paiement',
  },
};

export const PAYMENT_REQUEST_TYPES: PaymentRequestTypeDef[] = [
  {
    key: 'demande',
    label: 'Demande',
    description: 'Soumise pour validation par le gestionnaire.',
    initialStatus: 'pending',
  },
  {
    key: 'programme',
    label: 'Programmé',
    description: 'Demande acceptée et programmée à une date prévue.',
    initialStatus: 'approved',
  },
  {
    key: 'validation',
    label: 'Validation',
    description: 'Paiement validé par le responsable financier.',
    initialStatus: 'processed',
  },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'mobile', label: 'Mobile Money' },
  { value: 'especes', label: 'Espèces' },
] as const;

/** Délai de livraison par défaut (jours) lorsqu'un paiement est lié à une livraison. */
export const PAYMENT_DEFAULT_LEAD_TIME_DAYS = 7;

export function getPaymentOrigin(key: PaymentOriginKey): PaymentOriginDef {
  return PAYMENT_ORIGINS[key] ?? PAYMENT_ORIGINS.manual;
}

export function getPaymentRequestType(key: PaymentRequestTypeKey): PaymentRequestTypeDef {
  return PAYMENT_REQUEST_TYPES.find((t) => t.key === key) ?? PAYMENT_REQUEST_TYPES[0];
}
