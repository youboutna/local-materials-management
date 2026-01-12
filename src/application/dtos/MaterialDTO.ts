/**
 * Material Data Transfer Objects
 */

export interface MaterialDTO {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  availableQuantity: number;
  image?: string;
  originLocation?: string;
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  adresse?: string;
  forme?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterialDTO {
  name: string;
  description: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  availableQuantity?: number;
  image?: string;
  originLocation?: string;
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  adresse?: string;
  forme?: string;
}

export interface UpdateMaterialDTO {
  name?: string;
  description?: string;
  category?: string;
  unit?: string;
  pricePerUnit?: number;
  availableQuantity?: number;
  image?: string;
  originLocation?: string;
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  adresse?: string;
  forme?: string;
}
