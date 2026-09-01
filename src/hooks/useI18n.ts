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
import { getGeoLocationLabelService, type GeoResolvableInput } from '@/application/services/geo/GeoLocationLabelService';
import type { GeoAdminLevel } from '@/config/referentials/geo/mauritania-geo.referential';

export const useI18n = () => {
  const { language, setLanguage, t } = useLanguage();
  const lang = language as ReferentialLanguage;

  return useMemo(() => {
    const service = getI18nService();
    const geoService = getGeoLocationLabelService();
    service.setLanguage(lang);

    /** Locale BCP-47 dérivée de la langue UI courante (jamais figée sur fr-FR). */
    const locale = lang === 'ar' ? 'ar-MR' : lang === 'en' ? 'en-GB' : 'fr-FR';
    const toDate = (value: Date | string | number | null | undefined): Date | null => {
      if (value === null || value === undefined || value === '') return null;
      const date = value instanceof Date ? value : new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    return {
      language: lang,
      locale,
      setLanguage,
      t,
      direction: service.getDirection(lang),
      formatDate: (value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) => {
        const date = toDate(value);
        return date ? date.toLocaleDateString(locale, options) : '—';
      },
      formatDateTime: (value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) => {
        const date = toDate(value);
        return date ? date.toLocaleString(locale, options) : '—';
      },
      formatTime: (value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) => {
        const date = toDate(value);
        return date ? date.toLocaleTimeString(locale, options) : '—';
      },
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

      // ── Géographie (référentiel Mauritanie : codes techniques uniques) ──
      translateGeo: (code?: string | null) => geoService.translate(code, lang),
      translateGeoLevel: (level: GeoAdminLevel) => geoService.translateLevel(level, lang),
      geoRegionOptions: () => geoService.listRegionOptions(lang),
      geoCityOptions: (regionCode?: string | null) => geoService.listCityOptions(regionCode, lang),
      geoRegionOptionsFrom: (inputs: (GeoResolvableInput | null | undefined)[]) =>
        geoService.listRegionOptionsFrom(inputs, lang),
      resolveRegionCode: (input?: GeoResolvableInput | null) => geoService.resolveRegionCode(input),
      resolveCityCode: (input?: GeoResolvableInput | null) => geoService.resolveCityCode(input),
      matchesRegion: (input: GeoResolvableInput | null | undefined, regionCode: string) =>
        geoService.matchesRegion(input, regionCode),
      formatLocationLabel: (input?: GeoResolvableInput | null) => geoService.formatLocationLabel(input, lang),
    };
    // `t` et `setLanguage` sont recréés à chaque rendu du provider : la langue
    // suffit comme clé de mémoïsation (les fonctions restent fonctionnellement stables).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);
};

