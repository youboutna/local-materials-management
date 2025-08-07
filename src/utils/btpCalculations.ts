import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";
import { toast } from "@/hooks/use-toast";

// PDF.js worker config
pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.js`;

import {
  CalculationOptions, Opening, CalculationResult,
  InvoiceLine, STANDARD_OPENINGS, elementTypes,
  ElementType, detectElementType, mapToElementType, CalculationParams,RebarColumnCalculation,
  MasonryMaterials, ConcreteMaterials, RebarMaterials, ConcreteOptions,
  MasonryCalculation, ConcreteCalculation, RebarCalculation,
  BrickJointsCalculation,ConcreteMixCalculation,
  PlasterCalculation
} from "@/utils/types";
import { number } from "framer-motion";

// Constants for better maintainability
const DEFAULT_CONCRETE_DOSAGE = 350; // kg/m³
const MATERIAL_WASTAGE_FACTOR = 1.1; // 10% wastage
const CEMENT_BAG_WEIGHT = 50; // kg
const STANDARD_REBAR_WEIGHT = 0.888; // kg/m for 12mm rebar
const STANDARD_PLASTER_THICKNESS = 0.02; // 2cm
const STANDARD_PLASTER_DOSAGE = 5; // kg/m²
const BRICKS_PER_SQM = 13;
const MORTAR_THICKNESS = 0.02; // meters
const MORTAR_CEMENT_RATIO = 400; // kg/m³
const MORTAR_WASTAGE_FACTOR = 1.3;
const SAND_VOLUME_RATIO = 0.4;
const GRAVEL_VOLUME_RATIO = 0.8;
const ENTREVOUS_PER_SQM = 7.2;
const REBAR_DOSAGE_DEFAULT = 80; // kg/m²
const DEFAULT_PLASTER_DOSAGE = 7; // kg/m²
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

// Updated interface
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

interface WoodenDoorSpecs {
  dimensions: {
    length: number;
    width: number;
    thickness: number;
  };
  frame: {
    length: number;
    width: number;
    thickness: number;
  };
  hardware: {
    hinges: number;
    handles: number;
    locks: number;
  };
}

// Use elementTypes for validation
export function isValidElementType(type: string): boolean {
  return elementTypes.some(et => et.value === type);
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
    designation: designation,
    unit: unit,
    quantity: quantity,
    unitPrice: unitPrice,
    totalPrice: roundToDecimal(quantity * unitPrice, 2),
  };
}

// calculation function
export function calculateConcreteSlab(
  length: number,
  width: number,
  height: number,
  options?: CalculationOptions
): CalculationResult {
  // Input validation
  if (isNaN(length) || isNaN(width) || isNaN(height)) {
    throw new Error('All dimensions must be valid numbers');
  }

  const dosage = options?.dosage || DEFAULT_CONCRETE_DOSAGE;
  let volume = length * width * height;

  // Process openings safely
  const openings = options?.openings || [];
  if (openings.length > 0) {
    const openingsArea = openings.reduce((sum, op) => {
      // Validate each opening
      if (isNaN(op.length) || isNaN(op.width)) {
        console.warn('Invalid opening dimensions:', op);
        return sum;
      }
      return sum + (op.length * op.width);
    }, 0);
    
    volume -= openingsArea * height;
  }

  // Calculate materials
  const cement = volume * dosage;
  const cementBags = Math.ceil(cement / CEMENT_BAG_WEIGHT);

  return {
    elementType: "concrete_slab",
    dimensions: { length, width, height },
    openings,
    results: {
      'Volume béton (m³)': roundToDecimal(volume, 3),
      'Ciment (kg)': roundToDecimal(cement, 2),
      'Sacs ciment (50kg)': cementBags,
      'Ciment (tonnes)': roundToDecimal(cement / TONNE_TO_KG, 3)
    }
  };
}

// Use CalculationResult as return type
export function calculateMasonryWall(
  length: number,
  height: number,
  options?: CalculationOptions
): MasonryCalculation {
  if (!length || !height) {
    throw new Error('Both length and height are required');
  }
  let wallArea = length * height;
  const openings = options?.openings || [];
  if (openings.length) {
    const openingsArea = openings.reduce((sum, op) => sum + (op.length * op.width), 0);
    wallArea -= openingsArea;
  }
  const numberOfBricks = wallArea * BRICKS_PER_SQM;
  const mortarVolume = wallArea * MORTAR_THICKNESS;
  const cementForMortar = mortarVolume * MORTAR_CEMENT_RATIO * MORTAR_WASTAGE_FACTOR;

  return {
    netSurface: wallArea,
    bricks: numberOfBricks,
    mortar: mortarVolume,
    elementType: "masonry_wall",
    dimensions: { length, height },
    openings,
    results: {
      'Surface mur (m²)': roundToDecimal(wallArea, 2),
      'Nombre de briques': Math.ceil(numberOfBricks),
      'Volume mortier (m³)': roundToDecimal(mortarVolume, 3),
      'Ciment pour mortier (kg)': roundToDecimal(cementForMortar, 2)
    }
  };
}

// Calculation Functions
function calculateWoodenDoor(params: WoodenDoorOptions): CalculationResult {
  const { length: count = 1, variant = 'intérieur', woodType = 'umuvura' } = params;
  const doorCount = Math.max(1, Math.round(count));

  const standardSpecs: Record<string, WoodenDoorSpecs> = {
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

  const woodDensity: Record<string, number> = {
    umuvura: 650,
    eucalyptus: 750,
    acajou: 850,
    autre: 700
  };

  const spec = standardSpecs[variant];
  const density = woodDensity[woodType];
  const doorDims = params.customDimensions || spec.dimensions;
  const frameDims = params.customFrame || spec.frame;

  // Main calculations
  const doorVolume = (doorDims.length || 0) * (doorDims.width || 0) * (doorDims.thickness || 0) * doorCount;
  const doorWeight = doorVolume * density;

  const results: Record<string, number | string> = {
    'Type de porte': variant === 'intérieur' ? 'Intérieure' : 'Extérieure',
    'Nombre de portes': doorCount,
    'Essence de bois': woodType.charAt(0).toUpperCase() + woodType.slice(1),
    'Volume porte (m³)': roundToDecimal(doorVolume, 3),
    'Poids porte (kg)': Math.round(doorWeight)
  };

  // Frame calculations
  if (params.includeFrames !== false) {
    const frameVolume = (frameDims.length || 0) * (frameDims.width || 0) * (frameDims.thickness || 0) * doorCount;
    const frameWeight = frameVolume * density;
    results['Volume cadre (m³)'] = roundToDecimal(frameVolume, 3);
    results['Poids cadre (kg)'] = Math.round(frameWeight);
    results['Volume total bois (m³)'] = roundToDecimal(doorVolume + frameVolume, 3);
  }

  // Hardware calculations
  if (params.includeHardware !== false) {
    results['Paumelles'] = doorCount * spec.hardware.hinges;
    results['Poignées'] = doorCount * spec.hardware.handles;
    if (variant === 'extérieur') {
      results['Serrures'] = doorCount * spec.hardware.locks;
    }
  }

  // Finish calculations
  if (params.includeFinish !== false) {
    const finishArea = (
      ((doorDims.length || 0) * (doorDims.width || 0)) * 2 + // Both sides
      ((doorDims.length || 0) * (doorDims.thickness || 0)) * 2 +
      ((doorDims.width || 0) * (doorDims.thickness || 0)) * 2
    ) * doorCount;
    results['Surface à finir (m²)'] = roundToDecimal(finishArea, 2);
  }

  return {
    elementType: 'wooden_doors',
    dimensions: { length: doorCount, width: 0, height: 0, count: doorCount },
    openings: [],
    results,
    metadata: {
      description: `Calcul pour portes en bois ${variant} en ${woodType}`
    }
  };
}

// functions
export function calculateHollowBlockWall(length: number, height: number) {
  const surface = length * height;
  const blocks = surface * 10; // assumed 10 blocks/m²
  return { surface, blocks };
}

export function calculateConcreteColumn(height: number, sectionArea: number, dosage: number = DEFAULT_CONCRETE_DOSAGE) {
  const volume = height * sectionArea;
  const cement = volume * dosage;
  return { volume, cement };
}

export function calculateConcreteBeam(length: number, sectionArea: number, dosage: number = DEFAULT_CONCRETE_DOSAGE) {
  const volume = length * sectionArea;
  const cement = volume * dosage;
  return { volume, cement };
}

export function calculateConcreteFooting(length: number, width: number, height: number, dosage: number = DEFAULT_CONCRETE_DOSAGE) {
  const volume = length * width * height;
  const cement = volume * dosage;
  return { volume, cement };
}

export function calculateConcreteStripFooting(length: number, width: number, height: number, dosage: number = DEFAULT_CONCRETE_DOSAGE) {
  return calculateConcreteFooting(length, width, height, dosage);
}

export function calculateCementForPlaster(length: number, height: number, thickness: number = STANDARD_PLASTER_THICKNESS, dosage: number = 1500) {
  const surface = length * height;
  const volume = surface * thickness;
  const cement = volume * dosage;
  return { surface, volume, cement };
}

export function calculateCementForBrickJoints(surface: number, dosage: number = 400) {
  const volume = surface * MORTAR_THICKNESS;
  const cement = volume * dosage;
  return { volume, cement };
}

export function calculateRebarForColumn(height: number, bars: number, barLength: number, barWeightPerMeter: number) {
  const totalLength = bars * barLength;
  const weight = totalLength * barWeightPerMeter;
  return { totalLength, weight };
}

export function calculateRebarForSlab(surface: number, kgPerM2: number = 60) {
  const weight = surface * kgPerM2;
  return { surface, weight };
}

export function calculateRebarForFooting(length: number, width: number, kgPerM2: number = 80) {
  const surface = length * width;
  const weight = surface * kgPerM2;
  return { surface, weight };
}

export function calculateConcreteMix(volume: number, cementRatio: number = 350, gravelRatio: number = 1050, sandRatio: number = 700) {
  const cement = volume * cementRatio;
  const gravel = volume * gravelRatio;
  const sand = volume * sandRatio;
  return { volume, cement, gravel, sand };
}

export function calculateConcretePrefabricatedGirder(count: number, volumePerUnit: number, dosage: number = DEFAULT_CONCRETE_DOSAGE) {
  const volume = count * volumePerUnit;
  const cement = volume * dosage;
  return { volume, cement };
}

export function calculatePrecastSlab(surface: number) {
  const units = surface * ENTREVOUS_PER_SQM;
  return { surface, units };
}

export function calculateVolume(length: number, width: number, height: number) {
  return length * width * height;
}

// ======================
// Core Helper Functions
// ======================
function roundToDecimal(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function validateDimensions(...dimensions: (number | undefined)[]): void {
  if (dimensions.some(dim => dim !== undefined && (dim <= 0 || isNaN(dim)))) {
    throw new Error('All dimensions must be positive numbers');
  }
}

function calculateOpeningsArea(openings: Opening[]): number {
  return openings.reduce((total, opening) => {
    validateDimensions(opening.length, opening.width);
    return total + (opening.length * opening.width);
  }, 0);
}

function calculateOpeningsVolume(openings: Opening[], defaultHeight: number): number {
  return openings.reduce((total, opening) => {
    validateDimensions(opening.length, opening.width);
    const height = opening.height ?? defaultHeight;
    return total + (opening.length * opening.width * height);
  }, 0);
}

// ======================
// Element-Specific Functions
// ======================
function masonryWallResult(
  type: string,
  length: number,
  height: number,
  openings: Opening[] = [],
  calculation: MasonryCalculation
): MasonryCalculation {
  validateDimensions(length, height);
  calculation.elementType = type;
  calculation.dimensions = { length, height };
  calculation.openings = openings;
  calculation.results = {
      'Surface nette (m²)': roundToDecimal(calculation.netSurface, 2),
      'Nombre briques': Math.ceil(calculation.bricks * MATERIAL_WASTAGE_FACTOR),
      'Mortier (m³)': roundToDecimal(calculation.netSurface * MORTAR_THICKNESS, 3),
      'Ciment mortier (kg)': roundToDecimal((calculation.netSurface * MORTAR_THICKNESS * DEFAULT_CONCRETE_DOSAGE), 1)
    }
  return calculation;
}

function concreteElementResult(
  type: string,
  length: number,
  width: number,
  height: number,
  openings: Opening[] = [],
  calculation: ConcreteCalculation
): ConcreteCalculation {
  validateDimensions(length, width, height);

  calculation.elementType = type;
  calculation.dimensions = { length, width, height };
  calculation.openings = openings;

  const results: Record<string, number> = {
    'Volume béton (m³)': roundToDecimal(calculation.volume, 3),
    'Ciment (kg)': roundToDecimal(calculation.cement, 2),
    'Sacs ciment (50kg)': Math.ceil(calculation.cement / CEMENT_BAG_WEIGHT)
  };

  if (calculation.sand) results['Sable (m³)'] = roundToDecimal(calculation.sand, 3);
  if (calculation.gravel) results['Gravier (m³)'] = roundToDecimal(calculation.gravel, 3);
  calculation.results = results;
  return  calculation;
}

function rebarElementResult(
  type: string,
  length: number,
  width: number,
  height: number,
  openings: Opening[] = [],
  calculation: RebarCalculation
): RebarCalculation {
  validateDimensions(length, width, height);
  calculation.elementType = type;
  calculation.dimensions = { length, width, height };
  calculation.openings = openings;
  calculation.results = {
    'Longueur totale acier (m)': roundToDecimal(calculation.totalLength, 2),
    'Poids total acier (kg)': roundToDecimal(calculation.totalWeight, 2),
    'Nombre barres': calculation.barCount || 4
  }
  return calculation;
}

function plasterResult(
  type: string,
  length: number,
  height: number,
  openings: Opening[] = [],
  calculation: PlasterCalculation
): PlasterCalculation {
  validateDimensions(length, height);
  calculation.elementType = type;
  calculation.dimensions = { length,height };
  calculation.openings = openings;
calculation.results =  {
      'Surface enduit (m²)': roundToDecimal(calculation.surface, 2),
      'Volume mortier (m³)': roundToDecimal(calculation.volume, 3),
      'Ciment (kg)': roundToDecimal(calculation.cement, 2)
    }
  return calculation ;
}

// ======================
// Specialized Element Functions
// ======================
function concreteVolumeResult(
  type: string,
  length: number,
  width: number,
  height: number,
  openings: Opening[] = [],
  calculation: ConcreteCalculation
): ConcreteCalculation {
  return concreteElementResult(type, length, width, height, openings, calculation);
}

// Rebar elements (using rebarElementResult)
const rebarSlabResult = (type: string, length: number, width: number, openings: Opening[], slab: RebarCalculation) => 
  rebarElementResult(type, length, width, 0, openings, slab);

const rebarFootingResult = (type: string, length: number, width: number, openings: Opening[], footing: RebarCalculation) => 
  rebarElementResult(type, length, width, 0, openings, footing);

// ======================
// Other Element Functions
// ======================
function hollowBlockWallResult(
  type: string,
  length: number,
  height: number,
  openings: Opening[] = [],
  calculation: { surface: number; blocks: number }
): CalculationResult {
  validateDimensions(length, height);

  return {
    elementType: type,
    dimensions: { length, height },
    openings,
    results: {
      'Surface (m²)': roundToDecimal(calculation.surface, 2),
      'Nombre parpaings': Math.ceil(calculation.blocks * MATERIAL_WASTAGE_FACTOR)
    }
  };
}

function precastSlabResult(
  type: string,
  length: number,
  width: number,
  openings: Opening[] = [],
  calculation: { elements: number }
): CalculationResult {
  validateDimensions(length, width);

  return {
    elementType: type,
    dimensions: { length, width },
    openings,
    results: {
      'Surface dalle (m²)': roundToDecimal(length * width, 2),
      'Nombre éléments': Math.ceil(calculation.elements)
    }
  };
}



function rebarColumnResult(
  type: string,
  height: number,
  diameter: number,
  openings: Opening[] = [],
  calculation: RebarColumnCalculation,
  options?: {
    barCount?: number;
    barDiameter?: number;
  }
): RebarColumnCalculation {
  validateDimensions(height, diameter);


calculation.results = {
      'Hauteur colonne (m)': roundToDecimal(height, 2),
      'Diamètre colonne (m)': roundToDecimal(diameter, 2),
      'Longueur totale acier (m)': roundToDecimal(calculation.totalLength, 2),
      'Poids total acier (kg)': roundToDecimal(calculation.totalWeight, 2),
      'Nombre barres': calculation.barCount || options?.barCount || 4,
      ...(options?.barDiameter && { 'Diamètre barres (mm)': options.barDiameter })
    };
  calculation.elementType = type;
  calculation.dimensions = { length,  height };
  calculation.openings = openings;
calculation.barDiameter =diameter;
calculation.metadata = {
      type: 'column-rebar',
      unitWeights: calculation.totalWeight / calculation.totalLength
    };
  return calculation;
}

// ======================
// Brick Joints Result
// ======================

function brickJointsResult(
  type: string,
  length: number,
  height: number,
  openings: Opening[] = [],
  surface: number,
  calculation: BrickJointsCalculation
): BrickJointsCalculation {
  validateDimensions(length, height);

  calculation.dimensions=  { length, height };
  calculation.openings = openings;
  calculation.elementType = type;
  calculation.metadata =  {
      type: 'brick-joints',
      coverageRate: calculation.cementWeight / calculation.jointVolume
    };
    calculation.results ={
      'Surface mur (m²)': roundToDecimal(surface, 2),
      'Surface joints (m²)': roundToDecimal(calculation.jointArea, 2),
      'Volume joints (m³)': roundToDecimal(calculation.jointVolume, 4),
      'Ciment joints (kg)': roundToDecimal(calculation.cementWeight, 2),
      ...(calculation.jointThickness && { 'Épaisseur joints (m)': roundToDecimal(calculation.jointThickness, 3) })
    }
  return calculation;
}


function concreteMixResult(
  type: string,
  volume: number,
  calculation: ConcreteMixCalculation,
  options?: {
    mixType?: string;
    additives?: string[];
  }
): ConcreteMixCalculation {
  validateDimensions(volume);

  return {
    elementType: type,
    totalVolume: roundToDecimal(calculation.totalVolume, 3),
    cementWeight:  roundToDecimal(calculation.cementWeight, 2),
    sandVolume:  roundToDecimal(calculation.sandVolume, 3),
    gravelVolume: roundToDecimal(calculation.gravelVolume, 3),
    dimensions: { volume },
    results: {
      'Volume total (m³)': roundToDecimal(calculation.totalVolume, 3),
      'Ciment (kg)': roundToDecimal(calculation.cementWeight, 2),
      'Sable (m³)': roundToDecimal(calculation.sandVolume, 3),
      'Gravier (m³)': roundToDecimal(calculation.gravelVolume, 3),
      ...(calculation.waterVolume && { 'Eau (L)': roundToDecimal(calculation.waterVolume * 1000, 1) }),
      ...(calculation.mixRatio && { 'Ratio mélange': calculation.mixRatio })
    },
    metadata: {
      type: 'concrete-mix',
      ...(options?.mixType && { mixType: options.mixType }),
      ...(options?.additives && { additives: options.additives })
    }
  };
}

// ======================
// Utility Functions
// ======================
function basicCalculationResult(
  type: string,
  length: number,
  width?: number,
  height?: number,
  openings: Opening[] = []
): CalculationResult {
  validateDimensions(length, width, height);

  const results: Record<string, number> = {
    'Longueur (m)': roundToDecimal(length, 2)
  };

  if (width !== undefined) {
    results['Largeur (m)'] = roundToDecimal(width, 2);
    results['Surface (m²)'] = roundToDecimal(length * width, 2);
  }

  if (height !== undefined && width !== undefined) {
    results['Volume (m³)'] = roundToDecimal(length * width * height, 3);
  }

  return {
    elementType: type,
    dimensions: { length, width, height },
    openings,
    results
  };
}

function errorResult(
  type: string,
  dimensions: { length?: number; width?: number; height?: number },
  error: Error,
  metadata?: Record<string, any>
): CalculationResult {
  return {
    elementType: type,
    dimensions: { length: dimensions.length || 0, width: dimensions.width, height: dimensions.height },
    results: {
      'Erreur': error.message
    }
  };
}

// ======================
// Calculation Functions
// ======================
function calculateConcreteVolume(
  length: number,
  width: number,
  height: number,
  openings: Opening[] = [],
  dosage: number = DEFAULT_CONCRETE_DOSAGE,
) {
  validateDimensions(length, width, height);

  const grossVolume = length * width * height;
  const openingsVolume = calculateOpeningsVolume(openings, height);
  const netVolume = grossVolume - openingsVolume;

  return {
  dimensions : { length, width, height },
  openings : openings,
    volume: netVolume,
    cement: netVolume * dosage,
    sand: netVolume * 0.5 * MATERIAL_WASTAGE_FACTOR,
    gravel: netVolume * 0.8 * MATERIAL_WASTAGE_FACTOR
  };
}

function calculateTotalOpeningsArea(openings: Opening[]): number {
  return openings.reduce((total, opening) => {
    validateDimensions(opening.length, opening.width);
    return total + (opening.length * opening.width);
  }, 0);
}

// Validation helpers
function validateHeight(height?: number): void {
  if (height === undefined) throw new Error('Height is required');
}

function validateWidthHeight(width?: number, height?: number): void {
  if (width === undefined || height === undefined) throw new Error('Width and height are required');
}

function validateWidth(width?: number): void {
  if (width === undefined) throw new Error('Width is required');
}

/**
 * Fonction principale de calcul de metré
 * @param params 
 * @returns 
 */
export function calculateAdvancedQuantities(params: CalculationParams): CalculationResult {
  const { elementType, length, width = 1, height = 1, options } = params;
  const openings = options?.openings || [];
  const detectedType = elementType;
  console.log(detectedType);
  
  try {
    validateDimensions(length);
    if (width !== undefined) validateWidth(width);
    if (height !== undefined) validateHeight(height);

    switch (detectedType) {
      // Masonry Elements
      case 'masonry_wall': {
        validateHeight(height);
        const wall = calculateMasonryWall(length, height, options);
        return masonryWallResult(detectedType, length, height, openings, wall);
      }

      case 'hollow_block_wall': {
        validateHeight(height);
        const wall = calculateHollowBlockWall(length, height);
        return hollowBlockWallResult(detectedType, length, height, openings, wall);
      }

      // Concrete Elements
      case 'concrete_slab': {
        validateWidthHeight(width, height);
        const slab = calculateConcreteVolume(length, width, height, openings, options?.dosage);
        return concreteElementResult(detectedType, length, width, height, openings, {
          ...slab,
          dosage: options?.dosage || DEFAULT_CONCRETE_DOSAGE,
          elementType: detectedType,
          results: {}
        });
      }

      case 'concrete_column': {
        validateWidth(width);
        const columnHeight = height || length;
        const column = calculateConcreteVolume(width, width, columnHeight, openings, options?.dosage);
        return concreteElementResult(detectedType, width, width, columnHeight, openings, {
          ...column,
          dosage: options?.dosage || DEFAULT_CONCRETE_DOSAGE,
          elementType: detectedType,
          results: {}
        });
      }

      case 'concrete_beam': {
        validateWidthHeight(width, height);
        const beam = calculateConcreteVolume(length, width, height, openings, options?.dosage);
        return concreteElementResult(detectedType, length, width, height, openings, {
          ...beam,
          dosage: options?.dosage || DEFAULT_CONCRETE_DOSAGE,
          elementType: detectedType,
          results: {}
        });
      }

      case 'concrete_footing': {
        validateWidthHeight(width, height);
        const footing = calculateConcreteVolume(length, width, height, openings, options?.dosage);
        return concreteElementResult(detectedType, length, width, height, openings, {
          ...footing,
          dosage: options?.dosage || DEFAULT_CONCRETE_DOSAGE,
          elementType: detectedType,
          results: {}
        });
      }

      case 'concrete_strip_footing': {
        validateWidthHeight(width, height);
        const footing = calculateConcreteVolume(length, width, height, openings, options?.dosage);
        return concreteElementResult(detectedType, length, width, height, openings, {
          ...footing,
          dosage: options?.dosage || DEFAULT_CONCRETE_DOSAGE,
          elementType: detectedType,
          results: {}
        });
      }

      // Reinforcement
      case 'rebar_column': {
        const rebar = calculateRebarForColumn(
          height || length,
          4,
          height || length,
          0.888
        );
        return rebarColumnResult(detectedType, height || length, width || 0.3, openings, {
          totalLength: rebar.totalLength,
          totalWeight: rebar.weight,
          barCount: 4,
          elementType: detectedType,
          dimensions: { length: height || length, height: height || length },
          results: {}
        });
      }

      case 'rebar_slab': {
        validateWidth(width);
        const slab = calculateRebarForSlab(length * width, 60);
        return rebarSlabResult(detectedType, length, width, openings, {
          totalLength: slab.surface * 10,
          totalWeight: slab.weight,
          barCount: Math.ceil(slab.surface),
          elementType: detectedType,
          dimensions: { length, width },
          results: {}
        });
      }

      case 'rebar_footing': {
        validateWidth(width);
        const footing = calculateRebarForFooting(length, width, 80);
        return rebarFootingResult(detectedType, length, width, openings, {
          totalLength: footing.surface * 12,
          totalWeight: footing.weight,
          barCount: Math.ceil(footing.surface * 2),
          elementType: detectedType,
          dimensions: { length, width },
          results: {}
        });
      }

      // Finishes
      case 'plaster': {
        validateHeight(height);
        const plaster = calculateCementForPlaster(length, height, options?.thickness, options?.dosage);
        return plasterResult(detectedType, length, height, openings, {
          surface: plaster.surface,
          volume: plaster.volume,
          cement: plaster.cement,
          elementType: detectedType,
          dimensions: { length, height },
          results: {}
        });
      }

      case 'brick_joints': {
        validateHeight(height);
        const surface = length * height;
        const joints = calculateCementForBrickJoints(surface, options?.dosage);
        return brickJointsResult(detectedType, length, height, openings, surface, {
          jointArea: surface * 0.1,
          jointVolume: joints.volume,
          cementWeight: joints.cement,
          elementType: detectedType,
          dimensions: { length, height },
          results: {}
        });
      }

      // Prefabricated Elements
      case 'prefab_girder': {
        validateWidthHeight(width, height);
        const girder = calculateConcretePrefabricatedGirder(
          Math.round(length),
          width * height,
          options?.dosage
        );
        return concreteElementResult(detectedType, length, width, height, openings, {
          volume: girder.volume,
          cement: girder.cement,
          sand: girder.volume * 0.5,
          gravel: girder.volume * 0.8,
          dosage: options?.dosage || DEFAULT_CONCRETE_DOSAGE,
          elementType: detectedType,
          dimensions: { length, width, height },
          results: {}
        });
      }

      case 'precast_slab': {
        validateWidth(width);
        const slab = calculatePrecastSlab(length * width);
        return precastSlabResult(detectedType, length, width, openings, {
          elements: slab.units
        });
      }

      // Special Calculations
      case 'concrete_mix': {
        validateWidthHeight(width, height);
        const volume = length * width * height;
        const mix = calculateConcreteMix(volume, options?.dosage, 1050, 700);
        
        return {
          elementType: detectedType,
          dimensions: { length: volume, width: 1, height: 1 },
          results: {
            'Volume total (m³)': roundToDecimal(volume, 3),
            'Ciment (kg)': roundToDecimal(mix.cement, 2),
            'Sable (m³)': roundToDecimal(mix.sand / 1600, 3),
            'Gravier (m³)': roundToDecimal(mix.gravel / 1800, 3)
          }
        };
      }

      case 'wooden_doors': {
        return calculateWoodenDoor({ elementType: 'wooden_doors', length, width, height });
      }

      // Concrete Volume Calculation
      case 'concrete_volume': {
        validateWidthHeight(width, height);
        const concrete = calculateConcreteVolume(length, width, height, openings);
        return concreteElementResult(detectedType, length, width, height, openings, {
          ...concrete,
          dosage: DEFAULT_CONCRETE_DOSAGE,
          elementType: detectedType,
          results: {}
        });
      }
/* ---------------------------- */
      /*        SITE PREPARATION      */
      /* ---------------------------- */
      case 'vegetal_soil_stripping': {
        validateWidthHeight(width, height);
        const volume = length * width * height;
        return {
          elementType: detectedType,
          dimensions: { length, width, height },
          results: {
            'Volume terre végétale (m³)': roundToDecimal(volume, 2),
            'Poids terre végétale (tonnes)': roundToDecimal(volume * 1.5, 2)
          }
        };
      }

      case 'mass_excavation': {
        validateWidthHeight(width, height);
        const volume = length * width * height;
        return {
          elementType: detectedType,
          dimensions: { length, width, height },
          results: {
            'Volume excavation (m³)': roundToDecimal(volume, 2),
            'Temps engin (h)': roundToDecimal(volume / 15, 1) // 15m³/h productivity
          }
        };
      }

      /* ---------------------------- */
      /*      FOUNDATION & STRUCTURE  */
      /* ---------------------------- */
      case 'concrete_filling': {
        validateWidthHeight(width, height);
        const volume = length * width * height;
        const mix = calculateConcreteMix(volume, options?.dosage || 350);
        return {
          elementType: detectedType,
          dimensions: { length, width, height },
          results: {
            'Volume béton (m³)': roundToDecimal(volume, 2),
            'Ciment (kg)': roundToDecimal(mix.cement, 0),
            ...formatCementOutput(mix.cement),
            'Sable (m³)': roundToDecimal(mix.sand / 1600, 2),
            'Gravier (m³)': roundToDecimal(mix.gravel / 1800, 2)
          }
        };
      }

      /* ---------------------------- */
      /*      VERTICAL STRUCTURES     */
      /* ---------------------------- */
      case 'elevation_wall': {
        validateHeight(height);
        const surface = length * height;
        const blocks = Math.ceil(surface / 0.2); // 0.2m² per block
        const mortar = surface * 0.02; // 2cm mortar
        
        return {
          elementType: detectedType,
          dimensions: { length, height },
          results: {
            'Surface mur (m²)': roundToDecimal(surface, 2),
            'Blocs nécessaires': blocks,
            'Mortier (m³)': roundToDecimal(mortar, 3),
            'Ciment mortier (kg)': roundToDecimal(mortar * 350, 0)
          }
        };
      }

      case 'wood_framing_wall': {
        validateHeight(height);
        const surface = length * height;
        const studs = Math.ceil(length / 0.6) * Math.ceil(height / 2.4); // 60cm spacing, 2.4m height
        const panels = Math.ceil(surface / 2.88); // OSB panels 1.2x2.4m
        
        return {
          elementType: detectedType,
          dimensions: { length, height },
          results: {
            'Surface mur (m²)': roundToDecimal(surface, 2),
            'Montants bois (45x145mm)': studs,
            'Panneaux OSB (9mm)': panels,
            'Isolation (m²)': roundToDecimal(surface, 2)
          }
        };
      }

      /* ---------------------------- */
      /*         ROOFING SYSTEMS      */
      /* ---------------------------- */
      case 'roof_decking': {
        validateWidth(width);
        const surface = length * width;
        const laths = Math.ceil(surface * 3); // 3 laths per m²
        const underlayment = Math.ceil(surface / 50); // Rolls of 50m²
        
        return {
          elementType: detectedType,
          dimensions: { length, width },
          results: {
            'Surface toiture (m²)': roundToDecimal(surface, 2),
            'Liteaux (ml)': laths,
            'Écran sous-toiture (rouleaux)': underlayment
          }
        };
      }

      case 'synthetic_slate_roof': {
        validateWidth(width);
        const surface = length * width;
        const slates = Math.ceil(surface / 0.25); // 0.25m² per slate
        const hooks = Math.ceil(surface * 4); // 4 hooks per m²
        
        return {
          elementType: detectedType,
          dimensions: { length, width },
          results: {
            'Surface toiture (m²)': roundToDecimal(surface, 2),
            'Ardoises synthétiques': slates,
            'Crochets de fixation': hooks
          }
        };
      }

      case 'zinc_ridge': {
        const length = params.length;
        const zincSheets = Math.ceil(length / 2); // 2m sheets
        const screws = Math.ceil(length * 3); // 3 screws per meter
        
        return {
          elementType: detectedType,
          dimensions: { length },
          results: {
            'Longueur faîtage (ml)': roundToDecimal(length, 2),
            'Feuilles zinc': zincSheets,
            'Vis de fixation': screws
          }
        };
      }
      // Default case for generic calculations
      case 'basic_calculator': {
        return basicCalculationResult(detectedType, length, width, height, openings);
      }
        
      default: {
        return basicCalculationResult(detectedType, length, width, height, openings);
      }
    }
  } catch (error) {
    return errorResult(detectedType, { length, width, height }, error as Error);
  }
}

export const generateDimensionsFromQuantity = (quantity: number, unit: string) => {
  switch (unit.toLowerCase()) {
    case "m²":
    case "m2": {
      const side = Math.sqrt(quantity);
      return { length: side, width: side };
    }
    case "m³":
    case "m3": {
      const cube = Math.cbrt(quantity);
      return { length: cube, width: cube, height: cube };
    }
    case "ml":
      return { length: quantity, width: undefined, height: undefined };
    default:
      return { length: quantity, width: 1, height: 1 };
  }
};

// Extraction of construction lines from raw text
export const extractConstructionData = (text: string): CalculationResult[] => {
  const lines = text
    .split(/(?=\d{1,2}\.[\d\.]?)/g)
    .map((l) => l.trim())
    .filter(Boolean);

  const results: CalculationResult[] = [];
  const pattern = /^(\d{1,2}\.?\d*)\s+(.+?)\s+(ff|m2|m3|ml|pce|pcs|m²|m³)\s+(\d+[\d\s,]*)\s+(\d+[\d\s,]*)\s+(\d+[\d\s,]*)$/i;

  for (const line of lines) {
    const match = line.match(pattern);
    if (match) {
      const [, , designation, unitRaw, qtyStr, puStr, ptStr] = match;
      const elementType = mapToElementType(designation.trim());
      const quantity = parseFloat(qtyStr.replace(/\s/g, "").replace(",", "."));
      const unitPrice = parseFloat(puStr.replace(/\s/g, "").replace(",", "."));
      let prixTotal = parseFloat(ptStr.replace(/\s/g, "").replace(",", "."));
      if (!prixTotal || prixTotal === 0) {
        prixTotal = quantity * unitPrice;
      }

      // Set recommended openings for types that support it
      let openings: Opening[] | undefined = undefined;
      if (["concrete_slab", "masonry_wall"].includes(elementType)) {
        openings = STANDARD_OPENINGS;
      }

      results.push({
        elementType,
        originalLabel: designation.trim(),
        dimensions: generateDimensionsFromQuantity(quantity, unitRaw),
        openings,
        results: {
          Unité: unitRaw.trim(),
          Quantité: quantity,
          "Prix unitaire": unitPrice,
          "Prix total": prixTotal,
        },
      });
    }
  }
  return results;
};

export const isArchitecturalPlan = (text: string) => {
  const planWords = [
    "plan architectural", "plan d'architecte", "floor plan"
  ];
  const lower = text.toLowerCase();
  return planWords.some(word => lower.includes(word));
};

export const parsePdf = async (file: File): Promise<CalculationResult[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
    }

    if (fullText.trim().length < 20) {
      // OCR fallback
      fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport, canvas }).promise;

        const {
          data: { text: ocrText },
        } = await Tesseract.recognize(canvas, "fra", { logger: () => { } });
        fullText += ocrText + "\n";
      }
    }

    if (isArchitecturalPlan(fullText)) {
      toast({ title: "Plan architectural détecté", description: " ce document semble être un plan. L'extraction quantitative n'est pas applicable." });
      return [];
    }

    // Use the helper to extract lines
    const extractedLines = extractConstructionData(fullText);
    toast({ title: "Import réussi", description: `${extractedLines.length} lignes extraites.` });
    return extractedLines;
  } catch (error) {
    toast({ title: "Erreur", description: "Erreur lors de la lecture du PDF", variant: "destructive" });
    console.error(error);
    return [];
  }
};