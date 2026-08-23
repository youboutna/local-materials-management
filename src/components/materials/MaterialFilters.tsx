import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';
import { useLanguage } from '@/contexts/LanguageContext';

interface MaterialFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedLocalType: string;
  onLocalTypeChange: (value: string) => void;
  categories: string[];
  localTypes: string[];
  onReset: () => void;
  resultCount?: number;
}

const MaterialFilters: React.FC<MaterialFiltersProps> = ({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  selectedCategory,
  onCategoryChange,
  selectedLocalType,
  onLocalTypeChange,
  categories,
  localTypes,
  onReset,
  resultCount
}) => {
  const { t } = useLanguage();
  const filters: FilterField[] = [
    {
      key: 'category',
      label: 'Catégories',
      placeholder: 'Toutes les catégories',
      value: selectedCategory,
      onChange: onCategoryChange,
      options: categories.map(category => ({ value: category, label: category }))
    },
    {
      key: 'localType',
      label: 'Types locaux',
      placeholder: 'Tous les types',
      value: selectedLocalType,
      onChange: onLocalTypeChange,
      options: localTypes.map(type => ({ value: type, label: type }))
    }
  ];

  return (
    <ResponsiveFilters
      searchValue={searchTerm}
      onSearchChange={onSearchChange}
      onSearchSubmit={onSearchSubmit}
      searchPlaceholder={t('auto.materialfilters.rechercher_des_materiaux')}
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
    />
  );
};

export default MaterialFilters;