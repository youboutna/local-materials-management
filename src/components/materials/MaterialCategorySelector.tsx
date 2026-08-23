import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MATERIAL_CATEGORIES } from '@/dtos/entities/MaterialCategoryDTO';
import { useEnumLabel } from '@/hooks/useEnumLabel';
import { useLanguage } from '@/contexts/LanguageContext';

import { TranslatedUnit } from '@/components/i18n/TranslatedBadges';
import { T } from '@/components/i18n/T';

interface MaterialCategorySelectorProps {
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  onUnitChange?: (unit: string) => void;
}

/**
 * Sélecteur catégorie / sous-catégorie de matériau.
 * Doctrine i18n : la valeur reste le code technique, l'affichage vient du référentiel fr/ar/en.
 */
const MaterialCategorySelector: React.FC<MaterialCategorySelectorProps> = ({
  selectedCategory,
  selectedSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  onUnitChange
}: MaterialCategorySelectorProps) => {
  const { label } = useEnumLabel();
  const { t } = useLanguage();
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
        <Label htmlFor="category"><T k="auto.materialcategoryselector.categorie" fallback="Catégorie" /></Label>
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger id="category">
            <SelectValue placeholder={t('auto.materialcategoryselector.select_category')} />
          </SelectTrigger>
          <SelectContent>
            {MATERIAL_CATEGORIES.map(category => (
              <SelectItem key={category.id} value={category.id}>
                <div>
                  <div className="font-medium">{label('MaterialCategory', category.id)}</div>
                  <div className="text-sm text-muted-foreground">
                    {label('MaterialCategoryDescription', category.id)}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentCategory && currentCategory.subcategories && (
        <div>
          <Label htmlFor="subcategory"><T k="auto.materialcategoryselector.sous_categorie" fallback="Sous-catégorie" /></Label>
          <Select value={selectedSubcategory} onValueChange={handleSubcategoryChange}>
            <SelectTrigger id="subcategory">
              <SelectValue placeholder={t('auto.materialcategoryselector.select_subcategory')} />
            </SelectTrigger>
            <SelectContent>
              {currentCategory.subcategories.map(subcategory => (
                <SelectItem key={subcategory.id} value={subcategory.id}>
                  <div>
                    <div className="font-medium">{label('MaterialSubcategory', subcategory.id)}</div>
                    <div className="text-sm text-muted-foreground">
                      <T k="auto.materialcategoryselector.unite" fallback="Unité:" /> <TranslatedUnit code={subcategory.unit} />
                    </div>
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
