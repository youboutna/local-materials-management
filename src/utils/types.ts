//ouverture btp
export interface Opening {
  id: string;
  label: string;
  length: number;
  width: number;
  height?: number;
}

//données pour métrés
export interface Dimensions {
  length: number;
  width?: number;
  height?: number;
  area?: number;
  count?: number;
  capacity?: number;
  depth?: number;
}

export interface CalculationResult {

  originalLabel?: string;
  elementType: string;
  dimensions: {
    length: number;
    width?: number;
    height?: number;
    count?: number;
  };
  openings?: Opening[];
  results: Record<string, number | string>;
  metadata?: {
    type?:string;
    unitWeights?:number;
    unit?: string;
    description?: string;
    coverageRate?:number;
  };
}
export interface MasonryMaterials extends CalculationResult {
  bricks?: number;
  blocks?: number;
  mortar: number;
}

export interface ConcreteMaterials  extends CalculationResult {
  cement: number;
  sand: number;
  gravel: number;
}
export interface RebarMaterials extends CalculationResult{
  rebarLength: number;
  rebarWeight: number;
  barCount: number;
}


export interface ConcreteOptions extends CalculationResult{
  dosage?: number;
  thickness?: number;
  sandRatio?: number;
}

export interface MasonryCalculation extends CalculationResult{
  netSurface: number;
  bricks: number;
  mortar: number;
}

export interface ConcreteCalculation extends CalculationResult{
  volume: number;
  cement: number;
  sand: number;
  gravel: number;
  dosage: number;
}

export interface RebarCalculation extends CalculationResult{
  totalLength: number;
  totalWeight: number;
  barCount: number;
}

export interface PlasterCalculation extends CalculationResult{
  surface: number;
  cement: number;
  volume: number;
}
// ======================
// Rebar Column Result
// ======================
export interface RebarColumnCalculation extends CalculationResult{
  totalLength: number;
  totalWeight: number;
  barCount?: number;
  barDiameter?: number;
}

export interface BrickJointsCalculation extends CalculationResult{
  jointArea: number;
  jointVolume: number;
  cementWeight: number;
  jointThickness?: number;
}

// ======================
// Concrete Mix Result
// ======================
export interface ConcreteMixCalculation {

    dimensions: {
    volume: number;
  }
  elementType :string;
  totalVolume: number;
  cementWeight: number;
  sandVolume: number;
  gravelVolume: number;
  waterVolume?: number;
  mixRatio?: string;
  openings?: Opening[];
  results: Record<string, number | string>;
  metadata?: {
    type?:string;
    unitWeights?:number;
    unit?: string;
    description?: string;
    coverageRate?:number;
  };
}


//ligne de devis
export interface InvoiceLine {
  id: string;
  number: string;         // numero
  designation: string;
  unit: string;           // unite
  quantity: number;       // quantite
  unitPrice: number;      // prixUnitaire
  totalPrice: number;     // prixTotal
}

export const STANDARD_OPENINGS = [
  { id: "1", label: "Porte standard", length: 0.9, width: 2.1 },
  { id: "2", label: "Fenêtre standard", length: 1.2, width: 1.5 },
  { id: "3", label: "Baie vitrée", length: 2.4, width: 2.1 },
  { id: "4", label: "Ouverture technique", length: 0.6, width: 0.6 },
];


// Updated interface

export interface CalculationParams {
  elementType: string;
  length: number;
  width?: number;
  height?: number;
  options?: CalculationOptions;
}
export interface CalculationOptions {
  openings?: Opening[];
  dosage?: number;
  thickness?: number;
}
// New interface for element types
export type ElementType =
  | 'concrete_slab' | 'site_preparation' | 'hollow_core_slab' | 'rebar'
  | 'masonry_wall' | 'plaster' | 'beam' | 'column' | 'foundation'
  | 'staircase' | 'excavation' | 'lean_concrete' | 'foundation_masonry'
  | 'foundation_chape' | 'roof_insulation' | 'cement_block_masonry'
  | 'reinforced_concrete' | 'wooden_roof_structure' | 'metal_gutter'
  | 'roof_covering' | 'tiling' | 'wooden_ceiling' | 'metal_doors_windows'
  | 'wooden_doors' | 'balustrade' | 'electrical_installation'
  | 'plumbing_installation' | 'septic_tank' | 'painting' | 'fence'
  | 'gate' | 'landscaping' | 'strip_footing' | 'brick_joints'
  | 'rebar_slab' | 'rebar_footing' | 'rebar' | 'rebar_column' | 'prefab_girder'
  | 'precast_slab' | 'concrete_mix' | 'architectural_plan'

