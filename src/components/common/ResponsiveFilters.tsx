/**
 * ResponsiveFilters
 * Façade historique conservée pour toutes les listes (projets, matériaux, employés,
 * inspections, fournisseurs, appels d'offres, documents…). L'implémentation délègue
 * désormais à `CompactFilterBar` : une seule barre compacte, sticky et responsive,
 * afin que les résultats restent visibles sans scroller.
 *
 * Couche présentation uniquement.
 */

import React, { ReactNode, useMemo } from 'react';
import CompactFilterBar, { CompactFilterField } from '@/components/common/CompactFilterBar';
import { AutocompleteOption } from '@/components/ui/autocomplete';

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterField {
  key: string;
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  /** Repousse ce filtre dans le tiroir « Avancé » */
  advanced?: boolean;
}

export interface ResponsiveFiltersProps {
  title?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: () => void;
  searchPlaceholder?: string;
  filters: FilterField[];
  onReset: () => void;
  resultCount?: number;
  totalCount?: number;
  className?: string;
  /** Conservé pour compatibilité : le tiroir mobile est désormais toujours disponible */
  showMobileDropdown?: boolean;
  autocompleteOptions?: AutocompleteOption[];
  onAutocompleteSelect?: (option: AutocompleteOption) => void;
  /** Contrôles additionnels (sliders, plages…) rendus dans le tiroir « Avancé » */
  advancedContent?: ReactNode;
  advancedActiveCount?: number;
  /** Contrôles rendus sur la même ligne que les filtres */
  inlineExtra?: ReactNode;
  trailing?: ReactNode;
  sticky?: boolean;
  /** Recherche/pagination en cours (skeleton + indicateur). */
  isLoading?: boolean;
  onGoToFirstResult?: () => void;
  presetsKey?: string;
  syncUrl?: boolean;
  urlNamespace?: string;
}


const ResponsiveFilters: React.FC<ResponsiveFiltersProps> = ({
  title,
  searchValue = '',
  onSearchChange,
  onSearchSubmit,
  searchPlaceholder,
  filters,
  onReset,
  resultCount,
  totalCount,
  className,
  autocompleteOptions,
  onAutocompleteSelect,
  advancedContent,
  advancedActiveCount,
  inlineExtra,
  trailing,
  sticky = true,
}) => {
  const compactFilters = useMemo<CompactFilterField[]>(
    () =>
      filters.map((filter) => ({
        key: filter.key,
        label: filter.label,
        placeholder: filter.placeholder,
        value: filter.value,
        onChange: filter.onChange,
        options: filter.options,
        allLabel: filter.placeholder,
        advanced: filter.advanced,
      })),
    [filters],
  );

  return (
    <CompactFilterBar
      title={title}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      onSearchSubmit={onSearchSubmit}
      searchPlaceholder={searchPlaceholder}
      filters={compactFilters}
      onReset={onReset}
      resultCount={resultCount}
      totalCount={totalCount}
      className={className}
      autocompleteOptions={autocompleteOptions}
      onAutocompleteSelect={onAutocompleteSelect}
      advancedContent={advancedContent}
      advancedActiveCount={advancedActiveCount}
      inlineExtra={inlineExtra}
      trailing={trailing}
      sticky={sticky}
    />
  );
};

export default ResponsiveFilters;
