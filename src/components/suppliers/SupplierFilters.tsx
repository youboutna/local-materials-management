import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { t } = useLanguage();
  const filters: FilterField[] = [
    {
      key: 'category',
      label: t('auto.supplierfilters.categories'),
      placeholder: t('auto.supplierfilters.toutes_les_categories'),
      value: categoryFilter,
      onChange: onCategoryChange,
      options: availableCategories.map(category => ({ value: category, label: category }))
    },
    {
      key: 'region',
      label: t('auto.supplierfilters.regions'),
      placeholder: t('auto.supplierfilters.toutes_les_regions'),
      value: regionFilter,
      onChange: onRegionChange,
      options: availableRegions.map(region => ({ value: region, label: region }))
    },
    {
      key: 'status',
      label: t('auto.supplierfilters.statuts'),
      placeholder: t('auto.supplierfilters.tous_les_statuts'),
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
      label: t('auto.supplierfilters.tri'),
      placeholder: t('auto.supplierfilters.trier_par'),
      value: sortOption,
      onChange: (value) => onSortChange(value as SupplierSortOption),
      options: [
        { value: 'name-asc', label: t('auto.supplierfilters.nom_a_z') },
        { value: 'name-desc', label: t('auto.supplierfilters.nom_z_a') },
        { value: 'newest', label: t('auto.supplierfilters.plus_recent') },
        { value: 'oldest', label: t('auto.supplierfilters.plus_ancien') },
        { value: 'rating', label: t('auto.supplierfilters.evaluation') }
      ]
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder={t('auto.supplierfilters.rechercher_des_fournisseurs')}
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
    />
  );
};

export default SupplierFilters;