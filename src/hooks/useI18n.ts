/**
 * useI18n — pont React entre LanguageContext et I18nService (métier).
 * Toute traduction de code technique passe par ce hook côté UI.
 *
 * Expose également `t` (clés d'interface de LanguageContext) afin qu'un seul
 * hook suffise pour traduire à la fois les codes métier et les libellés UI.
 */
import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getI18nService } from '@/application/services/I18nService';
import type { ReferentialLanguage } from '@/config/referentials/i18n/status-labels.referential';

export const useI18n = () => {
  const { language, setLanguage, t } = useLanguage();
  const lang = language as ReferentialLanguage;

  return useMemo(() => {
    const service = getI18nService();
    service.setLanguage(lang);

    return {
      language: lang,
      setLanguage,
      t,
      direction: service.getDirection(lang),
      translateStatus: (code?: string | null) => service.translateStatus(code, lang),
      translateProjectType: (code?: string | null) => service.translateProjectType(code, lang),
      translateUnit: (code?: string | null) => service.translateUnit(code, lang),
      translateTenderStep: (code?: string | null) => service.translateTenderStep(code, lang),
      translateInvoiceDocument: (code?: string | null) => service.translateInvoiceDocument(code, lang),
      translateRole: (code?: string | null) => service.translateRole(code, lang),
      translateDeviation: (code?: string | null) => service.translateDeviation(code, lang),
      translateCategory: (code?: string | null) => service.translateCategory(code, lang),
      translatePriority: (code?: string | null) => service.translatePriority(code, lang),
      translateSeverity: (code?: string | null) => service.translateSeverity(code, lang),
      translateDocumentType: (code?: string | null) => service.translateDocumentType(code, lang),
      translateDepartment: (code?: string | null) => service.translateDepartment(code, lang),
      translateTerm: (code?: string | null) => service.translateTerm(code, lang),
    };
    // `t` et `setLanguage` sont recréés à chaque rendu du provider : la langue
    // suffit comme clé de mémoïsation (les fonctions restent fonctionnellement stables).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);
};

