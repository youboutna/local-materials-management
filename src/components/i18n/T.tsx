import { useLanguage } from '@/contexts/LanguageContext';

interface TProps {
    /** Clé i18n (namespace `auto.*` pour les libellés issus du codemod Phase 6). */
    k: string;
    /** Repli affiché si la clé est absente du registre. */
    fallback?: string;
}

/**
 * Rendu réactif d'un libellé traduit sans nécessiter de hook dans le composant appelant.
 * Utilisé par le codemod Phase 6 pour remplacer les chaînes en clair des noeuds JSX.
 */
export const T = ({ k, fallback }: TProps) => {
    const { t } = useLanguage();
    const value = t(k);
    if (!value || value === k) return <>{fallback ?? ''}</>;
    return <>{value}</>;
};

export default T;
