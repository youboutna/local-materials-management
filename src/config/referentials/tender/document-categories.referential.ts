/**
 * Tender Document Categories Referential
 * Source unique des catégories de pièces d'un appel d'offres (lots, soumissions).
 * Aligné sur l'enum DB `tender_document_category` (+ `other` pour les pièces libres).
 */

export type TenderDocumentCategoryCode = 'administrative' | 'technical' | 'financial' | 'other';

export interface TenderDocumentCategoryDefinition {
  value: TenderDocumentCategoryCode;
  label: string;
  /** Présent dans l'enum DB tender_document_category. */
  persistedInEnum: boolean;
}

export const TENDER_DOCUMENT_CATEGORIES: TenderDocumentCategoryDefinition[] = [
  { value: 'administrative', label: 'Administratif', persistedInEnum: true },
  { value: 'technical', label: 'Technique', persistedInEnum: true },
  { value: 'financial', label: 'Financier', persistedInEnum: true },
  { value: 'other', label: 'Autre', persistedInEnum: false },
];

export function getTenderDocumentCategoryLabel(code: string | null | undefined): string {
  if (!code) return '';
  return TENDER_DOCUMENT_CATEGORIES.find((c) => c.value === code)?.label ?? code;
}

/**
 * Pièces administratives requises pour la recevabilité d'une soumission.
 * Utilisé par le panneau d'évaluation (TenderEvaluationPanel) pour vérifier
 * la complétude du dossier administratif d'un soumissionnaire.
 */
export interface RequiredAdministrativeDocument {
  code: string;
  label: string;
}

export const TENDER_REQUIRED_ADMINISTRATIVE_DOCUMENTS: RequiredAdministrativeDocument[] = [
  { code: 'bid_bond', label: 'Garantie de soumission' },
  { code: 'tax_certificate', label: 'Attestation fiscale' },
  { code: 'social_certificate', label: 'Attestation de régularité sociale' },
  { code: 'trade_register', label: 'Copie du registre de commerce' },
  { code: 'signatory_power', label: 'Pouvoir du signataire' },
  { code: 'boq_estimate', label: 'Devis quantitatif estimatif' },
];
