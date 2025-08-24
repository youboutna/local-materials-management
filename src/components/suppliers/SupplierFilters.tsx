import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';

export type SupplierSortOption = 'name-asc' | 'name-desc' | 'newest' | 'oldest' | 'rating';

interface SupplierFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categoryFilter: string;
  onCategoryChange: (category: string) => void;
  regionFilter: string;
  onRegionChange: (region: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  sortOption: SupplierSortOption;
  onSortChange: (sort: SupplierSortOption) => void;
  availableCategories: string[];
  availableRegions: string[];
  availableStatuses: string[];
  onReset: () => void;
  resultCount?: number;
}

const SupplierFilters: React.FC<SupplierFiltersProps> = ({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  regionFilter,
  onRegionChange,
  statusFilter,
  onStatusChange,
  sortOption,
  onSortChange,
  availableCategories,
  availableRegions,
  availableStatuses,
  onReset,
  resultCount
}) => {
  const filters: FilterField[] = [
    {
      key: 'category',
      label: 'Catégories',
      placeholder: 'Toutes les catégories',
      value: categoryFilter,
      onChange: onCategoryChange,
      options: availableCategories.map(category => ({ value: category, label: category }))
    },
    {
      key: 'region',
      label: 'Régions',
      placeholder: 'Toutes les régions',
      value: regionFilter,
      onChange: onRegionChange,
      options: availableRegions.map(region => ({ value: region, label: region }))
    },
    {
      key: 'status',
      label: 'Statuts',
      placeholder: 'Tous les statuts',
      value: statusFilter,
      onChange: onStatusChange,
      options: availableStatuses.map(status => ({ 
        value: status, 
        label: status === 'active' ? 'Actif' :
               status === 'inactive' ? 'Inactif' :
               status === 'pending' ? 'En attente' :
               status === 'blocked' ? 'Bloqué' : status
      }))
    },
    {
      key: 'sort',
      label: 'Tri',
      placeholder: 'Trier par...',
      value: sortOption,
      onChange: (value) => onSortChange(value as SupplierSortOption),
      options: [
        { value: 'name-asc', label: 'Nom (A-Z)' },
        { value: 'name-desc', label: 'Nom (Z-A)' },
        { value: 'newest', label: 'Plus récent' },
        { value: 'oldest', label: 'Plus ancien' },
        { value: 'rating', label: 'Évaluation' }
      ]
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Rechercher des fournisseurs..."
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
    />
  );
};

export default SupplierFilters;