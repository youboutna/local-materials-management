import { Opening, CalculationResult, InvoiceLine, STANDARD_OPENINGS, elementTypes } from "@/utils/types";


interface CalculationOptions {
  openings?: Opening[];
  dosage?: number;
}

// Constants for better maintainability
const CONCRETE_DOSAGE_DEFAULT = 350; // kg/m³
const BRICKS_PER_SQM = 13;
const MORTAR_THICKNESS = 0.02; // meters
const MORTAR_CEMENT_RATIO = 400; // kg/m³
const MORTAR_WASTAGE_FACTOR = 1.3;
const SAND_VOLUME_RATIO = 0.4;
const GRAVEL_VOLUME_RATIO = 0.8;
const MATERIAL_WASTAGE_FACTOR = 1.05;
const ENTREVOUS_PER_SQM = 7.2;
const REBAR_DOSAGE_DEFAULT = 80; // kg/m²
const PLASTER_DOSAGE_DEFAULT = 7; // kg/m²
const CEMENT_BAG_WEIGHT = 50; // kg
const TONNE_TO_KG = 1000;

export function calculateEquivalentOpening(openings: Opening[] = STANDARD_OPENINGS): { length: number; width: number } {
  if (!openings || openings.length === 0) {
    throw new Error('At least one opening is required');
  }
  const totalArea = openings.reduce((sum, op) => sum + (op.length * op.width), 0);
  const maxDim = Math.max(...openings.map(op => Math.max(op.length, op.width)));
  return {
    length: maxDim,
    width: totalArea / maxDim
  };
}

// Use CalculationResult as return type
export function calculateConcreteSlab(
  length: number,
  width: number,
  height: number,
  options?: CalculationOptions
): CalculationResult {
  if (!length || !width || !height) {
    throw new Error('All dimensions (length, width, height) are required');
  }
  const dosage = options?.dosage || CONCRETE_DOSAGE_DEFAULT;
  let volume = length * width * height;
  let openings = options?.openings || [];
  if (openings.length) {
    const equivalentOpening = calculateEquivalentOpening(openings);
    volume -= equivalentOpening.length * equivalentOpening.width * height;
  }
  const cement = volume * dosage;
  const sand = volume * SAND_VOLUME_RATIO * MATERIAL_WASTAGE_FACTOR;
  const gravel = volume * GRAVEL_VOLUME_RATIO * MATERIAL_WASTAGE_FACTOR;
  return {
    elementType: "concrete_slab",
    dimensions: { length, width, height },
    openings,
    results: {
      'Volume béton (m³)': roundToDecimal(volume, 3),
      'Ciment (kg)': roundToDecimal(cement, 2),
      'Sable (m³)': roundToDecimal(sand, 3),
      'Gravier (m³)': roundToDecimal(gravel, 3),
      'Sacs de ciment (50kg)': Math.ceil(cement / CEMENT_BAG_WEIGHT),
      'Ciment (tonnes)': roundToDecimal(cement / TONNE_TO_KG, 3)
    }
  };
}

// Use CalculationResult as return type
export function calculateMasonryWall(
  length: number,
  height: number,
  options?: CalculationOptions
): CalculationResult {
  if (!length || !height) {
    throw new Error('Both length and height are required');
  }
  let wallArea = length * height;
  let openings = options?.openings || [];
  if (openings.length) {
    const openingsArea = openings.reduce((sum, op) => sum + (op.length * op.width), 0);
    wallArea -= openingsArea;
  }
  const numberOfBricks = wallArea * BRICKS_PER_SQM;
  const mortarVolume = wallArea * MORTAR_THICKNESS;
  const cementForMortar = mortarVolume * MORTAR_CEMENT_RATIO * MORTAR_WASTAGE_FACTOR;

  return {
    elementType: "masonry_wall",
    dimensions: { length, height, area: wallArea },
    openings,
    results: {
      'Surface mur (m²)': roundToDecimal(wallArea, 2),
      'Nombre de briques': Math.ceil(numberOfBricks),
      'Volume mortier (m³)': roundToDecimal(mortarVolume, 3),
      'Ciment pour mortier (kg)': roundToDecimal(cementForMortar, 2)
    }
  };
}

