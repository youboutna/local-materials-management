
import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';
import { AutocompleteOption } from '@/components/ui/autocomplete';

export type SortOption = 'newest' | 'oldest' | 'budget-high' | 'budget-low' | 'progress';

interface ProjectFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
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
  const filters: FilterField[] = [
    {
      key: 'status',
      label: 'Statuts',
      placeholder: 'Tous les statuts',
      value: statusFilter,
      onChange: onStatusChange,
      options: [
        { value: 'all', label: 'Tous les statuts' },
        ...availableStatuses.map(status => ({ 
          value: status, 
          label: status.charAt(0).toUpperCase() + status.slice(1) 
        }))
      ]
    },
    {
      key: 'region',
      label: 'Régions',
      placeholder: 'Toutes les régions',
      value: regionFilter,
      onChange: onRegionChange,
      options: [
        { value: 'all', label: 'Toutes les régions' },
        ...availableRegions.map(region => ({ 
          value: region.code, 
          label: region.name 
        }))
      ]
    },
    {
      key: 'sort',
      label: 'Tri',
      placeholder: 'Trier par...',
      value: sortOption,
      onChange: (value) => onSortChange(value as SortOption),
      options: [
        { value: 'newest', label: 'Plus récent' },
        { value: 'oldest', label: 'Plus ancien' },
        { value: 'budget-high', label: 'Budget élevé' },
        { value: 'budget-low', label: 'Budget faible' },
        { value: 'progress', label: 'Progrès' }
      ]
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Rechercher projets..."
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
      autocompleteOptions={autocompleteOptions}
      onAutocompleteSelect={onAutocompleteSelect}
    />
  );
};

export default ProjectFilters;
