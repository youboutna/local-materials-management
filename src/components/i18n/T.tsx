import { useLanguage } from '@/contexts/LanguageContext';

interface TProps {
    /** Clé i18n (namespace `auto.*` pour les libellés issus du codemod Phase 6). */
    k: string;
    /** Repli affiché si la clé est absente du registre. */
    fallback?: string;
}

/**
 * Rendu réactif d'un libellé traduit sans nécessiter de hook dans le composant appelant.
 * Le `fallback` est transmis à `t()` : il prime sur l'« humanisation » de la clé
 * technique, ce qui évite les libellés parasites du type « InitialBudget ».
 */
export const T = ({ k, fallback }: TProps) => {
    const { t } = useLanguage();
    const value = t(k, undefined, fallback);
    if (!value || value === k) return <>{fallback ?? ''}</>;
    return <>{value}</>;
};

export default T;
