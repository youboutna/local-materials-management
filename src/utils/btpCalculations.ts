
// --- Interfaces ---

export interface ConcreteSlabInput {
  length: number; // Longueur en mètres
  width: number;  // Largeur en mètres
  height: number; // Hauteur en mètres
  dosage: number; // Dosage en kg/m³
}

export interface ConcreteSlabOutput {
  volume: number; // Volume en m³
  cement: number; // Ciment en kg
  sand: number;   // Sable en m³
  gravel: number; // Gravier en m³
}

export interface RebarInput {
  surface: number; // Surface en m²
  weightPerSquareMeter: number; // Poids du ferraillage en kg/m²
}

export interface RebarOutput {
  totalWeight: number; // Poids total en kg
}

export interface MasonryInput {
  wallArea: number;     // Surface du mur en m²
  brickLength: number;  // Longueur de la brique en m
  brickHeight: number;  // Hauteur de la brique en m
}

export interface MasonryOutput {
  numberOfBricks: number; // Nombre de briques nécessaires
}

export interface PlasterInput {
  surface: number;             // Surface à enduire en m²
  cementDosagePerSqM: number; // Dosage de ciment en kg/m²
}

export interface PlasterOutput {
  cementNeeded: number; // Ciment total nécessaire en kg
}

// --- Fonctions de calcul ---

/**
 * Calcule les quantités de matériaux pour une dalle en béton
 */
export function calculateConcreteSlab(input: ConcreteSlabInput): ConcreteSlabOutput {
  const volume = input.length * input.width * input.height;
  const cement = volume * input.dosage;
  const sand = volume * 0.45;
  const gravel = volume * 0.9;
  return { volume, cement, sand, gravel };
}

/**
 * Calcule le poids total de ferraillage pour une dalle
 */
export function calculateRebarWeight(input: RebarInput): RebarOutput {
  return {
    totalWeight: input.surface * input.weightPerSquareMeter
  };
}

/**
 * Calcule le nombre de briques nécessaires pour une maçonnerie
 */
export function calculateBricks(input: MasonryInput): MasonryOutput {
  const brickArea = input.brickLength * input.brickHeight;
  const numberOfBricks = input.wallArea / brickArea;
  return { numberOfBricks: Math.ceil(numberOfBricks) };
}

/**
 * Calcule la quantité de ciment pour enduit
 */
export function calculatePlasterCement(input: PlasterInput): PlasterOutput {
  return {
    cementNeeded: input.surface * input.cementDosagePerSqM
  };
}

/**
 * Fonction principale pour calculer automatiquement les métrés basés sur les dimensions
 */
export function calculateAdvancedQuantities(
  elementType: string,
  length: number,
  width?: number,
  height?: number
): { [key: string]: number } {
  const results: { [key: string]: number } = {};

  switch (elementType.toLowerCase()) {
    case 'dalle béton':
    case 'concrete slab':
      if (width && height) {
        const concreteResult = calculateConcreteSlab({
          length,
          width,
          height,
          dosage: 350 // Dosage standard
        });
        results['Volume béton (m³)'] = concreteResult.volume;
        results['Ciment (kg)'] = concreteResult.cement;
        results['Sable (m³)'] = concreteResult.sand;
        results['Gravier (m³)'] = concreteResult.gravel;
      }
      break;

    case 'ferraillage':
    case 'rebar':
      if (width) {
        const surface = length * width;
        const rebarResult = calculateRebarWeight({
          surface,
          weightPerSquareMeter: 80 // Poids standard
        });
        results['Surface (m²)'] = surface;
        results['Poids ferraillage (kg)'] = rebarResult.totalWeight;
      }
      break;

    case 'mur maçonnerie':
    case 'masonry wall':
      if (height) {
        const wallArea = length * height;
        const masonryResult = calculateBricks({
          wallArea,
          brickLength: 0.2, // 20cm standard
          brickHeight: 0.1  // 10cm standard
        });
        results['Surface mur (m²)'] = wallArea;
        results['Nombre de briques'] = masonryResult.numberOfBricks;
      }
      break;

    case 'enduit':
    case 'plaster':
      if (width) {
        const surface = length * width;
        const plasterResult = calculatePlasterCement({
          surface,
          cementDosagePerSqM: 7 // Dosage standard
        });
        results['Surface enduit (m²)'] = surface;
        results['Ciment enduit (kg)'] = plasterResult.cementNeeded;
      }
      break;

    default:
      // Calcul générique basé sur les dimensions
      results['Longueur (m)'] = length;
      if (width) results['Largeur (m)'] = width;
      if (height) results['Hauteur (m)'] = height;
      if (width && height) {
        results['Volume (m³)'] = length * width * height;
        results['Surface (m²)'] = length * width;
      } else if (width) {
        results['Surface (m²)'] = length * width;
      }
      break;
  }

  return results;
}
