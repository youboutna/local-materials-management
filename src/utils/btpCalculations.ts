import * as pdfjsLib from "pdfjs-dist";
import * as  tesseract from "tesseract.js";
import * as XLSX from "xlsx";
import { toast } from "@/hooks/use-toast";

// PDF.js worker — bundled via Vite so its version always matches pdfjs-dist.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

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

// Parse PDF invoice function
export async function parseInvoiceFromPdf(pdfUrl: string): Promise<InvoiceLine[]> {
  try {
    console.log('Starting PDF invoice parsing...');
    
    // Load the PDF document
    const response = await fetch(pdfUrl);
    const arrayBuffer = await response.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    console.log('Extracted text from PDF:', fullText.substring(0, 500) + '...');
    
    // Parse the extracted text to find invoice lines
    const invoiceLines = parseInvoiceText(fullText);
    
    console.log(`Parsed ${invoiceLines.length} invoice lines`);
    return invoiceLines;
    
  } catch (error) {
    console.error('Error parsing PDF invoice:', error);
    throw new Error('Failed to parse PDF invoice');
  }
}

// Parse invoice text to extract lines
function parseInvoiceText(text: string): InvoiceLine[] {
  const lines: InvoiceLine[] = [];
  const textLines = text.split('\n');
  
  for (let i = 0; i < textLines.length; i++) {
    const line = textLines[i].trim();
    
    // Skip empty lines and headers
    if (!line || line.length < 10) continue;
    
    // Try to parse as invoice line (looking for patterns like: description | quantity | unit | price)
    const invoiceLine = tryParseInvoiceLine(line, i + 1);
    if (invoiceLine) {
      lines.push(invoiceLine);
    }
  }
  
  return lines;
}

// Try to parse a single line as an invoice line
function tryParseInvoiceLine(text: string, lineNumber: number): InvoiceLine | null {
  try {
    // Common patterns for invoice lines
    const patterns = [
      // Pattern: "Description Qty Unit Price Total"
      /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/,
      // Pattern: "Description | Qty | Unit | Price"
      /^(.+?)\s*\|\s*(\d+(?:\.\d+)?)\s*\|\s*(\w+)\s*\|\s*(\d+(?:\.\d+)?)$/,
      // Pattern: "Description Qty Unit @ Price"
      /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\w+)\s+@\s*(\d+(?:\.\d+)?)$/,
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const [, description, quantity, unit, unitPrice] = match;
        
        return createInvoiceLine(
          description.trim(),
          parseFloat(quantity),
          unit.trim(),
          parseFloat(unitPrice),
          {
            lineNumber: lineNumber.toString(),
            metadata: {
              parsedAt: new Date().toISOString(),
              sourceText: text
            }
          }
        );
      }
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to parse line:', text, error);
    return null;
  }
}

// Helper functions
function normalizeUnit(unit: string): string {
  const unitMap: Record<string, string> = {
    'M': 'm',
    'M2': 'm²',
    'M3': 'm³',
    'KG': 'kg',
    'T': 't',
    'U': 'u',
    'ML': 'ml',
    'EA': 'u'
  };
  
  return unitMap[unit.toUpperCase()] || unit.toLowerCase();
}

function generateDimensionsFromQuantity(quantity: number, unit: string): Dimensions {
  const dimensions: Dimensions = {};
  
  switch (unit.toLowerCase()) {
    case 'm':
      dimensions.length = quantity;
      break;
    case 'm²':
      dimensions.area = quantity;
      break;
    case 'm³':
      dimensions.volume = quantity;
      break;
    case 'kg':
    case 't':
      dimensions.weight = quantity;
      break;
    case 'u':
      dimensions.count = quantity;
      break;
    default:
      dimensions.count = quantity;
  }
  
  return dimensions;
}

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

/**
 * Central dispatcher — routes to the correct calculator based on elementType.
 * Falls back to a basic volume/area/length calculation when no dedicated
 * calculator exists so the Calculator UI always returns useful numbers.
 */
