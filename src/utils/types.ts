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
  elementType: string;
  originalLabel?: string;
  dimensions: Dimensions;
  openings?: Opening[];
  results: { [key: string]: number | string };
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
//type d'elements de batitemnt, genie civil
export const elementTypes = [
  {
    value: "concrete_slab",
    label: "Dalle béton",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
    minHeight: 0.05,
    heightStep: 0.01,
    heightPlaceholder: "0.15 (ex: 15cm)",
  },
  {
    value: "hollow_core_slab",
    label: "Plancher corps creux",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
    minHeight: 0.04,
    heightStep: 0.01,
  },
  {
    value: "rebar",
    label: "Ferraillage",
    requires: ["length", "width"],
    defaultUnit: "m²",
  },
  {
    value: "masonry_wall",
    label: "Mur maçonnerie",
    requires: ["length", "height"],
    defaultUnit: "m²",
    minHeight: 0.1,
  },
  {
    value: "plaster",
    label: "Enduit",
    requires: ["length", "width"],
    defaultUnit: "m²",
  },
  {
    value: "beam",
    label: "Poutre",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
    minHeight: 0.2,
  },
  {
    value: "column",
    label: "Poteau",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
    minHeight: 0.2,
  },
  {
    value: "foundation",
    label: "Fondation",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
    minHeight: 0.3,
  },
  {
    value: "staircase",
    label: "Escalier",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
    minHeight: 0.15,
  },
  {
    value: "site_preparation",
    label: "Préparation du terrain",
    requires: ["area"],
    defaultUnit: "ff",
  },
  {
    value: "excavation",
    label: "Fouille de fondation",
    requires: ["length", "width", "depth"],
    defaultUnit: "m³",
  },
  {
    value: "lean_concrete",
    label: "Béton de propreté",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
  },
  {
    value: "foundation_masonry",
    label: "Maçonnerie de fondation",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
  },
  {
    value: "foundation_chape",
    label: "Chape sur fondation",
    requires: ["length"],
    defaultUnit: "ml",
  },
  {
    value: "roof_insulation",
    label: "Roofing d'isolation",
    requires: ["length"],
    defaultUnit: "ml",
  },
  {
    value: "cement_block_masonry",
    label: "Maçonnerie en blocs ciment",
    requires: ["area"],
    defaultUnit: "m²",
  },
  {
    value: "reinforced_concrete",
    label: "Béton armé",
    requires: ["length", "width", "height"],
    defaultUnit: "m³",
  },
  {
    value: "wooden_roof_structure",
    label: "Charpente en bois",
    requires: ["area"],
    defaultUnit: "m²",
  },
  {
    value: "metal_gutter",
    label: "Gouttière métallique",
    requires: ["length"],
    defaultUnit: "ml",
  },
  {
    value: "roof_covering",
    label: "Couverture en tôles",
    requires: ["area"],
    defaultUnit: "m²",
  },
  {
    value: "tiling",
    label: "Revêtement en carreaux",
    requires: ["area"],
    defaultUnit: "m²",
  },
  {
    value: "wooden_ceiling",
    label: "Plafond en planchettes",
    requires: ["area"],
    defaultUnit: "m²",
  },
  {
    value: "metal_doors_windows",
    label: "Portes et fenêtres métalliques",
    requires: ["area"],
    defaultUnit: "m²",
  },
  {
    value: "wooden_doors",
    label: "Portes en bois",
    requires: ["count"],
    variants: [
      { 
        type: "intérieur", 
        dimensions: { length: 2.1, width: 0.9, thickness: 0.04 },
        materials: { wood: 0.0756 }
      },
      {
        type: "extérieur", 
        dimensions: { length: 2.1, width: 1.0, thickness: 0.05 },
        materials: { wood: 0.105 }
      }
    ],
    hardware: {
      hinges: 3,
      handles: 1,
      locks: 1
    },
    defaultUnit: "pce",
  },
  {
    value: "balustrade",
    label: "Balustrade de protection",
    requires: ["length"],
    defaultUnit: "ml",
  },
  {
    value: "electrical_installation",
    label: "Installation électrique",
    requires: ["count"],
    defaultUnit: "ff",
  },
  {
    value: "plumbing_installation",
    label: "Installation sanitaire",
    requires: ["count"],
    defaultUnit: "ff",
  },
  {
    value: "septic_tank",
    label: "Fosse septique",
    requires: ["capacity"],
    defaultUnit: "pce",
  },
  {
    value: "painting",
    label: "Peinture",
    requires: ["area"],
    defaultUnit: "m²",
  },
  {
    value: "fence",
    label: "Clôture",
    requires: ["length", "height"],
    defaultUnit: "m²",
  },
  {
    value: "gate",
    label: "Portail",
    requires: ["count"],
    defaultUnit: "pce",
  },
  {
    value: "landscaping",
    label: "Aménagement paysager",
    requires: ["area"],
    defaultUnit: "m²",
  }
];