// elementTypes with all construction elements
export const elementTypes = [
  // Concrete elements
  {
    value: "concrete_slab",
    label: "Dalle béton",
    requires: ["length", "width", "height"],
    defaultUnit: "m³"
  },
  {
    value: "hollow_block_wall",
    label: "Mur en parpaing",
    requires: ["length", "height"],
    defaultUnit: "m²"
  },
  {
    value: "concrete_column",
    label: "Poteau béton",
    requires: ["length", "width", "height"],
    defaultUnit: "m³"
  },
  {
    value: "concrete_beam",
    label: "Poutre béton",
    requires: ["length", "width", "height"],
    defaultUnit: "m³"
  },
  {
    value: "concrete_footing",
    label: "Semelle béton",
    requires: ["length", "width", "height"],
    defaultUnit: "m³"
  },

  // Masonry elements
  {
    value: "masonry_wall",
    label: "Mur maçonnerie",
    requires: ["length", "height"],
    defaultUnit: "m²"
  },
  {
    value: "brick_joints",
    label: "Joints brique",
    requires: ["length", "height"],
    defaultUnit: "m²"
  },

  // Finishes
  {
    value: "plaster",
    label: "Enduit",
    requires: ["length", "height"],
    defaultUnit: "m²"
  },
  {
    value: "paving",
    label: "Dallage",
    requires: ["length", "width"],
    defaultUnit: "m²"
  },

  // Structural elements
  {
    value: "rebar_column",
    label: "Ferraillage poteau",
    requires: ["height"],
    defaultUnit: "kg"
  },
  {
    value: "rebar_slab",
    label: "Ferraillage dalle",
    requires: ["length", "width"],
    defaultUnit: "kg"
  },

  // Prefabricated elements
  {
    value: "prefab_girder",
    label: "Poutre préfabriquée",
    requires: ["length", "width", "height"],
    defaultUnit: "m³"
  },
  {
    value: "precast_slab",
    label: "Dalle préfabriquée",
    requires: ["length", "width"],
    defaultUnit: "m²"
  },

  // Special calculations
  {
    value: "concrete_mix",
    label: "Béton dosé",
    requires: ["volume"],
    defaultUnit: "m³"
  },
  {
    value: "wooden_doors",
    label: "Portes bois",
    requires: ["count"],
    defaultUnit: "unité"
  }
];

// Comprehensive element type synonyms
export const elementTypeSynonyms: Record<string, string[]> = {
  concrete_slab: [
    "dalle béton", "dalle", "slab", "plancher béton", "radier"
  ],
  hollow_block_wall: [
    "mur parpaing", "mur agglo", "bloc béton", "mur en agglo", "parpaing"
  ],
  concrete_column: [
    "poteau", "colonne béton", "pilier", "poteau béton armé"
  ],
  concrete_beam: [
    "poutre", "linteau", "poutre béton", "poutre armée"
  ],
  concrete_footing: [
    "semelle", "fondation", "semelle isolée", "semelle filante"
  ],
  masonry_wall: [
    "mur brique", "cloison", "mur maçonné", "mur porteur"
  ],
  plaster: [
    "enduit", "crépi", "plâtre", "ragréage"
  ],
  rebar_column: [
    "ferraillage poteau", "armature poteau", "acier poteau"
  ],
  rebar_slab: [
    "treillis soudé", "ferraillage dalle", "armature dalle"
  ],
  prefab_girder: [
    "poutre précontrainte", "préfab poutre", "poutrelle préfabriquée"
  ],
  precast_slab: [
    "dalle alvéolée", "plancher préfabriqué", "hourdis"
  ],
  concrete_mix: [
    "dosage béton", "composition béton", "mélange béton"
  ],
  wooden_doors: [
    "porte bois", "battant bois", "porte intérieure bois"
  ],
  brick_joints: [
    "joints maçonnerie", "mortier joints", "joints mur"
  ],
  paving: [
    "carrelage", "dallage extérieur", "revêtement sol"
  ]
};


// Enhanced Element Type Detection
export const detectElementType = (designation: string): ElementType => {
  if (!designation || typeof designation !== "string") return "concrete_slab";

  const d = designation.toLowerCase().trim();

  // First check for exact matches in synonyms
  for (const [type, synonyms] of Object.entries(elementTypeSynonyms)) {
    if (synonyms.some(syn => syn.toLowerCase() === d)) {
      return type as ElementType;
    }
  }

  // Then check for partial matches
  for (const [type, synonyms] of Object.entries(elementTypeSynonyms)) {
    if (synonyms.some(syn => d.includes(syn.toLowerCase()))) {
      return type as ElementType;
    }
  }

  // Special cases with complex logic
  if (d.includes("ferraillage") || d.includes("armature")) return "rebar";
  if (d.includes("enduit") && d.includes("façade")) return "plaster";
  if (d.includes("porte") && d.includes("bois")) return "wooden_doors";
  if (d.includes("porte") && (d.includes("métal") || d.includes("blindée"))) return "metal_doors_windows";

  return "concrete_slab";
};

// Enhanced semantic mapping function
/**
 * 
 * @param desc 
 * @returns 
 */
export const mapToElementType = (desc: string) => {
  const d = desc.toLowerCase();
  // 1. Check synonyms mapping
  for (const [type, synonyms] of Object.entries(elementTypeSynonyms)) {
    if (synonyms.some(syn => d.includes(syn))) {
      return type;
    }
  }
  // 2. Fallback: check elementTypes label/value
  const found = elementTypes.find(
    et =>
      d.includes(et.label.toLowerCase()) ||
      d.includes(et.value.replace(/_/g, " "))
  );
  return found ? found.value : "concrete_slab";
};