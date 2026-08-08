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
export function wastageFactor = 0.1
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
// Moved from src/components/project/QuantityTakeoffs.tsx
export interface QuantityTakeoff {
  id: string;
  elementType: string;
  unit: string;
  length: number;
  width?: number;
  height?: number;
  quantity: number;
  unitPrice?: number;
  totalValue?: number;
  note?: string;
  material: {
    id: string;
    name: string;
    unit: string;
    price_per_unit: number;
  };
}

// Moved from src/application/services/QuantityTakeoffService.ts
export interface QuantityTakeoffStats {
  totalQuantityByUnit: Record<string, number>;
  totalValue: number;
  count: number;
  averageUnitPrice: number;
  materialBreakdown: Array<{
    materialId: string;
    materialName: string;
    totalQuantity: number;
    totalValue: number;
    unit: string;
  }>;
  phaseBreakdown: Array<{
    phaseId: string;
    phaseName: string;
    totalQuantity: number;
    totalValue: number;
    completionPercentage: number;
  }>;
  budgetUtilization: {
    allocatedBudget: number;
    estimatedCost: number;
    utilizationPercentage: number;
    variance: number;
  };
}

// Moved from src/application/services/QuantityTakeoffService.ts
export interface CreateQuantityTakeoffRequestDto {
  projectId: string;
  materialId: string;
  elementType: string;
  unit: 'm³' | 'm²' | 'm' | 'unité';
  length: number;
  width?: number;
  height?: number;
  unitPrice?: number;
  phaseId?: string;
  milestoneId?: string;
  note?: string;
}

// Moved from src/application/services/QuantityTakeoffService.ts
export interface UpdateQuantityTakeoffRequestDto {
  quantity?: number;
  unitPrice?: number;
  materialId?: string;
  phaseId?: string;
  milestoneId?: string;
  note?: string;
}