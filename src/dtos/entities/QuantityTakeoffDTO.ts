/**
 * Quantity Takeoff Data Transfer Objects
 * Following hexagonal architecture principles from PROMPTS.md
 * Rule #4: Centralized DTOs, no duplicate type definitions
 */

import { BaseEntityDTO, BaseFormDTO, StandardStatus, StandardPriority } from '../shared';

/**
 * Quantity calculation data for material takeoffs
 */
export interface QuantityTakeoffDTO extends BaseEntityDTO {
  projectId: string;
  materialId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  location?: string;
  description?: string;
  calculatedAt: string;
  calculatedBy: string;
  status: StandardStatus;
}

/**
 * Form data for creating quantity takeoffs
 */
export interface CreateQuantityTakeoffData extends BaseFormDTO<QuantityTakeoffDTO> {
  projectId: string;
  materialId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  location?: string;
  description?: string;
  calculatedBy: string;
}

/**
 * Update data for quantity takeoffs
 */
export interface UpdateQuantityTakeoffData extends Partial<BaseFormDTO<QuantityTakeoffDTO>> {
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  location?: string;
  description?: string;
  status?: StandardStatus;
}

/**
 * Quantity calculation result
 */
export interface QuantityCalculationResult {
  materialId: string;
  materialName: string;
  originalQuantity: number;
  calculatedQuantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  wastageFactor: number;
  wastageQuantity: number;
  totalWithWastage: number;
}

/**
 * Quantity takeoff summary for project
 */
export interface QuantityTakeoffSummaryDTO {
  projectId: string;
  totalItems: number;
  totalQuantity: number;
  totalCost: number;
  lastCalculated: string;
  calculatedBy: string;
  materials: Array<{
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
}

/**
 * Quantity calculation function parameters
 */
export interface QuantityCalculationParams {
  length?: number;
  width?: number;
  height?: number;
  depth?: number;
  area?: number;
  volume?: number;
  weight?: number;
  count?: number;
  wastageFactor?: number;
}

/**
 * Calculate quantity with wastage factor (advanced)
 */
export function calculateQuantityAdvanced(params: QuantityCalculationParams): QuantityCalculationResult {
  const {
    length = 0,
    width = 0,
    height = 0,
    area = 0,
    volume = 0,
    weight = 0,
    count = 0,
    wastageFactor = 0.1
  } = params;

  let baseQuantity = 0;
  if (area > 0) baseQuantity = area;
  else if (volume > 0) baseQuantity = volume;
  else if (length > 0 && width > 0 && height > 0) baseQuantity = length * width * height;
  else if (length > 0 && width > 0) baseQuantity = length * width;
  else if (count > 0) baseQuantity = count;
  else if (weight > 0) baseQuantity = weight;

  const wastageQuantity = baseQuantity * wastageFactor;
  const totalWithWastage = baseQuantity + wastageQuantity;

  return {
    materialId: '',
    materialName: '',
    originalQuantity: baseQuantity,
    calculatedQuantity: totalWithWastage,
    unit: 'unit',
    unitPrice: 0,
    totalPrice: 0,
    wastageFactor,
    wastageQuantity,
    totalWithWastage
  };
}

/**
 * Simple quantity calculation (legacy compatible)
 * Used by MetreCalculator and QuantityTakeoffForm
 */
export const calculateQuantity = (
  length: number, 
  width?: number, 
  height?: number, 
  unit?: string
): number => {
  if (unit === 'm³') return length * (width ?? 1) * (height ?? 1);
  if (unit === 'm²') return length * (width ?? 1);
  if (unit === 'm') return length;
  return 1;
};
