/**
 * useI18n — pont React entre LanguageContext et I18nService (métier).
 * Toute traduction de code technique passe par ce hook côté UI.
 */
import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getI18nService } from '@/application/services/I18nService';
import type { ReferentialLanguage } from '@/config/referentials/i18n/status-labels.referential';

export const useI18n = () => {
  const { language } = useLanguage();
  const lang = language as ReferentialLanguage;

  return useMemo(() => {
    const service = getI18nService();
    service.setLanguage(lang);

    return {
      language: lang,
      direction: service.getDirection(lang),
      translateStatus: (code?: string | null) => service.translateStatus(code, lang),
      translateProjectType: (code?: string | null) => service.translateProjectType(code, lang),
      translateUnit: (code?: string | null) => service.translateUnit(code, lang),
      translateTenderStep: (code?: string | null) => service.translateTenderStep(code, lang),
      translateInvoiceDocument: (code?: string | null) => service.translateInvoiceDocument(code, lang),
      translateRole: (code?: string | null) => service.translateRole(code, lang),
      translateDeviation: (code?: string | null) => service.translateDeviation(code, lang),
      translateCategory: (code?: string | null) => service.translateCategory(code, lang),
    };
  }, [lang]);
};
