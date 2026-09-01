/**
 * ListToolbar
 * Barre d'outils partagée (recherche libre + filtres d'expiration) pour les listes
 * contractuelles : Garanties bancaires, Assurances.
 * Implémentation déléguée à `CompactFilterBar` pour un comportement identique
 * (compact, sticky, responsive) sur toutes les pages de recherche.
 *
 * Couche présentation uniquement : le filtrage s'applique aux données déjà chargées.
 */

import { ReactNode, useMemo } from 'react';
import CompactFilterBar, { CompactFilterField } from '@/components/common/CompactFilterBar';
import { ExpiryFilter } from '@/lib/expiryUx';
import { useLanguage } from '@/contexts/LanguageContext';

const EXPIRY_VALUES: { value: ExpiryFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'auto.listtoolbar.tous' },
  { value: 'active', labelKey: 'auto.listtoolbar.actifs' },
  { value: 'expiring', labelKey: 'auto.listtoolbar.expire_bientot' },
  { value: 'expired', labelKey: 'auto.listtoolbar.expires' },
];

interface ListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  expiryFilter?: ExpiryFilter;
  onExpiryFilterChange?: (value: ExpiryFilter) => void;
  /** Filtres additionnels (Select de type, etc.) rendus sur la même ligne */
  children?: ReactNode;
  resultCount?: number;
  onReset?: () => void;
  className?: string;
}

export function ListToolbar({
  search,
  onSearchChange,
  searchPlaceholder,
  expiryFilter,
  onExpiryFilterChange,
  children,
  resultCount,
  onReset,
  className,
}: ListToolbarProps) {
  const { t } = useLanguage();

  const filters = useMemo<CompactFilterField[]>(() => {
    if (!expiryFilter || !onExpiryFilterChange) return [];
    return [
      {
        key: 'expiry',
        label: t('auto.listtoolbar.expires'),
        placeholder: t('auto.listtoolbar.tous'),
        value: expiryFilter,
        onChange: (value) => onExpiryFilterChange(value as ExpiryFilter),
        options: EXPIRY_VALUES.map((f) => ({ value: f.value, label: t(f.labelKey) })),
      },
    ];
  }, [expiryFilter, onExpiryFilterChange, t]);

  return (
    <CompactFilterBar
      className={className ? `mb-3 ${className}` : 'mb-3'}
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      filters={filters}
      inlineExtra={children}
      resultCount={resultCount}
      onReset={
        onReset ??
        (() => {
          onSearchChange('');
          onExpiryFilterChange?.('all');
        })
      }
    />
  );
}

export default ListToolbar;
