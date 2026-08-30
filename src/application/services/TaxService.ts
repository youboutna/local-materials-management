/**
 * TaxService — fiscalité TVA/RAS **ligne à ligne** (DQE, devis, contrat, facture).
 *
 * Doctrine : la TVA n'est jamais globale. Elle est résolue par ligne suivant un
 * ordre de priorité strict, tous les niveaux venant de référentiels :
 *   1. Taux saisi manuellement sur la ligne (`vatRate`) — l'utilisateur reste maître.
 *   2. Compte du Plan Comptable Mauritanien (`accountCode` → `PCM_ACCOUNT_TAXES`).
 *   3. Régime de prestation explicite (`taxRegimeCode` → `TAX_REGIMES`).
 *   4. Rattachement par mots-clés (nature de ressource, catégorie DQE, désignation).
 *   5. Profil fiscal du document / pays (dernier recours).
 *
 * Pure TS : aucune dépendance React / Supabase (règle hexagonale).
 */

import {
  resolveLineTax,
  resolveTaxRegime,
  TAX_REGIMES,
  type ResolvedLineTax,
  type TaxRegimeDefinition,
  type VatCategoryCode,
} from '@/config/referentials/boq/tax-regimes.referential';
import {
  resolvePcmAccount,
  PCM_ACCOUNT_TAXES,
  type PcmAccountTax,
} from '@/config/referentials/boq/pcm-accounts.referential';

/** Entrée minimale exploitable par le service (DQE, devis, contrat, facture). */
export interface TaxableLine {
  designation?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  fees?: number | null;
  totalHt?: number | null;
  vatRate?: number | null;
  rasRate?: number | null;
  /** Compte comptable PCM imputé (ex. « 601 », « 7012 »). */
  accountCode?: string | null;
  /** Régime de prestation explicite (référentiel TAX_REGIMES). */
  taxRegimeCode?: string | null;
  resourceType?: string | null;
  category?: string | null;
  elementType?: string | null;
}

export interface LineTaxResult extends ResolvedLineTax {
  /** Source de la décision fiscale (traçabilité / affichage UI). */
  origin: 'manual' | 'account' | 'regime' | 'keywords' | 'profile';
  accountCode: string | null;
  accountLabel: string | null;
  totalHt: number;
  vatAmount: number;
  rasAmount: number;
  totalTtc: number;
}

export interface FiscalProfileHints {
  vatRate?: number;
  withholdingRate?: number;
}

const round2 = (n: number): number => Math.round((Number(n) || 0) * 100) / 100;

/** Normalise un taux : 16 → 0.16, 0.16 → 0.16. */
export function normalizeRate(raw: number | null | undefined): number | null {
  if (raw == null || Number.isNaN(Number(raw))) return null;
  const value = Number(raw);
  if (value < 0) return 0;
  return value > 1 ? value / 100 : value;
}

export function computeLineHt(line: TaxableLine): number {
  if (line.totalHt != null && Number(line.totalHt) !== 0) return Number(line.totalHt);
  const qty = Number(line.quantity ?? 0);
  const pu = Number(line.unitPrice ?? 0);
  return qty * pu + Number(line.fees ?? 0);
}

export class TaxService {
  /** Régimes de prestation proposés à l'utilisateur (sélecteur UI). */
  static listRegimes(): TaxRegimeDefinition[] {
    return TAX_REGIMES;
  }

  /** Comptes PCM porteurs d'un régime de TVA (sélecteur d'imputation). */
  static listAccounts(group?: 'ACHAT' | 'VENTE'): PcmAccountTax[] {
    return group ? PCM_ACCOUNT_TAXES.filter((a) => a.taxGroup === group) : PCM_ACCOUNT_TAXES;
  }

  /** Régime de prestation d'une ligne (référentiel TAX_REGIMES). */
  static detectTaxRegime(line: TaxableLine): TaxRegimeDefinition {
    return resolveTaxRegime({
      taxRegimeCode: line.taxRegimeCode ?? null,
      resourceType: line.resourceType ?? null,
      category: line.category ?? null,
      elementType: line.elementType ?? null,
      designation: line.designation ?? null,
    });
  }

  /** Compte PCM imputé (correspondance exacte puis préfixe le plus long). */
  static detectAccount(line: TaxableLine): PcmAccountTax | null {
    return resolvePcmAccount(line.accountCode);
  }

