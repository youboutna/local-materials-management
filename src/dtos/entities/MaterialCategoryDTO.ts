/**
 * Material Category DTOs
 * Migrated from @/types/materialCategories
 */

export interface MaterialCategoryConfig {
  id: string;
  name: string;
  description?: string;
  subcategories?: MaterialSubcategory[];
}

export interface MaterialSubcategory {
  id: string;
  name: string;
  description?: string;
  unit: string;
}

export const MATERIAL_CATEGORIES: MaterialCategoryConfig[] = [
  {
    id: 'construction',
    name: 'Matériaux de construction',
    description: 'Matériaux de base pour la construction',
    subcategories: [
      { id: 'cement', name: 'Ciment', unit: 'sac' },
      { id: 'concrete', name: 'Béton', unit: 'm³' },
      { id: 'steel', name: 'Acier', unit: 'kg' },
      { id: 'brick', name: 'Briques', unit: 'unité' },
      { id: 'sand', name: 'Sable', unit: 'm³' },
      { id: 'gravel', name: 'Gravier', unit: 'm³' }
    ]
  },
  {
    id: 'electrical',
    name: 'Matériaux électriques',
    description: 'Câblage et composants électriques',
    subcategories: [
      { id: 'cable', name: 'Câbles', unit: 'm' },
      { id: 'conduit', name: 'Gaines', unit: 'm' },
      { id: 'panel', name: 'Tableaux', unit: 'unité' },
      { id: 'switch', name: 'Interrupteurs', unit: 'unité' }
    ]
  },
  {
    id: 'plumbing',
    name: 'Plomberie',
    description: 'Tuyauterie et accessoires',
    subcategories: [
      { id: 'pipe', name: 'Tuyaux', unit: 'm' },
      { id: 'fitting', name: 'Raccords', unit: 'unité' },
      { id: 'valve', name: 'Vannes', unit: 'unité' },
      { id: 'pump', name: 'Pompes', unit: 'unité' }
    ]
  },
  {
    id: 'finishing',
    name: 'Finition',
    description: 'Matériaux de finition',
    subcategories: [
      { id: 'paint', name: 'Peinture', unit: 'litre' },
      { id: 'tile', name: 'Carrelage', unit: 'm²' },
      { id: 'wood', name: 'Bois', unit: 'm³' },
      { id: 'glass', name: 'Verre', unit: 'm²' }
    ]
  }
];
