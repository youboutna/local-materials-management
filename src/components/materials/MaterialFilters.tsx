import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, RotateCcw } from 'lucide-react';

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
  onReset
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtres
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher des matériaux..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

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

          <Select value={selectedLocalType} onValueChange={onLocalTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Type local" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {localTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={onReset} className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialFilters;