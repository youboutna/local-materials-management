/**
 * Phase 6.1 — rattrapage i18n (T36 → T41)
 * T-V-33 : glossaire métier (WBS explicité)
 * T-V-34 : codes ENUM PostgreSQL couverts
 * T-V-35 : parité de couverture fr / ar / en sur les clés d'interface ajoutées
 */
import { describe, expect, it } from 'vitest';
import { I18nService } from '@/application/services/I18nService';
import {
  GLOSSARY_LABELS,
  REFERENTIAL_LABEL_REGISTRY,
} from '@/config/referentials/i18n/status-labels.referential';
import { translations } from '@/contexts/LanguageContext';

const get = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);

describe('Phase 6.1 — rattrapage i18n', () => {
  it('T-V-33 : « WBS » n’est plus affiché brut, le glossaire l’explicite', () => {
    const svc = new I18nService('fr');
    expect(svc.translateTerm('wbs')).toBe('Structure de découpage des travaux');
    expect(svc.translateTerm('wbs_short')).toBe('Découpage des travaux');
    svc.setLanguage('en');
    expect(svc.translateTerm('wbs')).toBe('Work Breakdown Structure');
    svc.setLanguage('ar');
    expect(svc.translateTerm('wbs')).toBeTruthy();
    expect(svc.translateTerm('wbs')).not.toBe('wbs');
  });

  it('T-V-33b : tous les termes du glossaire sont complets (fr/ar/en)', () => {
    Object.entries(GLOSSARY_LABELS).forEach(([code, label]) => {
      expect(label.fr, `${code}.fr`).toBeTruthy();
      expect(label.ar, `${code}.ar`).toBeTruthy();
      expect(label.en, `${code}.en`).toBeTruthy();
    });
  });

  it('T-V-34 : les codes ENUM PostgreSQL affichés sont traduits', () => {
    const svc = new I18nService('fr');
    const enumCodes = ['draft', 'pending_review', 'approved', 'rejected', 'archived', 'submitted', 'under_review', 'returned', 'in_transit'];
    enumCodes.forEach((code) => {
      const label = svc.translateStatus(code);
      expect(label, code).toBeTruthy();
      expect(label, code).not.toBe(code);
    });
    expect(svc.translateRole('insurance_company')).not.toBe('insurance_company');
    expect(svc.translateDocumentType('inspection_report')).not.toBe('inspection_report');
  });

  it('T-V-34b : chaque dictionnaire du registre est complet (fr/ar/en)', () => {
    Object.entries(REFERENTIAL_LABEL_REGISTRY).forEach(([domain, dict]) => {
      Object.entries(dict).forEach(([code, label]) => {
        expect(label.fr, `${domain}.${code}.fr`).toBeTruthy();
        expect(label.ar, `${domain}.${code}.ar`).toBeTruthy();
        expect(label.en, `${domain}.${code}.en`).toBeTruthy();
      });
    });
  });

  it('T-V-35 : les clés d’interface complétées existent en fr, ar et en', () => {
    const sampled = [
      'common.refresh',
      'supplier_tender.tabs.browse',
      'tenders.supplierSecure.enter_code',
      'dashboard.management_tabs.alerts.critical',
      'bank_guarantee.notify_bank',
      'materials.documents.title',
      'projects.import.importMode',
      'inspection_monitoring.title',
      'users.created_success',
    ];
    (['fr', 'ar', 'en'] as const).forEach((lang) => {
      sampled.forEach((key) => {
        const value = get(translations[lang], key);
        expect(typeof value, `${lang}:${key}`).toBe('string');
        expect(value, `${lang}:${key}`).toBeTruthy();
      });
    });
  });
});
