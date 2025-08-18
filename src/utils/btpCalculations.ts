import * as pdfjsLib from "pdfjs-dist";
import * as  tesseract from "tesseract.js";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";

// PDF.js worker config
pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.js`;

import {
  CalculationOptions, Opening, CalculationResult,
  InvoiceLine, STANDARD_OPENINGS, elementTypes,
  ElementType, detectElementType, mapToElementType, CalculationParams, RebarColumnCalculation,
  MasonryMaterials, ConcreteMaterials, RebarMaterials, ConcreteOptions,
  MasonryCalculation, ConcreteCalculation, RebarCalculation,
  BrickJointsCalculation, ConcreteMixCalculation,
  PlasterCalculation, Dimensions
} from "@/utils/types";
import { number } from "framer-motion";
import { extend } from "leaflet";
import { Fullscreen } from "lucide-react";

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
/**
 * Creates a standardized invoice line for construction bills of quantities
 * with automatic element type detection and validation.
 */
export function createInvoiceLine(
  designation: string,
  quantity: number,
  unit: string,
  unitPrice: number,
  options?: {
    id?: string;
    lineNumber?: string;
    metadata?: Record<string, any>;
  }
): InvoiceLine {
  // Validate inputs
  if (typeof quantity !== 'number' || quantity <= 0) {
    throw new Error('Quantity must be a positive number');
  }
  if (typeof unitPrice !== 'number' || unitPrice < 0) {
    throw new Error('Unit price must be a non-negative number');
  }

  // Normalize unit
  const normalizedUnit = normalizeUnit(unit);

  // Detect element type and dimensions
  const elementType = mapToElementType(designation);
  const dimensions = generateDimensionsFromQuantity(quantity, normalizedUnit);

  // Calculate total price with rounding
  const totalPrice = roundToDecimal(quantity * unitPrice, 2);

  return {
    id: options?.id || generateId(),
    number: options?.lineNumber || '',
    designation: designation.trim(),
    unit: normalizedUnit,
    quantity,
    unitPrice,
    totalPrice,
    metadata: {
      elementType,
      dimensions,
      ...options?.metadata,
    }
  };
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};


// Map article code to work type
const getWorkTypeFromCode = (code: string): string => {
  const workTypes: Record<string, string> = {
    'A': 'Gros œuvre',
    'B': 'Installation chantier',
    'C': 'Préparation',
    'D': 'Terrassement',
    'E': 'Fondation',
    'F': 'Maçonnerie',
    'G': 'Béton armé',
    'H': 'Second œuvre',
    'I': 'Menuiserie',
    'J': 'Revêtement',
    'K': 'Électricité',
    'L': 'Plomberie',
    'M': 'Peinture',
    'N': 'VRD',
    'O': 'Toiture',
    'P': 'Étanchéité',
    'Q': 'Équipement',
    'R': 'Sécurité incendie',
    'S': 'Climatisation',
    'T': 'Ascenseurs',
    'U': 'Mobilier',
    'V': 'Nettoyage',
    'W': 'Voirie',
    'X': 'Signalisation',
    'Y': 'Énergie renouvelable',
    'Z': 'Divers'
  };

  const cleaned = code.trim().toUpperCase();
  return workTypes[cleaned] || 'Autre';
};


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
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

// Helper to format cement quantities into bag counts
function formatCementOutput(totalKg: number): Record<string, number> {
  const bags50 = Math.ceil(totalKg / 50);
  const bags35 = Math.ceil(totalKg / 35);
  return {
    'Sacs de ciment 50kg': bags50,
    'Sacs de ciment 35kg': bags35
  };
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
  return calculation;
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
  calculation.dimensions = { length, height };
  calculation.openings = openings;
  calculation.results = {
    'Surface enduit (m²)': roundToDecimal(calculation.surface, 2),
    'Volume mortier (m³)': roundToDecimal(calculation.volume, 3),
    'Ciment (kg)': roundToDecimal(calculation.cement, 2)
  }
  return calculation;
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
  calculation.dimensions = { length, height };
  calculation.openings = openings;
  calculation.barDiameter = diameter;
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

  calculation.dimensions = { length, height };
  calculation.openings = openings;
  calculation.elementType = type;
  calculation.metadata = {
    type: 'brick-joints',
    coverageRate: calculation.cementWeight / calculation.jointVolume
  };
  calculation.results = {
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
    cementWeight: roundToDecimal(calculation.cementWeight, 2),
    sandVolume: roundToDecimal(calculation.sandVolume, 3),
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
    dimensions: { length, width, height },
    openings: openings,
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
  const { elementType, length, width = 1, height = 1, options, quantity=1 } = params;
  const openings = options?.openings || [];
  const detectedType = elementType;
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
/**
 * Generates dimensional data from quantity and unit for construction calculations
 * 
 * @param quantity - The quantity value from the invoice line
 * @param unit - The unit of measurement (m², m³, ml, etc.)
 * @returns Dimensions object with appropriate length/width/height/count values
 */


export const generateDimensionsFromQuantity = (
  quantity: number,
  unit: string
): Dimensions => {
  // Validate inputs
  if (typeof quantity !== 'number' || quantity <= 0) {
    throw new Error('Quantity must be a positive number');
  }

  const normalizedUnit = unit.toLowerCase().trim();

  switch (normalizedUnit) {
    // Area units (m²)
    case "m²":
    case "m2": {
      const side = Math.sqrt(quantity);
      return {
        length: roundToDecimal(side, 2),
        width: roundToDecimal(side, 2),
        area: roundToDecimal(quantity, 2)
      };
    }

    // Volume units (m³)
    case "m³":
    case "m3": {
      const cube = Math.cbrt(quantity);
      return {
        length: roundToDecimal(cube, 2),
        width: roundToDecimal(cube, 2),
        height: roundToDecimal(cube, 2),
        volume: roundToDecimal(quantity, 2)
      };
    }

    // Linear units (ml)
    case "ml":
      return {
        length: roundToDecimal(quantity, 2),
        width: undefined,
        height: undefined
      };

    // Countable units
    case "unité":
    case "u":
    case "pce":
    case "pcs":
      return { count: Math.round(quantity), length: roundToDecimal(quantity, 2), };

    // Weight units (convert to volume estimates)
    case "kg":
    case "tonne":
      return {
        length: roundToDecimal(quantity, 2),
        weight: quantity,
        volume: roundToDecimal(quantity / 2400, 3) // Assuming 2400 kg/m³ density
      };

    // Default case for unknown units
    default:
      return {
        length: roundToDecimal(quantity, 2),
        width: 1,
        height: 1,
        metadata: { originalUnit: unit }
      };
  }
};


// Example usage:
// const slabDims = generateDimensionsFromQuantity(25, "m²"); 
// Returns { length: 5, width: 5, area: 25 }
//
// const concreteDims = generateDimensionsFromQuantity(8, "m³");
// Returns { length: 2, width: 2, height: 2, volume: 8 }
//
// const linearDims = generateDimensionsFromQuantity(10, "ml");
// Returns { length: 10, width: undefined, height: undefined }

interface ConstructionLine extends InvoiceLine {
  lot?: string;
  article?: string;
  code?: string;
  unit: string;
}
/**
 * Extracts structured construction data from a raw text document.
 * Matches lines containing construction item codes, descriptions, units, quantities, and prices.
 *
 * @param text Raw text (possibly from OCR or PDF) containing quantity survey lines
 * @returns Parsed structured data array
 */

const UNIT_CANDIDATES = ['m²', 'm2', 'm³', 'm3', 'ml', 'u', 'ens', 'kg', 'tonne', 'pm'];

/**
 * Helper function for advanced text splitting
 */
function splitTextWithPatterns(text: string, patterns: RegExp[]): string[] {
  const roughLines: string[] = [];
  let lastIndex = 0;
  let buffer = '';

  // Create a combined pattern that matches any of our split patterns
  const combinedPattern = new RegExp(
    patterns.map(p => p.source).join('|'), 
    'gi'
  );

  let match;
  while ((match = combinedPattern.exec(text)) !== null) {
    const { index } = match;

    // Add the text since last match to our buffer
    buffer += text.slice(lastIndex, index);

    // If we have content in buffer, push it as a line
    if (buffer.trim().length > 0) {
      roughLines.push(buffer.trim());
      buffer = '';
    }

    // Start new buffer with the matched text
    buffer += match[0];
    lastIndex = index + match[0].length;
  }

  // Add any remaining text after last match
  if (lastIndex < text.length) {
    buffer += text.slice(lastIndex);
  }
  if (buffer.trim().length > 0) {
    roughLines.push(buffer.trim());
  }

  return roughLines.filter(line => {
    // Filter out lines that are just numbers or very short
    const trimmed = line.trim();
    return trimmed.length > 3 && !/^\d+$/.test(trimmed);
  });
}

// And update the splitRoughLines function to ensure we only pass RegExp objects:
export function splitRoughLines(text: string): string[] {
  const cleanedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\|/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/,(\d+)/g, '.$1')
    .replace(/(\d)\s(?=\d{3})/g, '$1');

  // Fast path for well-formatted documents
  const newlineCount = (cleanedText.match(/\n/g) || []).length;
  console.log(newlineCount);
  if (newlineCount > 5) {
    return cleanedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 3);
  }
  // Ensure all patterns are RegExp objects
  const splitPatterns: RegExp[] = [
    new RegExp('(?=LOT\\s+\\d+)', 'i'),  // LOT numbers
    new RegExp('(?=[A-Z]{1,3}\\d*)'),    // Article codes
    new RegExp('(?=\\b(m²|m2|m³|m3|ml|u|ens|kg|tonne|pm)\\s+[\\d,.]+)', 'i'), // Quantities with units
    new RegExp('(?=\\b\\d+[.,]?\\d*\\s*[x×]\\s*\\d+[.,]?\\d*\\b)'), // Dimensions
    new RegExp('(?=\\b\\d+[.,]\\d{2}\\b)'), // Prices
    new RegExp('(?=^\\s*[IVXLCDM]+\\s*[.)-])', 'im') // Section headers
  ];

  return splitTextWithPatterns(cleanedText, splitPatterns);
}
// Enhanced field extraction with format-specific patterns


// Helper function to normalize units from the construction document
function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'pce': 'u', // Convert "pce" to "u" for consistency
    'ff': 'ff', // Forfait (fixed price)
    'm²': 'm2',
    'm³': 'm3',
    'ml': 'ml'
  };
  return unitMap[unit.toLowerCase()] || unit.toLowerCase();
}
export function extractFields(line: string, isSomElecFormat: boolean = false): ConstructionLine | null {
  // First normalize the line by handling all variations
  const normalizedLine = line
    .trim()
    // Remove common designation labels and colons
    .replace(/(désignation|designation|label|libellé|description|item|article)\s*[:.]?\s*/gi, '')
    // Handle special quantity markers
    .replace(/\(Qté\)|Quantité|Quantity|Qty|Qté/gi, '')
    // Normalize unit representations
    .replace(/\b(pce|pee|unite?|unités?)\b/gi, 'u')
    .replace(/\b(forfait|ff)\b/gi, 'ff')
    .replace(/\bm(²|2|3|³)\b/gi, (_, p) => `m${p === '²' || p === '2' ? '2' : '3'}`)
    // Handle European number formats
    .replace(/(\d)\s+(?=\d{3}\b)/g, '$1')  // Remove thousand separators
    .replace(/,(\d+)$/, '.$1')             // Convert decimal comma to point
    // Normalize remaining whitespace
    .replace(/\s+/g, ' ');

  // Enhanced pattern to match all document formats
  const pattern = /^(?:([A-Z]?\d+(?:\.\d+)?)\s+)?(.+?)\s+(m[2²]|m[3³]|ml|u|pce|ff|kg|tonne|ens)\s+([\d.]+)(?:\s+([\d.]+))?(?:\s+([\d.]+))?$/i;
  const match = normalizedLine.match(pattern);
  if (!match) {
    console.debug('No match for line:', line);
    return null;
  }

  const [, id, designation, unit, rawQty, rawUnitPrice, rawTotalPrice] = match;

  // Special handling for fixed-price items (ff)
  if (unit.toLowerCase() === 'ff') {
    const quantity = 1;
    const unitPrice = parseNumber(rawQty);
    const totalPrice = rawUnitPrice ? parseNumber(rawUnitPrice) : unitPrice;

    return {
      id: id?.trim() || '',
      designation: cleanDesignation(designation),
      unit: 'ff',
      quantity,
      unitPrice,
      totalPrice,
      dimensions: { count: quantity },
      metadata: {
        unit :unit,
        isSomElecFormat,
        elementType: 'fixed_price',
        isFixedPrice: true,
        originalLine: line,
        section: getSection(id)
      }
    };
  }

  // Handle countable items (u)
  if (unit.toLowerCase() === 'u') {
    const quantity = parseNumber(rawQty) || 0;
    const unitPrice = rawUnitPrice ? parseNumber(rawUnitPrice) : undefined;
    const totalPrice = rawTotalPrice ? parseNumber(rawTotalPrice) : undefined;

    // Validate reasonable counts
    if (quantity > 100000) {
      console.warn('Unrealistic count for', designation, ':', quantity);
      return null;
    }

    return {
      id: id?.trim() || '',
      designation: cleanDesignation(designation),
      unit: 'u',
      quantity,
      unitPrice,
      totalPrice,
      dimensions: { count: quantity },
      metadata: {
        unit:unit,
        isSomElecFormat,
        elementType: 'countable',
        isFixedPrice: false,
        originalLine: line,
        section: getSection(id)
      }
    };
  }

  // Handle dimensional items (m2, m3, ml)
  const quantity = parseNumber(rawQty);
  if (quantity === undefined || isNaN(quantity)) {
    console.error('Invalid quantity in line:', line);
    return null;
  }

  const unitPrice = rawUnitPrice ? parseNumber(rawUnitPrice) : undefined;
  const totalPrice = rawTotalPrice ? parseNumber(rawTotalPrice) : undefined;

  return {
    id: id?.trim() || '',
    designation: cleanDesignation(designation),
    unit,
    quantity,
    unitPrice,
    totalPrice,
    dimensions: generateDimensionsFromQuantity(quantity, unit),
    metadata: {
      unit:unit,
      isSomElecFormat,
      elementType: detectElementType(designation),
      isFixedPrice: false,
      originalLine: line,
      section: getSection(id)
    }
  };
}

// Helper functions
function parseNumber(str: string): number | undefined {
  if (!str) return undefined;
  
  // First remove any remaining whitespace
  const cleanStr = str.replace(/\s/g, '');
  
  // Parse as float (handles both . and , decimals)
  const num = parseFloat(cleanStr.replace(',', '.'));
  
  return isNaN(num) ? undefined : num;
}

function cleanDesignation(designation: string): string {
  return designation
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^\d+\.\d+\s*/, '')
    .replace(/[^\w\sÀ-ÿ-]/g, ''); // Keep letters, numbers, spaces, and French chars
}

function getSection(id?: string): string {
  if (!id) return 'Autre';
  const sectionNum = parseInt(id.split('.')[0]);
  const sections = [
    'TRAVAUX PRELIMINAIRES',
    'FONDATION',
    'ELEVATION',
    'TOITURE',
    'REVETEMENT DES MURS',
    'REVETEMENT DES SOLS',
    'PLAFOND',
    'HUISSERIE',
    'ELECTRICITE',
    'SANITAIRE',
    'PEINTURE',
    'AMENAGEMENT EXTERIEUR'
  ];
  return sections[sectionNum - 1] || 'Autre';
}


export const extractConstructionData = (text: string): CalculationResult[] => {
  // Normalize spacing and replace common OCR artifacts
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\|/g, ' ')             // Remove table-like bars
    .replace(/[^\S\r\n]+/g, ' ')     // Collapse all whitespace
    .replace(/,(\d+)/g, '.$1')       // Convert commas to dots in decimals
    .replace(/(\d)\s(?=\d{3})/g, '$1'); // Remove thousand spaces

  console.log("call splitRoughLines : ");
  const lines = splitRoughLines(normalizedText);
  console.log(lines);
  const results: CalculationResult[] = [];
  for (const line of lines) {
    console.log("extractFields : ");
    const fields = extractFields(line,false);
    if (fields) {
      const result = convertConstructionLineToCalculationResult(fields);
      if (result) results.push(result);
    }
  }
  console.log(results);

  return results;
};

/**
 * 
 * @param line  ConstructionLine
 * @returns 
 */
export const convertConstructionLineToCalculationResult = (
  line: ConstructionLine
): CalculationResult | null => {
  if (!line?.designation || line.quantity == null || !line?.unit) return null;

  try {
    const computed = generateDimensionsFromQuantity(line.quantity, line.unit);
    const elementType = detectElementType(line.designation);

    const dimensions: CalculationResult["dimensions"] = {
      length: line.dimensions?.length ?? computed.length,
      width: line.dimensions?.width ?? computed.width,
      height: line.dimensions?.height ?? computed.height,
      count: computed.count ?? line.dimensions?.count,
    };

    const results: Record<string, number | string> = {
      ...(computed.area != null ? { area: computed.area } : {}),
      ...(computed.volume != null ? { volume: computed.volume } : {}),
      ...(computed.weight != null ? { weight: computed.weight } : {}),
      ...(computed.count != null ? { count: computed.count } : {}),
      ...(line.unitPrice != null ? { unitPrice: line.unitPrice } : {}),
      ...(line.totalPrice != null ? { totalPrice: line.totalPrice } : {}),
    };

    const metadata: CalculationResult["metadata"] = {
      unit: line.unit,
      sourceUnit: line.unit,
      description: line.designation,
      parsedAt: new Date().toISOString(),
      isFixedPrice: line.unit === 'ff',
      ...(line.metadata || {}),
      ...(computed.metadata || {}),
    };

    return {
      originalLabel: line.designation,
      elementType,
      dimensions,
      results,
      metadata,
    };
  } catch (error) {
    console.warn("Conversion failed for line:", line, error);
    return null;
  }
};


/**
 * Converts raw construction data lines to standardized invoice lines
 * with automatic element type detection and validation.
 */
/**
 * Processes raw construction lines into standardized invoice lines.
 * 
 * Uses element type mapping and detection heuristics,
 * generates dimensions from quantities and units,
 * and enriches lines with metadata for traceability.
 * 
 * @param rawLines Array of raw construction lines to process
 * @returns Array of normalized and enriched invoice lines
 */
export const processConstructionLines = (
  lines: string[],
  isSomElecFormat: boolean
): ConstructionLine[] => {

  const results: ConstructionLine[] = [];
  let currentSection = "Autre";

  for (const line of lines) {
    // Handle section headers for both formats
    if (isSomElecFormat) {
      const sectionMatch = line.match(/^([A-Z]+)\s/);
      if (sectionMatch) {
        currentSection = line.trim();
        continue;
      }
    } else {
      const lotMatch = line.match(/^##\s*LOT\s*\d+\s*:\s*(.*)/i);
      if (lotMatch) {
        currentSection = `LOT ${lotMatch[1].trim()}`;
        continue;
      }
    }

    const fields = extractFields(line, isSomElecFormat);
    if (fields !== null && fields.designation !== null) {

      results.push({
        ...fields,
        metadata: {
          ...fields.metadata,
          section: currentSection
        }
      });
    }
  }

  return results;
}



export const isArchitecturalPlan = (text: string) => {
  const planWords = [
    "plan architectural", "plan d'architecte", "floor plan"
  ];
  const lower = text.toLowerCase();
  return planWords.some(word => lower.includes(word));
};

// Validate if native text is usable
const isTextReadable = (text: string): boolean => {
  const meaningfulLines = text.split('\n').filter(line => line.trim().length > 10);
  return meaningfulLines.length >= 2;
};

// Enhanced PDF parser with format detection
export const parsePdf = async (file: File): Promise<CalculationResult[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageTexts = await extractPdfText(pdf);
    let fullText = pageTexts.join('\n\n');
    
    console.log("fulltext brute before proceessing :")
    fullText = preprocessPdfText(fullText);
      
    if (!isTextReadable(fullText)) {
      console.warn("Native text extraction insufficient, falling back to OCR");
      fullText = await performOcrFallback(pdf);
    }
    

    // Detect format and parse accordingly
    const isSomElecFormat = fullText.includes("SOMELEC") || fullText.includes("CONSULTATION RELATIVE");
    console.log("splitRoughLines(fullText) :")
    const lines = splitRoughLines(fullText);
    //console.log(lines);

    const constructionLines = extractConstructionLines(lines, isSomElecFormat);
    console.log(constructionLines);
    
    return constructionLines;
    
  } catch (error) {
    console.error("PDF parsing failed:", error);
    toast({ 
      title: "Erreur d'Analyse", 
      description: "Impossible de lire le fichier PDF",
      variant: "destructive" 
    });
    return [];
  }
};
/**
 * Extracts text from PDF pages in parallel batches
 */
async function extractPdfText(pdf: any): Promise<string[]> {
  const pageTexts: string[] = [];
  const batchSize = 5;
  
  for (let i = 0; i < pdf.numPages; i += batchSize) {
    const batchPromises = Array.from(
      { length: Math.min(batchSize, pdf.numPages - i) },
      async (_, idx) => {
        const page = await pdf.getPage(i + idx + 1);
        const content = await page.getTextContent({ disableCombineTextItems: false });
        
        // Group text items by vertical position
        const lines: Record<number, string[]> = {};
        content.items.forEach((item: any) => {
          const y = Math.floor(item.transform[5]);
          (lines[y] ||= []).push(item.str);
        });
        
        return Object.values(lines).map(items => items.join(' ')).join('\n');
      }
    );
    
    pageTexts.push(...await Promise.all(batchPromises));
  }
  
  return pageTexts;
}

/**
 * OCR fallback implementation
 */
async function performOcrFallback(pdf: any): Promise<string> {
  const worker = await tesseract.createWorker('fra+eng', 1, {
    logger: m => console.debug(m),
    preserve_interword_spaces: 1,
    tessedit_pageseg_mode: 6,  // Assume single uniform block of text
  });

  let ocrText = '';
  
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true })!;
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
      
      const { data } = await worker.recognize(canvas);
      if (data?.text) {
        ocrText += postProcessOcrText(data.text) + '\n';
      }
    }
  } finally {
    await worker.terminate();
  }

  return ocrText;
}
/**
 * Preprocesses extracted PDF text for better parsing
 */
function preprocessPdfText(text: string): string {
  return text
    .replace(/Article\s+Désignation\s+Unité\s+Quantité\s+Px\s+Unit\s+Px\s+Total/gi, '')
    .replace(/\r\n/g, '\n')
    .replace(/\|/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/,(\d+)/g, '.$1')
    .replace(/(\d)\s(?=\d{3})/g, '$1');
}

// Enhanced line extraction with format awareness
function extractConstructionLines(lines: string[], isSomElecFormat: boolean): CalculationResult[] {
  const results: CalculationResult[] = [];
  let currentSection = "Autre";

  for (const line of lines) {
    // Handle section headers for both formats
    if (isSomElecFormat) {
      const sectionMatch = line.match(/^([A-Z]+)\s/);
      if (sectionMatch) {
        currentSection = line.trim();
        continue;
      }
    } else {
      const lotMatch = line.match(/^##\s*LOT\s*\d+\s*:\s*(.*)/i);
      if (lotMatch) {
        currentSection = `LOT ${lotMatch[1].trim()}`;
        continue;
      }
    }

    const fields = extractFields(line, isSomElecFormat);
    if (fields) {
      const result = convertConstructionLineToCalculationResult(fields);
      results.push({
        ...result,
        metadata: {
          ...fields.metadata,
          section: currentSection
        }
      });
    }
  }

  return results;
}

// Helper function to enhance image contrast for OCR
const enhanceContrast = (imageData: ImageData) => {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Simple contrast enhancement
    data[i] = data[i + 1] = data[i + 2] = r * 0.3 + g * 0.59 + b * 0.11 > 128 ? 255 : 0;
  }
};

// Utility functions
const extractNumber = (line: string): number => {
  const match = line.match(/(\d+[\.,]?\d*)/);
  return match ? parseFloat(match[1].replace(',', '.')) : 0;
};

const extractUnit = (line: string): string => {
  const units = ['m³', 'm²', 'U', 'FF'];
  return units.find(u => line.includes(u)) || '';
};
// Helper function for cement output formatting
// Using the core helper formatCementOutput defined earlier

export const parseDocument = async (file: File): Promise<CalculationResult[]> => {
  try {
    let content = '';

    // --- PDF Handling ---
    console.log("// --- PDF Handling ---");
    if (file.type === "application/pdf") {
      content = await parsePdfWithOcrFallback(file);
    }

    // --- Image Handling (JPG, PNG) ---
    else if (file.type.startsWith("image/")) {
      content = await processImageWithOcr(file);
    }
    // --- Excel Handling ---
    else if (file.name.endsWith(".xlsx") || file.type.includes("spreadsheet")) {
      content = await parseExcelFile(file);
    }

    // --- CSV Handling ---
    else if (file.name.endsWith(".csv")) {
      content = await file.text();
    }

    console.log("before // cleanText---");
    console.log(content);

    // Clean up OCR noise and align for parser
    const cleanText = cleanOcrText(content);
    console.log(cleanText);

    // Parse into structured results using enhanced construction data extractor
    return extractConstructionData(cleanText);

  } catch (error: any) {
    console.error("Document parsing failed:", error);
    toast({
      title: "Erreur d'Analyse",
      description: error.message,
      variant: "destructive",
    });
    return [];
  }
};

// All existing methods remain exactly the same below this point

const parsePdfWithOcrFallback = async (file: File): Promise<string> => {
  try {
    const pdf = await pdfjsLib.getDocument(await file.arrayBuffer()).promise;
    let textContent = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      textContent += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    if (textContent.trim().replace(/\s/g, '').length > 50) {
      return textContent;
    }

    return await renderPdfPagesForOcr(pdf);
  } catch (error) {
    console.error("PDF processing failed, trying direct OCR:", error);
    return await processImageWithOcr(file);
  }
};
const cleanOcrText = (ocrText: string): string => {
  return ocrText
    .replace(/\r\n/g, '\n')
    .replace(/[^\S\r\n]{2,}/g, ' ')
    .replace(/(\d)\s+([a-zA-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])\s+(\d)/g, '$1 $2')
    .replace(/([.,])\s+(\d)/g, '$1$2')
    .replace(/(\d)\s+([.,])/g, '$1$2');
};

// OCR fallback
const renderPdfPagesForOcr = async (pdf: any): Promise<string> => {
  const worker = await tesseract.createWorker('fra', 1, {
    logger: m => console.log(m)
  });

  let ocrText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport
    }).promise;

    const imageDataUrl = canvas.toDataURL('image/png');

    try {
      const { data } = await worker.recognize(imageDataUrl);
      if (data && data.text) {
        ocrText += postProcessOcrText(data.text) + '\n';
      }
    } catch (ocrError) {
      console.error(`OCR failed on page ${i}:`, ocrError);
    }
  }

  await worker.terminate();

  if (!ocrText.trim()) {
    throw new Error("OCR n'a pas pu extraire de texte.");
  }

  return ocrText;
};



// Clean up OCR output
export const postProcessOcrText = (raw: string): string => {
  if (!raw) return '';

  return raw
    // Remove common headers/footers
    .replace(/\bPage\s+\d+\s*\/\s*\d+\b/gi, '')
    .replace(/\bDEVIS\s+QUANTITATIF\s+ESTIMATIF\b/gi, '')
    .replace(/Article\s+Désignation\s+Unité\s+Quantité\s+Px\s+Unit\s+Px\s+Total/gi, '')

    // Normalize spaces
    .replace(/[^\S\r\n]+/g, ' ')

    // Protect dimensions & dosage
    .replace(/(\d+,\d+)\s*[x×]\s*(\d+,\d+)\s*(m|cm|mm)?/gi, '$1x$2$3')
    .replace(/(\d+)\s*kg\s*\/\s*m[³3]/gi, '$1kg/m3')

    // Units normalization
    .replace(/\bm2\b/gi, 'm²')
    .replace(/\bm3\b/gi, 'm³')
    .replace(/\bm1\b/gi, 'ml')
    .replace(/\bu\b/gi, 'u')

    // Space between numbers and units if missing
    .replace(/(\d)(m²|m³|ml|u|ens|kg|tonne|pm)/gi, '$1 $2')

    // Decimal separator fix: 1 247,80 → 1247.80
    .replace(/(\d)\s+(\d{3})([.,]\d+)/g, '$1$2$3')

    // O vs 0 in numbers
    .replace(/(\d)\.O(\d)/g, '$1.0$2')

    // CamelCase & letter-digit separation
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)(?![.,x×]\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])(?![²³m])/g, '$1 $2')

    // Remove stray punctuation & lines
    .replace(/[•·¤“”"‘’´`]+/g, '')
    .replace(/[_\-–—=+]{2,}/g, '')

    // Join broken lines unless they start with LOT/ARTICLE
    .replace(/([^\n])\n(?!\n|LOT|ARTICLE)/g, '$1 ')

    // Force newlines before key markers
    .replace(/(LOT\s+\d+|ARTICLE\s+\d+)/gi, '\n\n$1\n\n')

    // Final cleanup
    .replace(/ +/g, ' ')
    .trim();
};



