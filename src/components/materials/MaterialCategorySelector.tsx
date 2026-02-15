import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MATERIAL_CATEGORIES, MaterialCategory, MaterialSubcategory } from '@/types/materialCategories';

interface MaterialCategorySelectorProps {
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  onUnitChange?: (unit: string) => void;
}

const MaterialCategorySelector: React.FC<MaterialCategorySelectorProps> = ({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  onUnitChange
}: MaterialCategorySelectorProps) => {
  const currentCategory = MATERIAL_CATEGORIES.find(cat => cat.id === selectedCategory);

  const handleCategoryChange = (categoryId: string) => {
    onCategoryChange(categoryId);
    // Reset subcategory when category changes
    onSubcategoryChange('');
  };

  const handleSubcategoryChange = (subcategoryId: string) => {
    onSubcategoryChange(subcategoryId);
    
    // Auto-set unit based on subcategory
    if (currentCategory && onUnitChange) {
      const subcategory = currentCategory.subcategories?.find(sub => sub.id === subcategoryId);
      if (subcategory) {
        onUnitChange(subcategory.unit);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="category">Catégorie</Label>
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {MATERIAL_CATEGORIES.map(category => (
              <SelectItem key={category.id} value={category.id}>
                <div>
                  <div className="font-medium">{category.name}</div>
                  {category.description && (
                    <div className="text-sm text-gray-500">{category.description}</div>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentCategory && currentCategory.subcategories && (
        <div>
          <Label htmlFor="subcategory">Sous-catégorie</Label>
          <Select value={selectedSubcategory} onValueChange={handleSubcategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une sous-catégorie" />
            </SelectTrigger>
            <SelectContent>
              {currentCategory.subcategories.map(subcategory => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  <div>
                    <div className="font-medium">{subcategory.name}</div>
                    <div className="text-sm text-gray-500">Unité: {subcategory.unit}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default MaterialCategorySelector;
