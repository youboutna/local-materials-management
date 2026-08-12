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
