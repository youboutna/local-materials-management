import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package } from 'lucide-react';

interface InteractiveMaterialFiltersProps {
  searchTerm: string;
  selectedCategory: string;
  selectedRegion: string;
  selectedStockLevel: string;
  categories: string[];
  regions: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onStockLevelChange: (value: string) => void;
  onReset: () => void;
  materialCount: number;
  gpsCount: number;
}

const InteractiveMaterialFilters: React.FC<InteractiveMaterialFiltersProps> = ({
  searchTerm,
  selectedCategory,
  selectedRegion,
  selectedStockLevel,
  categories,
  regions,
  onSearchChange,
  onCategoryChange,
  onRegionChange,
  onStockLevelChange,
  onReset,
  materialCount,
  gpsCount
}) => {
  const filters: FilterField[] = [
    {
      key: 'category',
      label: 'Catégorie',
      placeholder: 'Toutes les catégories',
      value: selectedCategory,
      onChange: onCategoryChange,
      options: categories.map(category => ({ value: category, label: category }))
    },
    {
      key: 'region',
      label: 'Région',
      placeholder: 'Toutes les régions',
      value: selectedRegion,
      onChange: onRegionChange,
      options: regions.map(region => ({ value: region, label: region }))
    },
    {
      key: 'stockLevel',
      label: 'Niveau de Stock',
      placeholder: 'Tous les niveaux',
      value: selectedStockLevel,
      onChange: onStockLevelChange,
      options: [
        { value: 'high', label: 'Stock Élevé' },
        { value: 'medium', label: 'Stock Moyen' },
        { value: 'low', label: 'Stock Faible' },
        { value: 'out', label: 'Rupture de Stock' }
      ]
    }
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Package className="h-3 w-3" />
          {materialCount} matériaux
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {gpsCount} géolocalisés
        </Badge>
      </div>
      
      <ResponsiveFilters
        searchValue={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder="Recherche fulltext: nom, description, catégorie, région, type..."
        filters={filters}
        onReset={onReset}
        resultCount={materialCount}
      />
    </div>
  );
};

export default InteractiveMaterialFilters;