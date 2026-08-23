import { describe, it, expect } from 'vitest';
import { resolveReferentialLabel } from '@/config/referentials/i18n/status-labels.referential';
import { resolveAnyEnumLabel, ENUM_LABELS } from '@/config/referentials/i18n/enum-labels.referential';

describe('Filet de sécurité ENUM sur les libellés UI', () => {
  it('résout un code ENUM inconnu du domaine via le référentiel des ENUM', () => {
    // `principal_contractor` n'appartient pas au domaine `status`
    const fr = resolveReferentialLabel('status', 'principal_contractor', 'fr');
    expect(fr).not.toBe('principal_contractor');
    expect(fr.length).toBeGreaterThan(0);
  });

  it('fournit les trois langues pour tout code indexé', () => {
    const codes = Object.values(ENUM_LABELS).flatMap((map) => Object.keys(map)).slice(0, 50);
    codes.forEach((code) => {
      (['fr', 'ar', 'en'] as const).forEach((lang) => {
        expect(resolveAnyEnumLabel(code, lang)).toBeTruthy();
      });
    });
  });

  it('retourne null pour un code hors référentiel (pas de faux positif)', () => {
    expect(resolveAnyEnumLabel('code_totalement_inconnu_xyz')).toBeNull();
    expect(resolveAnyEnumLabel(null)).toBeNull();
  });
});
