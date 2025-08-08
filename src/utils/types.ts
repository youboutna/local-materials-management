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
  dimensions: Dimensions;
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
/**
 * Comprehensive construction element types for BTP (Bâtiment et Travaux Publics) calculations
 * 
 * This type covers all major construction phases from site preparation to finishing work,
 * with specific variants for different materials and techniques.
 */
export type ElementType =
  /* ---------------------------- */
  /*        SITE PREPARATION      */
  /* ---------------------------- */
  | 'site_preparation'             // General site prep
  | 'vegetal_soil_stripping'       // Décapage terre végétale
  | 'excavation'                   // General excavation
  | 'mass_excavation'              // Fouille pleine masse
  | 'trench_excavation'            // Fouille en rigole
  | 'backfilling'                  // Remblaiement
  
  /* ---------------------------- */
  /*      FOUNDATION & STRUCTURE  */
  /* ---------------------------- */
  | 'foundation'                   // General foundation
  | 'strip_footing'                // Semelle filante
  | 'isolated_footing'             // Semelle isolée
  | 'foundation_masonry'           // Maçonnerie de fondation
  | 'foundation_chape'             // Chape de fondation
  | 'lean_concrete'                // Béton de propreté
  | 'concrete_filling'             // Remplissage B.A (ex: rigoles)
  
  /* ---------------------------- */
  /*      VERTICAL STRUCTURES     */
  /* ---------------------------- */
  | 'masonry_wall'                 // Mur maçonnerie traditionnelle
  | 'elevation_wall'               // Mur élévation (vide sanitaire)
  | 'hollow_block_wall'            // Mur parpaing/agglo
  | 'brick_wall'                   // Mur brique
  | 'wood_framing_wall'            // Mur ossature bois
  | 'concrete_wall'                // Mur béton banché
  | 'partition_wall'               // Cloison
  | 'retaining_wall'               // Mur de soutènement
  
  /* ---------------------------- */
  /*      HORIZONTAL STRUCTURES   */
  /* ---------------------------- */
  | 'concrete_slab'                // Dalle béton
  | 'hollow_core_slab'             // Dalle alvéolée
  | 'precast_slab'                 // Plancher préfabriqué
  | 'wood_floor'                   // Plancher bois
  | 'metal_deck'                   // Plancher métallique
  
  /* ---------------------------- */
  /*         ROOFING SYSTEMS      */
  /* ---------------------------- */
  | 'roof_structure'               // Charpente générale
  | 'wooden_roof_structure'        // Charpente bois
  | 'metal_roof_structure'         // Charpente métallique
  | 'roof_decking'                 // Sous-toiture + liteaunage
  | 'roof_insulation'              // Isolation toiture
  | 'roof_covering'                // Couverture générale
  | 'tile_roof'                    // Couverture tuile
  | 'synthetic_slate_roof'         // Couverture ardoise synthétique
  | 'metal_roof'                   // Couverture métallique
  | 'zinc_ridge'                   // Faîtage zinc
  | 'metal_gutter'                 // Gouttière métallique
  
  /* ---------------------------- */
  /*      OPENINGS & JOINERY      */
  /* ---------------------------- */
  | 'wooden_doors'                 // Portes bois
  | 'metal_doors_windows'          // Portes/fenêtres métal
  | 'window_installation'          // Pose fenêtre
  | 'skylight'                     // Velux/fenêtre de toit
  
  /* ---------------------------- */
  /*       FINISHING WORK         */
  /* ---------------------------- */
  | 'plaster'                      // Enduit
  | 'brick_joints'                 // Joints maçonnerie
  | 'tiling'                       // Carrelage
  | 'painting'                     // Peinture
  | 'wooden_ceiling'               // Plafond bois
  | 'suspended_ceiling'            // Plafond suspendu
  
  /* ---------------------------- */
  /*       SPECIALTY WORK         */
  /* ---------------------------- */
  | 'balustrade'                   // Garde-corps
  | 'staircase'                    // Escalier
  | 'electrical_installation'      // Électricité
  | 'plumbing_installation'        // Plomberie
  | 'septic_tank'                  // Fosse septique
  | 'fence'                        // Clôture
  | 'gate'                         // Portail
  | 'landscaping'                  // Aménagement extérieur
  
  /* ---------------------------- */
  /*      REBAR & STRUCTURAL      */
  /* ---------------------------- */
  | 'rebar'                        // Ferraillage général
  | 'rebar_slab'                   // Ferraillage dalle
  | 'rebar_column'                 // Ferraillage poteau
  | 'rebar_beam'                   // Ferraillage poutre
  | 'rebar_footing'                // Ferraillage semelle
  
  /* ---------------------------- */
  /*      PREFAB ELEMENTS         */
  /* ---------------------------- */
  | 'prefab_girder'                // Poutre préfabriquée
  | 'precast_concrete'             // Éléments préfabriqués béton
  
  /* ---------------------------- */
  /*      CALCULATION HELPERS     */
  /* ---------------------------- */
  | 'concrete_mix'                 // Dosage béton
  | 'material_quantity'            // Calcul quantité matériaux
  | 'basic_calculator'             // Calculs basiques
  | 'architectural_plan';          // Plan architectural
  
