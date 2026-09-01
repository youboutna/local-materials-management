/**
 * SupplierNifValidationService — validation du NIF fournisseur et contrôle de
 * déductibilité d'une charge au sens de la LFR 2026 (Mauritanie).
 *
 * Doctrine : les seuils, plafonds et libellés proviennent exclusivement du
 * référentiel `lfr-2026.referential.ts`. Pure TS — aucune dépendance
 * React / Supabase (règle hexagonale).
 */

import {
  DEDUCTIBILITY_RULES,
  getCashDeductibleCeiling,
  getDeductibilityIssueLabel,
  type DeductibilityIssueCode,
} from '@/config/referentials/fiscal/lfr-2026.referential';

export type NifStatus = 'active' | 'inactive' | 'unknown';

export interface NifValidationResult {
  valid: boolean;
  normalized: string | null;
  issue: DeductibilityIssueCode | null;
  message: string | null;
}

export interface DeductibilityInput {
  supplierNif?: string | null;
  supplierNifStatus?: NifStatus | null;
  /** Montant TTC du règlement (MRU). */
  amount?: number | null;
  /** Moyen de paiement (`especes`, `virement`, `mobile_money`, `cheque`…). */
  paymentMethod?: string | null;
  /** Vrai si une facture normalisée / électronique est rattachée. */
  hasNormalizedInvoice?: boolean | null;
  /** Secteur d'activité (plafond espèces dérogatoire, ex. `HALIEUTIQUE_EXPORT`). */
  sectorCode?: string | null;
}

export interface DeductibilityResult {
  deductible: boolean;
  issues: Array<{ code: DeductibilityIssueCode; message: string }>;
}

const NIF_ALLOWED = /^[A-Z0-9]+$/;

export class SupplierNifValidationService {
  /** Normalise un NIF : majuscules, sans espaces ni séparateurs. */
  static normalize(raw: string | null | undefined): string | null {
    const value = String(raw ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    return value.length ? value : null;
  }

  /** Validation de forme (longueur et alphabet) selon le référentiel LFR 2026. */
  static validate(
    raw: string | null | undefined,
    status: NifStatus = 'unknown',
    lang: 'fr' | 'ar' | 'en' = 'fr',
  ): NifValidationResult {
    const normalized = this.normalize(raw);
    if (!normalized) {
      return {
        valid: false,
        normalized: null,
        issue: 'MISSING_NIF',
        message: getDeductibilityIssueLabel('MISSING_NIF', lang),
      };
    }
    const tooShort = normalized.length < DEDUCTIBILITY_RULES.nifMinLength;
    const tooLong = normalized.length > DEDUCTIBILITY_RULES.nifMaxLength;
    if (tooShort || tooLong || !NIF_ALLOWED.test(normalized)) {
      return {
        valid: false,
        normalized,
        issue: 'INVALID_NIF',
        message: getDeductibilityIssueLabel('INVALID_NIF', lang),
      };
    }
    if (status === 'inactive') {
      return {
        valid: false,
        normalized,
        issue: 'INACTIVE_NIF',
        message: getDeductibilityIssueLabel('INACTIVE_NIF', lang),
      };
    }
    return { valid: true, normalized, issue: null, message: null };
  }

  /**
   * Contrôle de déductibilité d'une charge : NIF actif, plafond espèces et
   * facture normalisée au-delà du seuil.
   */
  static checkDeductibility(
    input: DeductibilityInput,
    lang: 'fr' | 'ar' | 'en' = 'fr',
  ): DeductibilityResult {
    const issues: DeductibilityResult['issues'] = [];

    if (DEDUCTIBILITY_RULES.requireSupplierNif) {
      const nif = this.validate(input.supplierNif, input.supplierNifStatus ?? 'unknown', lang);
      if (!nif.valid && nif.issue) issues.push({ code: nif.issue, message: nif.message! });
    }

    const amount = Number(input.amount ?? 0);
    const method = String(input.paymentMethod ?? '').toLowerCase();
    const isCash = method.includes('espece') || method.includes('cash') || method.includes('numeraire');
    const cashCeiling = getCashDeductibleCeiling(input.sectorCode);
    if (isCash && amount > cashCeiling) {
      issues.push({
        code: 'CASH_ABOVE_CEILING',
        message: getDeductibilityIssueLabel('CASH_ABOVE_CEILING', lang),
      });
    }

    if (
      amount >= DEDUCTIBILITY_RULES.normalizedInvoiceThreshold &&
      input.hasNormalizedInvoice === false
    ) {
      issues.push({
        code: 'MISSING_NORMALIZED_INVOICE',
        message: getDeductibilityIssueLabel('MISSING_NORMALIZED_INVOICE', lang),
      });
    }

    return { deductible: issues.length === 0, issues };
  }
}

export const getSupplierNifValidationService = () => SupplierNifValidationService;
