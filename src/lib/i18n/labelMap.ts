/**
 * Traduit une table `code technique -> clé i18n` en `code technique -> libellé affiché`.
 * Le code reste l'unique valeur persistée : seul le libellé est localisé (doctrine UI-only).
 */
export const translateLabelMap = <K extends string>(
    keys: Record<K, string>,
    t: (key: string) => string,
): Record<K, string> =>
    Object.fromEntries(Object.entries(keys).map(([code, key]) => [code, t(key as string)])) as Record<K, string>;
