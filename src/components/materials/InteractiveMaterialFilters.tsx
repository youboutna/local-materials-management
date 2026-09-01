import React from 'react';
import ResponsiveFilters, { FilterField } from '@/components/common/ResponsiveFilters';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useI18n } from '@/hooks/useI18n';

interface InteractiveMaterialFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedRegion: string;
  onRegionChange: (value: string) => void;
  selectedStockLevel: string;
  onStockLevelChange: (value: string) => void;
  categories: string[];
  regions: string[];
  onReset: () => void;
  materialCount: number;
  gpsCount: number;
}

const InteractiveMaterialFilters: React.FC<InteractiveMaterialFiltersProps> = ({
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  selectedCategory,
  onCategoryChange,
  selectedRegion,
  onRegionChange,
  selectedStockLevel,
  onStockLevelChange,
  categories,
  regions,
  onReset,
  materialCount,
  gpsCount
}) => {
  const { t } = useLanguage();
  // Libellés wilaya résolus depuis le référentiel géographique (codes techniques)
  const { translateGeo, translateCategory } = useI18n();
  const filters: FilterField[] = [
    {
      key: 'category',
      label: t('auto.interactivematerialfilters.categorie'),
      placeholder: t('auto.interactivematerialfilters.toutes_les_categories'),
      value: selectedCategory,
      onChange: onCategoryChange,
      options: categories.map(category => ({ value: category, label: translateCategory(category) }))
    },
    {
      key: 'region',
      label: t('auto.interactivematerialfilters.region'),
      placeholder: t('auto.interactivematerialfilters.toutes_les_regions'),
      value: selectedRegion,
      onChange: onRegionChange,
      options: regions.map(region => ({ value: region, label: translateGeo(region) }))
    },
    {
      key: 'stockLevel',
      label: t('auto.interactivematerialfilters.niveau_de_stock'),
      placeholder: t('auto.interactivematerialfilters.tous_les_niveaux'),
      value: selectedStockLevel,
      onChange: onStockLevelChange,
      options: [
        { value: 'high', label: t('auto.interactivematerialfilters.stock_eleve') },
        { value: 'medium', label: t('auto.interactivematerialfilters.stock_moyen') },
        { value: 'low', label: t('auto.interactivematerialfilters.stock_faible') },
        { value: 'out', label: t('auto.interactivematerialfilters.rupture_de_stock') }
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
        onSearchSubmit={onSearchSubmit}
        searchPlaceholder={t('auto.interactivematerialfilters.recherche_fulltext_nom_description_categorie_reg')}
        filters={filters}
        onReset={onReset}
        resultCount={materialCount}
      />
    </div>
  );
};

export default InteractiveMaterialFilters;