// Updated interface
interface CalculationParams {
  elementType: string;
  length: number;
  width?: number;
  height?: number;
  options?: CalculationOptions;
}
interface DoorCalculationOptions extends CalculationParams {
  variant?: 'intérieur' | 'extérieur';
  woodType?: 'umuvura' | 'eucalyptus' | 'acajou' | 'autre';
  includeHardware?: boolean;
  includeFrames?: boolean;
  includeFinish?: boolean;
}
interface WoodenDoorOptions extends CalculationParams {
  /**
   * Door variant type
   * @default 'intérieur'
   */
  variant?: 'intérieur' | 'extérieur';
  
  /**
   * Type of wood material
   * @default 'umuvura'
   */
  woodType?: 'umuvura' | 'eucalyptus' | 'acajou' | 'autre';
  
  /**
   * Whether to include hardware calculations
   * @default true
   */
  includeHardware?: boolean;
  
  /**
   * Whether to include door frame calculations
   * @default true
   */
  includeFrames?: boolean;
  
  /**
   * Whether to include finish surface calculations
   * @default true
   */
  includeFinish?: boolean;
  
  /**
   * Custom door dimensions (overrides standard dimensions)
   */
  customDimensions?: {
    length?: number;
    width?: number;
    thickness?: number;
  };
  
  /**
   * Custom frame dimensions (overrides standard frame dimensions)
   */
  customFrame?: {
    length?: number;
    width?: number;
    thickness?: number;
  };
}
interface DoorCalculationResult {
    count: number;
    volume: number;
    weight: number;
    woodType: string;
    variant: string;
    frameVolume?: number;
    frameWeight?: number;
    totalVolume?: number;
    hinges?: number;
    handles?: number;
    locks?: number;
    finishArea?: number;
}