// elementTypes with all construction elements
export const elementTypes = [
  // Concrete elements
    {
    value: "basic_calculator",
    label: "calcul basic",
    requires: ["length", "width", "height"],
    defaultUnit: "m³"
  },
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
  },
  // Site preparation
  {
    value: "site_preparation",
    label: "Préparation de terrain",
    requires: ["area"],
    defaultUnit: "m²",
    synonyms: ["décapage", "terrassement", "nivellement"]
  },
  {
    value: "vegetal_soil_stripping",
    label: "Décapage terre végétale",
    requires: ["area", "depth"],
    defaultUnit: "m³",
    synonyms: ["décapage terre", "enlèvement terre végétale"]
  },

  // Excavations
  {
    value: "mass_excavation",
    label: "Fouille pleine masse",
    requires: ["area", "depth"],
    defaultUnit: "m³",
    synonyms: ["fouille en masse", "excavation complète"]
  },
  {
    value: "trench_excavation",
    label: "Fouille en rigole",
    requires: ["length", "width", "depth"],
    defaultUnit: "m³",
    synonyms: ["fouille linéaire", "rigole"]
  },

  // Concrete work
  {
    value: "concrete_filling",
    label: "Remplissage béton",
    requires: ["volume"],
    defaultUnit: "m³",
    synonyms: ["remplissage rigoles béton", "couche de propreté"]
  },
  {
    value: "lean_concrete",
    label: "Béton maigre",
    requires: ["volume"],
    defaultUnit: "m³",
    synonyms: ["béton de propreté", "béton dosé faible"]
  },

  // Masonry
  {
    value: "elevation_wall",
    label: "Mur élévation",
    requires: ["length", "height"],
    defaultUnit: "m²",
    synonyms: ["mur de superstructure", "élévation maçonnerie"]
  },
  {
    value: "wood_framing_wall",
    label: "Mur ossature bois",
    requires: ["length", "height"],
    defaultUnit: "m²",
    synonyms: ["ossature bois", "mur bois", "charpente murale"]
  },

  // Roofing
  {
    value: "roof_decking",
    label: "Sous-toiture + liteaunage",
    requires: ["area"],
    defaultUnit: "m²",
    synonyms: ["sous-toiture", "voligeage", "support toiture"]
  },
  {
    value: "synthetic_slate_roof",
    label: "Couverture ardoise synthétique",
    requires: ["area"],
    defaultUnit: "m²",
    synonyms: ["ardoise artificielle", "couverture synthétique"]
  },
  {
    value: "zinc_ridge",
    label: "Faitage zinc",
    requires: ["length"],
    defaultUnit: "ml",
    synonyms: ["faîtage métallique", "arêtier zinc"]
  },
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
  ],
  
  // Site preparation
  site_preparation: [
    "préparation terrain", "préparation chantier", "mise en état"
  ],
  vegetal_soil_stripping: [
    "décapage terre végétale", "enlèvement terre", "déblai terre"
  ],

  // Excavations
  mass_excavation: [
    "fouille pleine masse", "excavation complète", "déblai général"
  ],
  trench_excavation: [
    "fouille en rigole", "fouille linéaire", "tranchée"
  ],

  // Concrete
  concrete_filling: [
    "remplissage béton", "couche béton", "remplissage rigoles"
  ],
  lean_concrete: [
    "béton maigre", "béton de propreté", "béton dosé faible"
  ],

  // Masonry
  elevation_wall: [
    "mur élévation", "mur superstructure", "élévation maçonnerie"
  ],
  wood_framing_wall: [
    "mur ossature bois", "ossature bois", "charpente murale"
  ],

  // Roofing
  roof_decking: [
    "sous-toiture", "liteaunage", "voligeage", "support toiture"
  ],
  synthetic_slate_roof: [
    "ardoise synthétique", "couverture synthétique", "toiture ardoise"
  ],
  zinc_ridge: [
    "faitage zinc", "arêtier zinc", "faîtage métallique"
  ]  
};


// Enhanced Element Type Detection
export const detectElementType = (designation: string): ElementType => {
  if (!designation || typeof designation !== "string") return "basic_calculator";

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
//Check for depth/height specifications
  const hasDepthSpec = /\d+(?:[,.]\d+)?\s?m/.test(d);

  // Special cases with depth/height
  if (d.includes("décapage") && d.includes("terre végétale")) {
    return hasDepthSpec ? "vegetal_soil_stripping" : "site_preparation";
  }
  if (d.includes("fouille pleine masse")) {
    return hasDepthSpec ? "mass_excavation" : "excavation";
  }
  if (d.includes("remplissage") && d.includes("b.a")) {
    return "concrete_filling";
  }
  if (d.includes("mur ossature bois")) {
    return "wood_framing_wall";
  }
  if (d.includes("sous toiture") && d.includes("liteaunage")) {
    return "roof_decking";
  }
  if (d.includes("couverture") && d.includes("ardoise")) {
    return "synthetic_slate_roof";
  }
  if (d.includes("faitage zinc")) {
    return "zinc_ridge";
  }
  return "basic_calculator";
};

// Enhanced semantic mapping function
/**
 * mapping function with unit detection
 * @param desc 
 * @returns 
 */
export const mapToElementType = (desc: string) => {
  const d = desc.toLowerCase();
  
  // Check for unit patterns
  const unitMatch = d.match(/(\d+(?:[,.]\d+)?\s?(m²|m³|ml|kg|tonne|unite|u))/);
  const unit = unitMatch ? unitMatch[2] : null;

  // Special cases with units
  if (d.includes("décapage") && unit === "m³") return "vegetal_soil_stripping";
  if (d.includes("fouille") && unit === "m³") return "mass_excavation";
  if (d.includes("remplissage") && unit === "m³") return "concrete_filling";
  if (d.includes("mur") && unit === "m²") return "elevation_wall";
  if (d.includes("ardoise") && unit === "m²") return "synthetic_slate_roof";
  if (d.includes("faitage") && unit === "ml") return "zinc_ridge";

  // Fallback to standard mapping
  const found = elementTypes.find(
    et =>
      d.includes(et.label.toLowerCase()) ||
      (et.synonyms && et.synonyms.some(syn => d.includes(syn)))
  );
  
  return found ? found.value : "basic_calculator";
};