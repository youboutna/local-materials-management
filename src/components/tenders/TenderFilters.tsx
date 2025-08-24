import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';

export type TenderSortOption = 'newest' | 'oldest' | 'deadline' | 'budget-high' | 'budget-low';

interface TenderFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  marketTypeFilter: string;
  onMarketTypeChange: (type: string) => void;
  sortOption: TenderSortOption;
  onSortChange: (sort: TenderSortOption) => void;
  availableStatuses: string[];
  availableMarketTypes: string[];
  onReset: () => void;
  resultCount?: number;
}

const TenderFilters: React.FC<TenderFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  marketTypeFilter,
  onMarketTypeChange,
  sortOption,
  onSortChange,
  availableStatuses,
  availableMarketTypes,
  onReset,
  resultCount
}) => {
  const filters: FilterField[] = [
    {
      key: 'status',
      label: 'Statuts',
      placeholder: 'Tous les statuts',
      value: statusFilter,
      onChange: onStatusChange,
      options: availableStatuses.map(status => ({ 
        value: status, 
        label: status === 'draft' ? 'Brouillon' :
               status === 'published' ? 'Publié' :
               status === 'closed' ? 'Fermé' :
               status === 'awarded' ? 'Attribué' : status
      }))
    },
    {
      key: 'marketType',
      label: 'Types de marché',
      placeholder: 'Tous les types',
      value: marketTypeFilter,
      onChange: onMarketTypeChange,
      options: availableMarketTypes.map(type => ({ value: type, label: type }))
    },
    {
      key: 'sort',
      label: 'Tri',
      placeholder: 'Trier par...',
      value: sortOption,
      onChange: (value) => onSortChange(value as TenderSortOption),
      options: [
        { value: 'newest', label: 'Plus récent' },
        { value: 'oldest', label: 'Plus ancien' },
        { value: 'deadline', label: 'Échéance proche' },
        { value: 'budget-high', label: 'Budget élevé' },
        { value: 'budget-low', label: 'Budget faible' }
      ]
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Rechercher des appels d'offres..."
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
    />
  );
};

export default TenderFilters;