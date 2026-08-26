/**
 * DocumentHeaderDTO — en-tête documentaire éditable avant génération PDF,
 * signature ou soumission (Factur-X / EN 16931).
 *
 * camelCase côté UI ; l'émetteur est alimenté depuis le contexte (organisation
 * connectée / projet) et les destinataires peuvent être multiples.
 */

export interface DocumentPartyDTO {
  /** Identifiant du référentiel d'origine (organisation / fournisseur / équipe). */
  id?: string | null;
  name: string;
  kind?: string | null;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface DocumentHeaderDTO {
  /** Référence documentaire (Réf. DQE / N° facture). */
  reference?: string | null;
  /** Date d'émission ISO (YYYY-MM-DD). */
  issueDate?: string | null;
  /** Devise ISO 4217 (MRU par défaut). */
  currency?: string | null;
  /** Validité de l'offre en jours. */
  validityDays?: number | null;
  /** TypeCode UNTDID 1001 (310 devis/commande, 380 facture). */
  facturxTypeCode?: string | null;
  sender: DocumentPartyDTO;
  recipients: DocumentPartyDTO[];
  notes?: string | null;
}

export interface DocumentHeaderIssueDTO {
  field: keyof DocumentHeaderDTO | 'vatRate';
  messageKey: string;
  fallback: string;
}

export interface DocumentHeaderValidationDTO {
  valid: boolean;
  issues: DocumentHeaderIssueDTO[];
}