export function calculateAdvancedQuantities(params: CalculationParams): CalculationResult {
  const { elementType, length = 0, width = 0, height = 0, count = 0, quantity = 1, options } = params;
  const dosage = options?.dosage ?? DEFAULT_CONCRETE_DOSAGE;
  const thickness = options?.thickness ?? STANDARD_PLASTER_THICKNESS;

  try {
    switch (elementType) {
      case 'concrete_slab':
        return calculateConcreteSlab(length, width, height, options);
      case 'masonry_wall':
        return calculateMasonryWall(length, height, options) as CalculationResult;
      case 'hollow_block_wall': {
        const { surface, blocks } = calculateHollowBlockWall(length, height);
        return {
          elementType, dimensions: { length, height },
          results: {
            'Surface (m²)': roundToDecimal(surface, 2),
            'Nombre de blocs': Math.ceil(blocks),
          },
        };
      }
      case 'concrete_column':
      case 'concrete_beam': {
        const section = width * height;
        const { volume, cement } = elementType === 'concrete_column'
          ? calculateConcreteColumn(length, section, dosage)
          : calculateConcreteBeam(length, section, dosage);
        return {
          elementType, dimensions: { length, width, height },
          results: {
            'Volume béton (m³)': roundToDecimal(volume, 3),
            'Ciment (kg)': roundToDecimal(cement, 2),
            'Sacs ciment (50kg)': Math.ceil(cement / CEMENT_BAG_WEIGHT),
          },
        };
      }
      case 'concrete_footing':
      case 'concrete_filling':
      case 'lean_concrete': {
        const { volume, cement } = calculateConcreteFooting(length, width, height, dosage);
        return {
          elementType, dimensions: { length, width, height },
          results: {
            'Volume béton (m³)': roundToDecimal(volume, 3),
            'Ciment (kg)': roundToDecimal(cement, 2),
            'Sacs ciment (50kg)': Math.ceil(cement / CEMENT_BAG_WEIGHT),
          },
        };
      }
      case 'plaster': {
        const { surface, volume, cement } = calculateCementForPlaster(length, height, thickness);
        return {
          elementType, dimensions: { length, height },
          results: {
            'Surface (m²)': roundToDecimal(surface, 2),
            'Volume enduit (m³)': roundToDecimal(volume, 3),
            'Ciment (kg)': roundToDecimal(cement, 2),
          },
        };
      }
      case 'brick_joints': {
        const surface = length * height;
        const { volume, cement } = calculateCementForBrickJoints(surface);
        return {
          elementType, dimensions: { length, height },
          results: {
            'Surface (m²)': roundToDecimal(surface, 2),
            'Volume mortier (m³)': roundToDecimal(volume, 3),
            'Ciment (kg)': roundToDecimal(cement, 2),
          },
        };
      }
      case 'paving':
      case 'rebar_slab': {
        const surface = length * width;
        if (elementType === 'rebar_slab') {
          const { weight } = calculateRebarForSlab(surface);
          return {
            elementType, dimensions: { length, width },
            results: {
              'Surface (m²)': roundToDecimal(surface, 2),
              'Poids acier (kg)': roundToDecimal(weight, 2),
            },
          };
        }
        return {
          elementType, dimensions: { length, width },
          results: { 'Surface (m²)': roundToDecimal(surface, 2) },
        };
      }
      case 'concrete_mix': {
        const volume = length * width * height || quantity;
        const { cement, gravel, sand } = calculateConcreteMix(volume);
        return {
          elementType, dimensions: { volume },
          results: {
            'Volume béton (m³)': roundToDecimal(volume, 3),
            'Ciment (kg)': roundToDecimal(cement, 2),
            'Gravier (kg)': roundToDecimal(gravel, 2),
            'Sable (kg)': roundToDecimal(sand, 2),
          },
        };
      }
      case 'vegetal_soil_stripping':
      case 'mass_excavation': {
        const area = length * width;
        const volume = area * height;
        return {
          elementType, dimensions: { length, width, height },
          results: {
            'Surface (m²)': roundToDecimal(area, 2),
            'Volume terre (m³)': roundToDecimal(volume, 3),
          },
        };
      }
      case 'trench_excavation': {
        const volume = length * width * height;
        return {
          elementType, dimensions: { length, width, height },
          results: {
            'Longueur (m)': roundToDecimal(length, 2),
            'Volume fouille (m³)': roundToDecimal(volume, 3),
          },
        };
      }
      case 'basic_calculator':
      default: {
        const w = width || 1;
        const h = height || 1;
        const volume = length * w * h;
        const area = length * w;
        return {
          elementType: elementType || 'basic_calculator',
          dimensions: { length, width, height, count, volume, area },
          results: {
            'Longueur (m)': roundToDecimal(length, 2),
            ...(width ? { 'Surface (m²)': roundToDecimal(area, 2) } : {}),
            ...(width && height ? { 'Volume (m³)': roundToDecimal(volume, 3) } : {}),
            ...(count ? { 'Nombre': count } : {}),
            'Quantité': quantity,
          },
        };
      }
    }
  } catch (err) {
    console.error('calculateAdvancedQuantities error:', err);
    return {
      elementType: elementType || 'basic_calculator',
      dimensions: { length, width, height },
      results: { 'Erreur': err instanceof Error ? err.message : 'Erreur de calcul' },
    };
  }
}

export async function parsePdf(file: File | string): Promise<any> {
  if (typeof file === 'string') {
    return parseInvoiceFromPdf(file);
  } else {
    // Handle File object - convert to URL first
    const url = URL.createObjectURL(file);
    try {
      return await parseInvoiceFromPdf(url);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
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