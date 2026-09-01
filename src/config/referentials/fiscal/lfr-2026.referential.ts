/**
 * Référentiel — Loi de Finances Rectificative (LFR) 2026, Mauritanie.
 *
 * Source de vérité : dépôt public `hadratech/PCM_CGI_Mauritanie`
 * (`loi_de_finance_rect-LFR 2026 FR.pdf`, `PCM_CGI_Mauritanie_Harmonise-v3.json`,
 * `plan_comptable_mauritanie.csv`) — alignement PCM / CGI.
 *
 * Doctrine : aucun taux, seuil ou plafond n'est codé en dur dans l'UI ni dans
 * les services. Tout passe par ce référentiel, consommé par `TaxService`,
 * `SupplierNifValidationService` et les moteurs DQE / facture / contrat.
 *
 * Pure TS — aucune dépendance React / Supabase.
 */

/** Version du corpus fiscal appliqué (affichée pour traçabilité documentaire). */
export const FISCAL_REFERENCE = {
  code: 'MR_LFR_2026',
  labels: {
    fr: 'Loi de Finances Rectificative 2026 (Mauritanie)',
    ar: 'قانون المالية المعدل 2026 (موريتانيا)',
    en: 'Amended Finance Act 2026 (Mauritania)',
  },
  source: 'https://github.com/hadratech/PCM_CGI_Mauritanie',
  effectiveFrom: '2026-01-01',
  currency: 'MRU',
} as const;

/** Taxe sur les transactions électroniques : 0,1 % du montant, plafonnée. */
export const ELECTRONIC_TRANSACTION_TAX = {
  code: 'TTE_2026',
  labels: {
    fr: 'Taxe sur les transactions électroniques',
    ar: 'ضريبة على المعاملات الإلكترونية',
    en: 'Electronic transaction tax',
  },
  rate: 0.001,
  capAmount: 200,
  currency: 'MRU',
  legalBasis: 'LFR 2026 — taxe sur les transactions électroniques',
  /** Moyens de paiement assujettis. */
  appliesTo: ['mobile_money', 'virement', 'carte', 'electronique'] as const,
} as const;

/** Retenue sur commissions d'agents / distributeurs (services financiers digitaux). */
export const AGENT_COMMISSION_TAX = {
  code: 'RAS_COMMISSION_AGENT',
  labels: {
    fr: 'Retenue sur commissions d’agents',
    ar: 'خصم على عمولات الوكلاء',
    en: 'Withholding on agent commissions',
  },
  rate: 0.10,
  legalBasis: 'LFR 2026 — retenue à la source sur commissions',
} as const;

/**
 * Critères de localisation d'un service numérique (TVA due en Mauritanie).
 * Un seul critère suffit (faisceau d'indices).
 */
export const DIGITAL_SERVICE_LOCALIZATION_CRITERIA = [
  { code: 'IP', labels: { fr: 'Adresse IP en Mauritanie', ar: 'عنوان IP في موريتانيا', en: 'IP address in Mauritania' } },
  { code: 'PHONE', labels: { fr: 'Indicatif téléphonique mauritanien (+222)', ar: 'رمز هاتفي موريتاني', en: 'Mauritanian phone prefix (+222)' } },
  { code: 'BILLING_ADDRESS', labels: { fr: 'Adresse de facturation en Mauritanie', ar: 'عنوان الفاتورة في موريتانيا', en: 'Billing address in Mauritania' } },
  { code: 'PAYMENT_MEANS', labels: { fr: 'Moyen de paiement domicilié en Mauritanie', ar: 'وسيلة دفع محلية', en: 'Locally issued payment means' } },
] as const;

export type DigitalServiceCriterionCode =
  (typeof DIGITAL_SERVICE_LOCALIZATION_CRITERIA)[number]['code'];

/** Conditions de déductibilité d'une charge (LFR 2026 — traçabilité fiscale). */
export const DEDUCTIBILITY_RULES = {
  /** NIF du fournisseur obligatoire et actif pour déduire la charge et la TVA. */
  requireSupplierNif: true,
  nifMinLength: 8,
  nifMaxLength: 20,
  /** Au-delà de ce montant, un règlement en espèces n'est pas déductible. */
  cashPaymentDeductibleCeiling: 200000,
  /** Facture normalisée / électronique exigée au-delà de ce montant. */
  normalizedInvoiceThreshold: 500000,
  legalBasis: 'LFR 2026 — conditions de déductibilité et traçabilité',
} as const;

export type DeductibilityIssueCode =
  | 'MISSING_NIF'
  | 'INVALID_NIF'
  | 'INACTIVE_NIF'
  | 'CASH_ABOVE_CEILING'
  | 'MISSING_NORMALIZED_INVOICE';

export const DEDUCTIBILITY_ISSUE_LABELS: Record<DeductibilityIssueCode, { fr: string; ar: string; en: string }> = {
  MISSING_NIF: {
    fr: 'NIF du fournisseur manquant — charge non déductible',
    ar: 'الرقم الجبائي للمورد مفقود — العبء غير قابل للخصم',
    en: 'Missing supplier tax ID — expense not deductible',
  },
  INVALID_NIF: {
    fr: 'NIF du fournisseur au format invalide',
    ar: 'صيغة الرقم الجبائي غير صحيحة',
    en: 'Invalid supplier tax ID format',
  },
  INACTIVE_NIF: {
    fr: 'NIF du fournisseur inactif ou non vérifié',
    ar: 'الرقم الجبائي غير نشط أو غير مُتحقق منه',
    en: 'Supplier tax ID inactive or unverified',
  },
  CASH_ABOVE_CEILING: {
    fr: 'Règlement en espèces au-delà du plafond déductible',
    ar: 'دفع نقدي يتجاوز الحد القابل للخصم',
    en: 'Cash payment above the deductible ceiling',
  },
  MISSING_NORMALIZED_INVOICE: {
    fr: 'Facture normalisée / électronique requise pour ce montant',
    ar: 'فاتورة موحدة مطلوبة لهذا المبلغ',
    en: 'Normalized / electronic invoice required for this amount',
  },
};

export function getDeductibilityIssueLabel(
  code: DeductibilityIssueCode,
  lang: 'fr' | 'ar' | 'en' = 'fr',
): string {
  return DEDUCTIBILITY_ISSUE_LABELS[code][lang];
}