const processImageWithOcr = async (file: File): Promise<string> => {
  try {
    const { data } = await tesseract.recognize(file);
    return data.text;
  } catch (error: any) {
    throw new Error("Échec de la reconnaissance d'image: " + error.message);
  }
};

const parseExcelFile = async (file: File): Promise<string> => {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    return workbook.SheetNames
      .map(name => XLSX.utils.sheet_to_csv(workbook.Sheets[name]))
      .join('\n');
  } catch (error: any) {
    throw new Error("Impossible de lire le fichier Excel: " + error.message);
  }
};

// Enhanced PDF parser with format detection
export const parseInvoiceFromPdf = async (file: File): Promise<CalculationResult[]> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageTexts = await extractPdfText(pdf);
    let fullText = pageTexts.join('\n\n');
    
    console.log("fulltext brute before proceessing :")
    fullText = preprocessPdfText(fullText);
      
    if (!isTextReadable(fullText)) {
      console.warn("Native text extraction insufficient, falling back to OCR");
      fullText = await performOcrFallback(pdf);
    }
    

    // Detect format and parse accordingly
    const isSomElecFormat = fullText.includes("SOMELEC") || fullText.includes("CONSULTATION RELATIVE");
    console.log("splitRoughLines(fullText) :")
    const lines = splitRoughLines(fullText);
    //console.log(lines);

    return processConstructionLines(lines, isSomElecFormat);
    
  } catch (error) {
    console.error("PDF parsing failed:", error);
    toast({ 
      title: "Erreur d'Analyse", 
      description: "Impossible de lire le fichier PDF",
      variant: "destructive" 
    });
    return [];
  }
};