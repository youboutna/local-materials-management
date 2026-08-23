/**
 * Phase 6 — Branchement des traductions sur les pages (T-V-26 → T-V-32).
 *
 * Valide que les badges partagés affichent des libellés issus des
 * référentiels multilingues et réagissent au changement de langue.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import {
  TranslatedStatus,
  TranslatedPriority,
  TranslatedCategory,
  TranslatedUnit,
  TranslatedRole,
  TranslatedSeverity,
  TranslatedDocumentType,
} from '@/components/i18n/TranslatedBadges';
import { getI18nService } from '@/application/services/I18nService';
import { getStatusLabel } from '@/utils/phaseHelpers';

const Switcher = () => {
  const { setLanguage } = useLanguage();
  (globalThis as Record<string, unknown>).__setLang = setLanguage;
  return null;
};

const renderWithLanguage = (ui: React.ReactNode) =>
  render(
    <LanguageProvider>
      <Switcher />
      {ui}
    </LanguageProvider>
  );

const switchLanguage = async (lang: 'fr' | 'ar' | 'en') => {
  const setLanguage = (globalThis as Record<string, unknown>).__setLang as (l: string) => void;
  await act(async () => setLanguage(lang));
};

describe('Phase 6 — branchement des traductions', () => {
  beforeEach(() => {
    globalThis.localStorage?.clear();
    getI18nService().setLanguage('fr');
  });

  it('T-V-26 — statuts projet affichés en français par défaut', () => {
    renderWithLanguage(<TranslatedStatus code="en_cours_v2" />);
    expect(screen.getByText('En cours')).toBeTruthy();
  });

  it('T-V-27 — statuts projet affichés en arabe après changement de langue', async () => {
    renderWithLanguage(<TranslatedStatus code="en_cours_v2" />);
    await switchLanguage('ar');
    expect(screen.getByText('جاري العمل')).toBeTruthy();
    expect(getI18nService().getDirection('ar')).toBe('rtl');
  });

  it('T-V-28 — statuts projet affichés en anglais', async () => {
    renderWithLanguage(<TranslatedStatus code="termine_v2" />);
    await switchLanguage('en');
    expect(screen.getByText('Completed')).toBeTruthy();
  });

  it('T-V-29 — KPI et alertes du dashboard traduits (sévérités et types)', () => {
    renderWithLanguage(
      <>
        <span><TranslatedSeverity code="critical" /></span>
        <span><TranslatedDocumentType code="budget" /></span>
      </>
    );
    expect(screen.getByText('Critique')).toBeTruthy();
    expect(screen.getByText('Budget')).toBeTruthy();
  });

  it('T-V-30 — labels de phases, tâches et ressources traduits', () => {
    renderWithLanguage(
      <>
        <span><TranslatedStatus code="not_started" /></span>
        <span><TranslatedPriority code="high" /></span>
        <span><TranslatedCategory code="technical" /></span>
        <span><TranslatedUnit code="m³" /></span>
        <span><TranslatedRole code="manager" /></span>
      </>
    );
    expect(screen.getByText('Non commencé')).toBeTruthy();
    expect(screen.getByText('Élevée')).toBeTruthy();
    expect(screen.getByText('Technique')).toBeTruthy();
    expect(screen.getByText('m³ (volume)')).toBeTruthy();
    expect(screen.getByText('Chef de projet')).toBeTruthy();
  });

  it('T-V-31 — changement de langue dynamique sans rechargement', async () => {
    renderWithLanguage(<TranslatedPriority code="high" />);
    expect(screen.getByText('Élevée')).toBeTruthy();
    await switchLanguage('en');
    expect(screen.getByText('High')).toBeTruthy();
    await switchLanguage('fr');
    expect(screen.getByText('Élevée')).toBeTruthy();
  });

  it('T-V-32 — non-régression : helpers de phase délèguent au référentiel', () => {
    getI18nService().setLanguage('fr');
    expect(getStatusLabel('in_progress')).toBe('En cours');
    expect(getStatusLabel('delayed')).toBe('En retard');
    expect(getStatusLabel('code_inconnu')).toBe('code_inconnu');
  });
});
