/**
 * Phase 5 — validation multilingue (T-V-19 → T-V-25)
 */
import { describe, expect, it } from 'vitest';
import { I18nService } from '@/application/services/I18nService';
import {
  STATUS_LABELS,
  TENDER_STEP_LABELS,
  PROJECT_TYPE_LABELS,
  UNIT_LABELS,
  resolveReferentialLabel,
} from '@/config/referentials/i18n/status-labels.referential';

const svc = () => new I18nService('fr');

describe('Phase 5 — I18nService', () => {
  it('T-V-19 : bascule français → arabe sur les statuts', () => {
    const s = svc();
    expect(s.translateStatus('validated')).toBe('Validé');
    s.setLanguage('ar');
    expect(s.getLanguage()).toBe('ar');
    expect(s.translateStatus('validated')).toBe('تم التحقق');
    expect(s.getDirection()).toBe('rtl');
  });

  it('T-V-20 : bascule français → anglais', () => {
    const s = svc();
    s.setLanguage('en');
    expect(s.translateStatus('open')).toBe('Open for bids');
    expect(s.translateStatus('paid')).toBe('Paid');
    expect(s.getDirection()).toBe('ltr');
  });

  it('T-V-21 : statuts du workflow DQE → Facture traduits', () => {
    const s = svc();
    const chain = ['draft', 'validated', 'submitted', 'accepted', 'signed', 'requested', 'emitted', 'paid'];
    expect(chain.map((c) => s.translateStatus(c))).toEqual([
      'Brouillon', 'Validé', 'Soumis', 'Accepté', 'Signé', 'Demandé', 'Émise', 'Payée',
    ]);
    s.setLanguage('ar');
    chain.forEach((c) => expect(s.translateStatus(c)).not.toBe(c));
  });

  it('T-V-22 : étapes des appels d’offres traduites', () => {
    const s = svc();
    expect(s.translateTenderStep('framework_lots')).toBe('Cadre & Lots');
    s.setLanguage('en');
    expect(s.translateTenderStep('attribution')).toBe('Award');
    expect(s.translateStatus('under_evaluation')).toBe('Under evaluation');
  });

  it('T-V-23 : types de projets traduits', () => {
    const s = svc();
    expect(s.translateProjectType('electrical')).toBe('Électrique');
    s.setLanguage('ar');
    expect(s.translateProjectType('infrastructure')).toBe('بنية تحتية');
  });

  it('T-V-24 : unités de mesure traduites', () => {
    const s = svc();
    expect(s.translateUnit('m³')).toBe('m³ (volume)');
    s.setLanguage('en');
    expect(s.translateUnit('jour')).toBe('day (man-day)');
  });

  it('T-V-25 : non-régression — fallback français et codes inconnus', () => {
    const s = svc();
    // Statut legacy normalisé
    expect(s.translateStatus('En Cours')).toBe('En cours');
    expect(s.translateStatus('en_cours_v2')).toBe('En cours');
    // Code inconnu : renvoyé tel quel, jamais vide
    expect(s.translateStatus('code_inexistant')).toBe('code_inexistant');
    expect(s.translateStatus(null)).toBe('');
    // Fallback fr quand une langue manque
    expect(resolveReferentialLabel('status', 'draft', 'fr')).toBe('Brouillon');
  });

  it('tous les labels des référentiels sont complets (fr/ar/en)', () => {
    const dictionaries = [STATUS_LABELS, TENDER_STEP_LABELS, PROJECT_TYPE_LABELS, UNIT_LABELS];
    dictionaries.forEach((dict) => {
      Object.entries(dict).forEach(([code, label]) => {
        expect(label.fr, `${code}.fr`).toBeTruthy();
        expect(label.ar, `${code}.ar`).toBeTruthy();
        expect(label.en, `${code}.en`).toBeTruthy();
      });
    });
  });
});
