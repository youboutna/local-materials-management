
export interface MaterialCategory {
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

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
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
    id: 'finishing',
    name: 'Matériaux de finition',
    description: 'Matériaux pour les finitions',
    subcategories: [
      { id: 'paint', name: 'Peinture', unit: 'litre' },
      { id: 'tiles', name: 'Carrelage', unit: 'm²' },
      { id: 'wood', name: 'Bois', unit: 'm²' },
      { id: 'glass', name: 'Verre', unit: 'm²' }
    ]
  },
  {
    id: 'electrical',
    name: 'Matériaux électriques',
    description: 'Équipements et matériaux électriques',
    subcategories: [
      { id: 'cable', name: 'Câbles', unit: 'mètre' },
      { id: 'switch', name: 'Interrupteurs', unit: 'unité' },
      { id: 'outlet', name: 'Prises', unit: 'unité' },
      { id: 'lighting', name: 'Éclairage', unit: 'unité' }
    ]
  },
  {
    id: 'plumbing',
    name: 'Matériaux de plomberie',
    description: 'Tuyaux, robinets et accessoires',
    subcategories: [
      { id: 'pipes', name: 'Tuyaux', unit: 'mètre' },
      { id: 'faucets', name: 'Robinets', unit: 'unité' },
      { id: 'fittings', name: 'Raccords', unit: 'unité' }
    ]
  },
  {
    id: 'tools',
    name: 'Outils et équipements',
    description: 'Outils de construction et équipements',
    subcategories: [
      { id: 'hand_tools', name: 'Outils à main', unit: 'unité' },
      { id: 'power_tools', name: 'Outils électriques', unit: 'unité' },
      { id: 'machinery', name: 'Machines', unit: 'unité' }
    ]
  }
];

export const getCategoryById = (id: string): MaterialCategory | undefined => {
  return MATERIAL_CATEGORIES.find(cat => cat.id === id);
};

export const getSubcategoryById = (categoryId: string, subcategoryId: string): MaterialSubcategory | undefined => {
  const category = getCategoryById(categoryId);
  return category?.subcategories?.find(sub => sub.id === subcategoryId);
};
