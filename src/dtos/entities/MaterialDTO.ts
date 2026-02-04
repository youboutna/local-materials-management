/**
 * Material Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO, LocationDTO } from '../shared';

export interface MaterialDTO extends BaseEntityDTO {
  name: string;
  description: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  availableQuantity: number;
  sku?: string;
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  workspaceId?: string;
  image?: string;
  originLocation?: string;
  adresse?: string;
  forme?: string;
  type: string; // Added missing property
}

export interface MaterialDetailsDTO extends MaterialDTO {
  location?: LocationDTO;
  workspaceDetails?: {
    id: string;
    name: string;
    location: string;
  };
  supplierInfo?: {
    id: string;
    name: string;
    contactInfo?: string;
  };
  stockHistory?: Array<{
    date: string;
    quantity: number;
    type: 'in' | 'out' | 'adjustment';
    reason?: string;
  }>;
  usageHistory?: Array<{
    projectId: string;
    projectTitle: string;
    quantity: number;
    usedAt: string;
  }>;
  qualityMetrics?: {
    averageRating: number;
    totalReviews: number;
    defectRate: number;
  };
}

export interface MaterialSummaryDTO {
  id: string;
  name: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  availableQuantity: number;
  totalValue: number;
  isLowStock: boolean;
  lastUpdated: string;
}

export interface CreateMaterialDTO {
  name: string;
  description: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  availableQuantity: number;
  sku?: string;
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  workspaceId?: string;
  image?: string;
  originLocation?: string;
  adresse?: string;
  forme?: string;
}

export type UpdateMaterialDTO = Partial<CreateMaterialDTO>;

export interface MaterialFilterDTO {
  category?: string;
  workspaceId?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  quantityRange?: {
    min: number;
    max: number;
  };
  searchQuery?: string;
  inStockOnly?: boolean;
}
