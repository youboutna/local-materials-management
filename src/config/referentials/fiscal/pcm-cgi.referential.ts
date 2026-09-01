/**
 * Référentiel — Plan Comptable Mauritanien × Code Général des Impôts (bilingue).
 *
 * Source de vérité : `pcm-cgi-mauritanie.json` (550 comptes), issu du dépôt
 * public `hadratech/PCM_CGI_Mauritanie` (`PCM_CGI_Mauritanie_Bilingue.json`),
 * harmonisé avec la Loi de Finances Rectificative 2026.
 *
 * Chaque compte porte :
 *  - ses libellés fr/ar (doctrine i18n : code unique + libellés) ;
 *  - son état (BILAN / CPC / ANALYTIQUE) et sa nature ;
 *  - son niveau de risque fiscal ;
 *  - ses traitements par impôt (IS/IBAPP, TVA, IRCM, RAS, ITS, TA, IRF) avec
 *    articles CGI, qualification et conditions.
 *
 * Pure TS — aucune dépendance React / Supabase.
 */

import raw from './pcm-cgi-mauritanie.json';

export type PcmStatement = 'BILAN' | 'CPC' | 'ANALYTIQUE';
export type PcmRisk = 'faible' | 'moyen' | 'élevé';
export type PcmTaxCode = 'IS/IBAPP' | 'TVA' | 'IRCM' | 'RAS' | 'ITS' | 'TA' | 'IRF' | string;
export type PcmQualification =
  | 'Déductible'
  | 'Non déductible'
  | 'Conditionnelle'
  | 'Imposable'
  | 'Exonéré'
  | 'Neutre'
  | 'Collectée'
  | 'Dette'
  | string;

export interface PcmTaxTreatment {
  tax: PcmTaxCode;
  articles: string;
  qualification: PcmQualification;
  description: string;
  conditions: string[];
  alert: string;
}

export interface PcmCgiAccount {
  code: string;
  labelFr: string;
  labelAr: string;
  statement: PcmStatement;
  nature: string;
  offBalance: boolean;
  summary: string;
  risk: PcmRisk;
  parent: string | null;
  children: string[];
  treatments: PcmTaxTreatment[];
}

export const PCM_CGI_ACCOUNTS = raw as unknown as PcmCgiAccount[];

const BY_CODE = new Map(PCM_CGI_ACCOUNTS.map((a) => [a.code, a]));

/** Compte exact. */
export function getPcmCgiAccount(code?: string | null): PcmCgiAccount | undefined {
  if (!code) return undefined;
  return BY_CODE.get(String(code).trim());
}

/**
 * Compte le plus spécifique correspondant à un code : essai exact puis
 * remontée par troncature (« 60121 » → « 6012 » → « 601 » → « 60 »).
 */
export function resolvePcmCgiAccount(code?: string | null): PcmCgiAccount | undefined {
  const value = String(code ?? '').replace(/[^0-9]/g, '');
  if (!value) return undefined;
  for (let len = value.length; len >= 2; len -= 1) {
    const found = BY_CODE.get(value.slice(0, len));
    if (found) return found;
  }
  return undefined;
}

/** Libellé localisé d'un compte (fallback fr). */
export function getPcmCgiAccountLabel(code?: string | null, lang: 'fr' | 'ar' | 'en' = 'fr'): string | null {
  const account = resolvePcmCgiAccount(code);
  if (!account) return null;
  if (lang === 'ar') return account.labelAr || account.labelFr;
  return account.labelFr;
}

/** Traitement fiscal d'un compte pour un impôt donné. */
export function getPcmCgiTreatment(code?: string | null, tax: PcmTaxCode = 'TVA'): PcmTaxTreatment | undefined {
  return resolvePcmCgiAccount(code)?.treatments.find((t) => t.tax === tax);
}

/** Vrai si le compte est explicitement exonéré de TVA au CGI. */
export function isPcmVatExempt(code?: string | null): boolean {
  const treatment = getPcmCgiTreatment(code, 'TVA');
  return treatment?.qualification === 'Exonéré';
}

/** Charge non déductible / conditionnelle à l'IS — alerte de contrôle. */
export function getPcmDeductibilityFlag(
  code?: string | null,
): { qualification: PcmQualification; articles: string; alert: string } | null {
  const treatment = getPcmCgiTreatment(code, 'IS/IBAPP');
  if (!treatment) return null;
  return {
    qualification: treatment.qualification,
    articles: treatment.articles,
    alert: treatment.alert,
  };
}

/** Comptes à risque fiscal (pour tableaux de contrôle / alertes). */
export function listPcmAccountsByRisk(risk: PcmRisk): PcmCgiAccount[] {
  return PCM_CGI_ACCOUNTS.filter((a) => a.risk === risk);
}

/** Comptes d'un état comptable (sélecteurs d'imputation). */
export function listPcmAccountsByStatement(statement: PcmStatement): PcmCgiAccount[] {
  return PCM_CGI_ACCOUNTS.filter((a) => a.statement === statement);
}

export const PCM_CGI_REFERENCE = {
  code: 'MR_PCM_CGI_2026',
  labels: {
    fr: 'Plan Comptable Mauritanien × CGI (harmonisé LFR 2026)',
    ar: 'المخطط المحاسبي الموريتاني × المدونة العامة للضرائب',
    en: 'Mauritanian Chart of Accounts × Tax Code (2026)',
  },
  source: 'https://github.com/hadratech/PCM_CGI_Mauritanie',
  accountCount: PCM_CGI_ACCOUNTS.length,
} as const;
