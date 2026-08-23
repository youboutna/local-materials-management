
import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';
import { AutocompleteOption } from '@/components/ui/autocomplete';
import { useLanguage } from '@/contexts/LanguageContext';

export type SortOption = 'newest' | 'oldest' | 'budget-high' | 'budget-low' | 'progress';

interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  regionFilter: string;
  onRegionChange: (region: string) => void;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  availableStatuses: string[];
  availableRegions: { code: string; name: string; nameAr: string }[];
  onReset: () => void;
  resultCount?: number;
  autocompleteOptions?: AutocompleteOption[];
  onAutocompleteSelect?: (option: AutocompleteOption) => void;
}

const ProjectFilters: React.FC<ProjectFiltersProps> = ({ 
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  statusFilter,
  onStatusChange,
  regionFilter,
  onRegionChange,
  sortOption,
  onSortChange,
  availableStatuses,
  availableRegions,
  onReset,
  resultCount,
  autocompleteOptions,
  onAutocompleteSelect
}) => {
  const { t } = useLanguage();
  const filters: FilterField[] = [
    {
      key: 'status',
      label: t('auto.projectfilters.statuts'),
      placeholder: t('auto.projectfilters.tous_les_statuts'),
      value: statusFilter,
      onChange: onStatusChange,
      options: [
        { value: 'all', label: t('auto.projectfilters.tous_les_statuts') },
        ...availableStatuses.map(status => ({ 
          value: status, 
          label: status.charAt(0).toUpperCase() + status.slice(1) 
        }))
      ]
    },
    {
      key: 'region',
      label: t('auto.projectfilters.regions'),
      placeholder: t('auto.projectfilters.toutes_les_regions'),
      value: regionFilter,
      onChange: onRegionChange,
      options: [
        { value: 'all', label: t('auto.projectfilters.toutes_les_regions') },
        ...availableRegions.map(region => ({ 
          value: region.code, 
          label: region.name 
        }))
      ]
    },
    {
      key: 'sort',
      label: t('auto.projectfilters.tri'),
      placeholder: t('auto.projectfilters.trier_par'),
      value: sortOption,
      onChange: (value) => onSortChange(value as SortOption),
      options: [
        { value: 'newest', label: t('auto.projectfilters.plus_recent') },
        { value: 'oldest', label: t('auto.projectfilters.plus_ancien') },
        { value: 'budget-high', label: t('auto.projectfilters.budget_eleve') },
        { value: 'budget-low', label: t('auto.projectfilters.budget_faible') },
        { value: 'progress', label: t('auto.projectfilters.progres') }
      ]
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      onSearchSubmit={onSearchSubmit}
      searchPlaceholder={t('auto.projectfilters.rechercher_projets')}
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
      autocompleteOptions={autocompleteOptions}
      onAutocompleteSelect={onAutocompleteSelect}
    />
  );
};

export default ProjectFilters;
