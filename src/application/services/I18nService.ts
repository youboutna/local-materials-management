/**
 * I18nService — service de traduction métier (TypeScript pur, sans React).
 *
 * Traduit les codes techniques du Domain (statuts, types, unités, étapes)
 * en libellés affichables, exclusivement à partir des référentiels de labels.
 * Le français est la langue par défaut et le fallback.
 */

import {
  ReferentialLabel,
  ReferentialLabelDomain,
  ReferentialLanguage,
  resolveReferentialLabel,
} from '@/config/referentials/i18n/status-labels.referential';

const STORAGE_KEY = 'preferred-language';
const SUPPORTED: ReferentialLanguage[] = ['fr', 'ar', 'en'];

export class I18nService {
  private currentLanguage: ReferentialLanguage = 'fr';

  constructor(initial?: ReferentialLanguage) {
    if (initial && SUPPORTED.includes(initial)) {
      this.currentLanguage = initial;
      return;
    }
    const stored = this.readStoredLanguage();
    if (stored) this.currentLanguage = stored;
  }

  private readStoredLanguage(): ReferentialLanguage | null {
    try {
      const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
      return raw && SUPPORTED.includes(raw as ReferentialLanguage)
        ? (raw as ReferentialLanguage)
        : null;
    } catch {
      return null;
    }
  }

  setLanguage(lang: ReferentialLanguage): void {
    if (!SUPPORTED.includes(lang)) return;
    this.currentLanguage = lang;
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, lang);
    } catch {
      /* stockage indisponible : la langue reste en mémoire */
    }
  }

  getLanguage(): ReferentialLanguage {
    return this.currentLanguage;
  }

  /** Direction du texte (RTL pour l'arabe). */
  getDirection(lang: ReferentialLanguage = this.currentLanguage): 'ltr' | 'rtl' {
    return lang === 'ar' ? 'rtl' : 'ltr';
  }

  /** Traduit un label multilingue déjà résolu. */
  translate(label: ReferentialLabel, lang: ReferentialLanguage = this.currentLanguage): string {
    return label[lang] || label.fr;
  }

  private resolve(domain: ReferentialLabelDomain, code?: string | null, lang?: ReferentialLanguage) {
    return resolveReferentialLabel(domain, code, lang ?? this.currentLanguage);
  }

  translateStatus(code?: string | null, lang?: ReferentialLanguage): string {
    return this.resolve('status', code, lang);
  }

  translateProjectType(code?: string | null, lang?: ReferentialLanguage): string {
    return this.resolve('projectType', code, lang);
  }

  translateUnit(code?: string | null, lang?: ReferentialLanguage): string {
    return this.resolve('unit', code, lang);
  }

  translateTenderStep(code?: string | null, lang?: ReferentialLanguage): string {
    return this.resolve('tenderStep', code, lang);
  }

  translateInvoiceDocument(code?: string | null, lang?: ReferentialLanguage): string {
    return this.resolve('invoiceDocument', code, lang);
  }

  translateRole(code?: string | null, lang?: ReferentialLanguage): string {
    return this.resolve('role', code, lang);
  }

  translateDeviation(code?: string | null, lang?: ReferentialLanguage): string {
    return this.resolve('deviation', code, lang);
  }

  translateCategory(code?: string | null, lang?: ReferentialLanguage): string {
    return this.resolve('category', code, lang);
  }
}

let instance: I18nService | null = null;

export const getI18nService = (): I18nService => {
  if (!instance) instance = new I18nService();
  return instance;
};

export const i18nService = getI18nService();
