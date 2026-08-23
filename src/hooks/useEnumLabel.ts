import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    getEnumLabel,
    getEnumOptions,
    type SupportedLang,
} from '@/config/referentials/i18n/enum-labels.referential';

/**
 * Accès aux libellés multilingues des ENUM techniques.
 *
 * Doctrine i18n : le code technique (ENUM / colonne base) n'est jamais traduit ;
 * seul le libellé affiché est résolu dans la langue courante via le référentiel.
 */
export const useEnumLabel = () => {
    const { language } = useLanguage();
    const lang = language as SupportedLang;

    /** Libellé d'un code ENUM dans la langue active (fallback fr, puis code brut). */
    const label = useCallback(
        (enumName: string, code: string | null | undefined) => getEnumLabel(enumName, code, lang),
        [lang]
    );

    /** Options `{ value, label }` prêtes pour un Select, triées par libellé. */
    const options = useCallback(
        (enumName: string) =>
            getEnumOptions(enumName, lang).sort((a, b) => a.label.localeCompare(b.label, lang)),
        [lang]
    );

    return { label, options, lang };
};
