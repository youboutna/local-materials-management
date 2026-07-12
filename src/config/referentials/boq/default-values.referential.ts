/**
 * Default numeric values applied when a dimension is missing from the source
 * document (PDF/Excel/CSV). Kept minimal & conservative so imports do not
 * silently invent quantities.
 *
 * Fiscal profile: shared across parsers, manual metering, DQE planification
 * and tender estimator so HT / TVA / TTC / retenues are computed identically
 * everywhere. Mauritania defaults (2024/2025 practice).
 */

export const BOQ_DEFAULT_VALUES = {
  height: 0,
  width: 0,
  length: 0,
  quantity: 0,
  unitPrice: 0,
} as const;

export interface BoqFiscalProfile {
  code: string;
  label: string;
  currency: string;
  vatRate: number;           // 0.16 = 16%
  withholdingRate: number;   // RAS BIC applied on HT
  corporateTaxRate: number;  // IS applied on marché (informative)
  marginRate: number;        // marge par défaut sur devis
}

export const BOQ_FISCAL_PROFILES: Record<string, BoqFiscalProfile> = {
  MR_STANDARD: {
    code: 'MR_STANDARD',
    label: 'Mauritanie – Standard',
    currency: 'MRU',
    vatRate: 0.16,
    withholdingRate: 0.03,
    corporateTaxRate: 0.025,
    marginRate: 0.10,
  },
  MR_EXEMPT: {
    code: 'MR_EXEMPT',
    label: 'Mauritanie – Exonéré',
    currency: 'MRU',
    vatRate: 0,
    withholdingRate: 0,
    corporateTaxRate: 0,
    marginRate: 0.10,
  },
};

export const DEFAULT_FISCAL_PROFILE: BoqFiscalProfile = BOQ_FISCAL_PROFILES.MR_STANDARD;

export function getFiscalProfile(code?: string | null): BoqFiscalProfile {
  if (!code) return DEFAULT_FISCAL_PROFILE;
  return BOQ_FISCAL_PROFILES[code] ?? DEFAULT_FISCAL_PROFILE;
}
