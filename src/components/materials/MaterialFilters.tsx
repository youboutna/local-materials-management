import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';

interface MaterialFiltersProps {
  searchTerm: string;
  selectedCategory: string;
  selectedLocalType: string;
  categories: string[];
  localTypes: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onLocalTypeChange: (value: string) => void;
  onReset: () => void;
  resultCount?: number;
}

const MaterialFilters: React.FC<MaterialFiltersProps> = ({
  searchTerm,
  selectedCategory,
  selectedLocalType,
  categories,
  localTypes,
  onSearchChange,
  onCategoryChange,
  onLocalTypeChange,
  onReset,
  resultCount
}) => {
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
      searchPlaceholder="Rechercher des matériaux..."
      filters={filters}
      onReset={onReset}
      resultCount={resultCount}
    />
  );
};

export default MaterialFilters;