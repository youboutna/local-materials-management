import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, RotateCcw, MapPin, Package } from 'lucide-react';

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
  const getStockLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-orange-500';
      case 'out': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStockLevelLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Stock Élevé';
      case 'medium': return 'Stock Moyen';
      case 'low': return 'Stock Faible';
      case 'out': return 'Rupture de Stock';
      default: return 'Tous les Niveaux';
    }
  };

  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5 text-green-600" />
          Filtres Avancés pour Matériaux
        </CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {materialCount} matériaux
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {gpsCount} géolocalisés
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher des matériaux..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Region Filter */}
          <Select value={selectedRegion} onValueChange={onRegionChange}>
            <SelectTrigger>
              <SelectValue placeholder="Région" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les régions</SelectItem>
              {regions.map((region) => (
                <SelectItem key={region} value={region}>
                  {region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Stock Level Filter */}
          <Select value={selectedStockLevel} onValueChange={onStockLevelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Niveau de Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les niveaux</SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStockLevelColor('high')}`}></div>
                  Stock Élevé
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStockLevelColor('medium')}`}></div>
                  Stock Moyen
                </div>
              </SelectItem>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStockLevelColor('low')}`}></div>
                  Stock Faible
                </div>
              </SelectItem>
              <SelectItem value="out">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStockLevelColor('out')}`}></div>
                  Rupture de Stock
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Reset Button */}
          <Button variant="outline" onClick={onReset} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || selectedCategory !== 'all' || selectedRegion !== 'all' || selectedStockLevel !== 'all') && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">Filtres actifs:</p>
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="secondary">
                  Recherche: "{searchTerm}"
                </Badge>
              )}
              {selectedCategory !== 'all' && (
                <Badge variant="secondary">
                  Catégorie: {selectedCategory}
                </Badge>
              )}
              {selectedRegion !== 'all' && (
                <Badge variant="secondary">
                  Région: {selectedRegion}
                </Badge>
              )}
              {selectedStockLevel !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${getStockLevelColor(selectedStockLevel)}`}></div>
                  {getStockLevelLabel(selectedStockLevel)}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InteractiveMaterialFilters;