export function calculateAdvancedQuantities(
  elementType: string,
  length: number,
  width?: number,
  height?: number,
  options?: CalculationOptions
): CalculationResult {
  const dims: any = { length };
  if (width !== undefined) dims.width = width;
  if (height !== undefined) dims.height = height;
  let openings = options?.openings || [];

  switch (elementType.toLowerCase()) {
    case 'dalle béton':
    case 'concrete_slab':
      if (width && height) {
        return calculateConcreteSlab(length, width, height, options);
      }
      throw new Error('Width and height are required for concrete slab calculation');

    case 'mur maçonnerie':
    case 'masonry_wall':
      if (height) {
        return calculateMasonryWall(length, height, options);
      }
      throw new Error('Height is required for masonry wall calculation');

    case 'plancher corps creux':
    case 'hollow_core_slab':
      if (width && height) {
        const slab = calculateConcreteSlab(length, width, height, options);
        return {
          ...slab,
          results: {
            ...slab.results,
            'Nombre entrevous': Math.ceil((length * width) * ENTREVOUS_PER_SQM * MATERIAL_WASTAGE_FACTOR)
          }
        };
      }
      throw new Error('Width and height are required for hollow core slab calculation');

    case 'ferraillage':
    case 'rebar':
      if (width) {
        const surface = length * width;
        const weight = surface * (options?.dosage || REBAR_DOSAGE_DEFAULT);
        return {
          elementType,
          dimensions: { length, width },
          openings,
          results: {
            'Surface (m²)': roundToDecimal(surface, 2),
            'Poids ferraillage (kg)': roundToDecimal(weight, 2)
          }
        };
      }
      throw new Error('Width is required for rebar calculation');

    case 'portes en bois':
    case 'wooden_doors': {
      const doorOptions = options as WoodenDoorOptions | undefined;
      const variant = doorOptions?.variant || 'intérieur';
      const woodType = doorOptions?.woodType || 'umuvura';
      const count = length; // Using length parameter to pass count

      // Standard specifications
      const standardSpecs = {
        'intérieur': {
          dimensions: { length: 2.1, width: 0.9, thickness: 0.04 },
          frame: { length: 2.15, width: 0.05, thickness: 0.1 },
          hardware: { hinges: 3, handles: 1, locks: 0 }
        },
        'extérieur': {
          dimensions: { length: 2.1, width: 1.0, thickness: 0.05 },
          frame: { length: 2.15, width: 0.07, thickness: 0.12 },
          hardware: { hinges: 4, handles: 1, locks: 1 }
        }
      };

      // Wood density (kg/m³)
      const woodDensity = {
        umuvura: 650,
        eucalyptus: 750,
        acajou: 850,
        autre: 700
      };

      const spec = standardSpecs[variant];
      const density = woodDensity[woodType];

      // Main calculations
      const doorVolume = spec.dimensions.length * spec.dimensions.width * spec.dimensions.thickness * count;
      const doorWeight = doorVolume * density;

      const results: { [key: string]: number | string } = {
        'Type de porte': variant === 'intérieur' ? 'Intérieure' : 'Extérieure',
        'Nombre de portes': count,
        'Essence de bois': woodType.charAt(0).toUpperCase() + woodType.slice(1),
        'Volume porte (m³)': roundToDecimal(doorVolume, 3),
        'Poids porte (kg)': Math.round(doorWeight)
      };

      // Frame calculations
      if (doorOptions?.includeFrames !== false) {
        const frameVolume = spec.frame.length * spec.frame.width * spec.frame.thickness * count;
        const frameWeight = frameVolume * density;
        results['Volume cadre (m³)'] = roundToDecimal(frameVolume, 3);
        results['Poids cadre (kg)'] = Math.round(frameWeight);
        results['Volume total bois (m³)'] = roundToDecimal(doorVolume + frameVolume, 3);
      }

      // Hardware calculations
      if (doorOptions?.includeHardware !== false) {
        results['Paumelles'] = count * spec.hardware.hinges;
        results['Poignées'] = count * spec.hardware.handles;
        if (variant === 'extérieur') {
          results['Serrures'] = count * spec.hardware.locks;
        }
      }

      // Finish calculations
      if (doorOptions?.includeFinish !== false) {
        const finishArea = (
          (spec.dimensions.length * spec.dimensions.width) * 2 + // Both sides
          (spec.dimensions.length * spec.dimensions.thickness) * 2 +
          (spec.dimensions.width * spec.dimensions.thickness) * 2
        ) * count;
        results['Surface à finir (m²)'] = roundToDecimal(finishArea, 2);
      }

      return {
        elementType,
        dimensions: { count },
        openings,
        results
      };
    }

    default:
      // Generic fallback
      const results: { [key: string]: number | string } = {};
      if (width && height) {
        results['Volume (m³)'] = roundToDecimal(length * width * height, 3);
      }
      if (width) {
        results['Surface (m²)'] = roundToDecimal(length * width, 2);
      }
      results['Longueur (m)'] = roundToDecimal(length, 2);
      if (width) results['Largeur (m)'] = roundToDecimal(width, 2);
      if (height) results['Hauteur (m)'] = roundToDecimal(height, 2);
      return {
        elementType,
        dimensions: dims,
        openings,
        results
      };
  }
}

// Helper function for consistent decimal rounding
function roundToDecimal(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Use elementTypes for validation
export function isValidElementType(type: string): boolean {
  return elementTypes.includes(type);
}

// Example: Use DevisLine for a line in a bill of quantities
export function createInvoiceLine(
  designation: string,
  quantity: number,
  unit: string,
  unitPrice: number
): InvoiceLine {
  return { 
  id: "",
  number: "",
  designation: "",
  unit: "",
  quantity: 0,
  unitPrice: 0,
   totalPrice: roundToDecimal(quantity * unitPrice, 2),
};
}