  /**
   * Résout la fiscalité effective d'une ligne et valorise HT / TVA / RAS / TTC.
   * `profile` porte les taux du document (pays / marché) en dernier recours.
   */
  static resolve(
    line: TaxableLine,
    profile?: FiscalProfileHints | null,
    lang: 'fr' | 'ar' | 'en' = 'fr',
  ): LineTaxResult {
    const account = this.detectAccount(line);
    const manualVat = normalizeRate(line.vatRate);
    const regime = this.detectTaxRegime(line);

    // Priorité : saisie manuelle > compte PCM > régime explicite > mots-clés > profil.
    let vatRate: number;
    let vatCategoryCode: VatCategoryCode;
    let origin: LineTaxResult['origin'];

    if (manualVat != null) {
      vatRate = manualVat;
      vatCategoryCode = manualVat > 0 ? 'S' : regime.vatCategoryCode === 'S' ? 'Z' : regime.vatCategoryCode;
      origin = 'manual';
    } else if (account) {
      vatRate = account.vatRate;
      vatCategoryCode = account.vatCategoryCode;
      origin = 'account';
    } else {
      const base = resolveLineTax(
        {
          taxRegimeCode: line.taxRegimeCode ?? null,
          resourceType: line.resourceType ?? null,
          category: line.category ?? null,
          elementType: line.elementType ?? null,
          designation: line.designation ?? null,
          vatRate: null,
          rasRate: null,
        },
        profile ?? null,
        lang,
      );
      vatRate = base.vatRate;
      vatCategoryCode = base.vatCategoryCode;
      origin = line.taxRegimeCode ? 'regime' : base.vatRate === profile?.vatRate ? 'profile' : 'keywords';
    }

    const rasRate = normalizeRate(line.rasRate) ?? regime.withholdingRate ?? profile?.withholdingRate ?? 0;
    const totalHt = computeLineHt(line);
    const vatAmount = round2(totalHt * vatRate);
    const rasAmount = round2(totalHt * rasRate);

    return {
      regimeCode: regime.code,
      regimeLabel: regime.labels[lang],
      vatRate,
      rasRate,
      vatCategoryCode,
      exemptionReason: vatCategoryCode === 'S' ? undefined : regime.exemptionReason?.[lang],
      origin,
      accountCode: account?.code ?? null,
      accountLabel: account ? (lang === 'ar' ? account.labelAr || account.labelFr : account.labelFr) : null,
      totalHt: round2(totalHt),
      vatAmount,
      rasAmount,
      totalTtc: round2(totalHt + vatAmount),
    };
  }

  /**
   * Applique la fiscalité résolue sur une ligne et renvoie une copie enrichie
   * (`vatRate`, `rasRate`, `taxRegimeCode`, `accountCode`, `totalHt`).
   * Idempotent : une ligne déjà taxée conserve son taux.
   */
  static applyTax<T extends TaxableLine>(line: T, profile?: FiscalProfileHints | null): T & {
    vatRate: number;
    rasRate: number;
    taxRegimeCode: string;
    accountCode: string | null;
    totalHt: number;
  } {
    const tax = this.resolve(line, profile);
    return {
      ...line,
      vatRate: tax.vatRate,
      rasRate: tax.rasRate,
      taxRegimeCode: line.taxRegimeCode ?? tax.regimeCode,
      accountCode: line.accountCode ?? tax.accountCode,
      totalHt: tax.totalHt,
    };
  }

  /** Applique la fiscalité sur un lot de lignes (import DQE, attribution contrat). */
  static applyTaxToLines<T extends TaxableLine>(lines: T[], profile?: FiscalProfileHints | null) {
    return lines.map((l) => this.applyTax(l, profile));
  }

  /** Totaux multi-taux d'un document (HT, TVA, RAS, TTC + ventilation par taux). */
  static summarize(lines: TaxableLine[], profile?: FiscalProfileHints | null) {
    const resolved = lines.map((l) => this.resolve(l, profile));
    const byRate = new Map<string, { vatRate: number; vatCategoryCode: VatCategoryCode; basisAmount: number; taxAmount: number }>();
    for (const r of resolved) {
      const key = `${r.vatCategoryCode}:${r.vatRate.toFixed(4)}`;
      const cur = byRate.get(key) ?? { vatRate: r.vatRate, vatCategoryCode: r.vatCategoryCode, basisAmount: 0, taxAmount: 0 };
      cur.basisAmount = round2(cur.basisAmount + r.totalHt);
      cur.taxAmount = round2(cur.taxAmount + r.vatAmount);
      byRate.set(key, cur);
    }
    const totalHt = round2(resolved.reduce((s, r) => s + r.totalHt, 0));
    const totalVat = round2(resolved.reduce((s, r) => s + r.vatAmount, 0));
    const totalRas = round2(resolved.reduce((s, r) => s + r.rasAmount, 0));
    return {
      totalHt,
      totalVat,
      totalRas,
      totalTtc: round2(totalHt + totalVat),
      netToPay: round2(totalHt + totalVat - totalRas),
      buckets: [...byRate.values()].sort((a, b) => b.vatRate - a.vatRate),
      lines: resolved,
    };
  }
}

export const getTaxService = () => TaxService;
