/**
 * Material Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 */

import { BaseEntityDTO, LocationDTO } from '../shared';

/**
 * Material category enumeration
 * Classification of material types
 */
export enum MaterialCategory {
  RAW_MATERIAL = 'raw_material',
  EQUIPMENT = 'equipment',
  TOOLS = 'tools',
  CONSUMABLES = 'consumables',
  SAFETY = 'safety',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  HVAC = 'hvac',
  FINISHING = 'finishing'
}

/**
 * Material status enumeration
 * Current state of material availability
 */
export enum MaterialStatus {
  AVAILABLE = 'available',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
  ON_ORDER = 'on_order',
  RESERVED = 'reserved',
  DAMAGED = 'damaged'
}

/**
 * Material unit enumeration
 * Standard measurement units for materials
 */
export enum MaterialUnit {
  PIECES = 'pieces',
  KILOGRAMS = 'kilograms',
  METERS = 'meters',
  LITERS = 'liters',
  SQUARE_METERS = 'square_meters',
  CUBIC_METERS = 'cubic_meters',
  TONS = 'tons',
  BAGS = 'bags',
  BOXES = 'boxes',
  ROLLS = 'rolls',
  SETS = 'sets'
}

/**
 * Main Material DTO
 * Core material data structure
 */
export interface MaterialDTO extends BaseEntityDTO {
  // Core identification
  id: string;
  name: string;
  description?: string;
  type: string; // Material type or category
  
  // Classification
  category: MaterialCategory;
  status: MaterialStatus;
  
  // Inventory and pricing
  unit: MaterialUnit;
  quantity: number;
  pricePerUnit: number;
  totalValue?: number;
  
  // Supplier information
  supplierId?: string;
  supplierName?: string;
  supplierCode?: string;
  
  // Physical properties
  weight?: number; // in kg
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: MaterialUnit;
  };
  
  // Location and storage
  location?: string;
  storageLocation?: string;
  warehouseId?: string;
  aisle?: string;
  shelf?: string;
  bin?: string;
  
  // Quality and specifications
  quality?: 'premium' | 'standard' | 'economy';
  specifications?: Record<string, unknown>;
  technicalSpecs?: Record<string, unknown>;
  
  // Project relationship
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  
  // Documentation
  documents?: string[]; // Document IDs only for DTO
  images?: string[]; // Image URLs only for DTO
  certifications?: string[];
  
  // Timeline
  reorderLevel?: number; // Minimum quantity before reorder
  reorderAt?: number; // When to reorder
  expiryDate?: string; // Expiration date
  
  // Metadata
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Material form data interface
 * Input for material selection in project forms
 */
export interface MaterialFormDataDTO {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  category: string;
  specifications?: Record<string, unknown>;
  estimatedCost?: number;
  supplierId?: string;
  materialId?: string;
}

/**
 * Material creation request interface
 * Input for creating new materials
 */
export interface CreateMaterialDTO extends Omit<MaterialDTO, keyof BaseEntityDTO> {
  name: string;
  description?: string;
  category: MaterialCategory;
  unit: MaterialUnit;
  pricePerUnit: number;
  quantity: number;
  supplierId?: string;
  specifications?: Record<string, unknown>;
  estimatedCost?: number;
  materialId?: string;
}

/**
 * Material update request interface
 * Input for updating existing materials
 */
export interface UpdateMaterialDTO {
  name?: string;
  description?: string;
  type?: string;
  category?: MaterialCategory;
  status?: MaterialStatus;
  unit?: MaterialUnit;
  quantity?: number;
  pricePerUnit?: number;
  supplierId?: string;
  supplierCode?: string;
  location?: string;
  storageLocation?: string;
  quality?: 'premium' | 'standard' | 'economy';
  specifications?: Record<string, unknown>;
  technicalSpecs?: Record<string, unknown>;
  reorderLevel?: number;
  tags?: string[];
  notes?: string;
  
  // Metadata
  updatedBy?: string;
  changeReason?: string;
}

/**
 * Material summary interface
 * Lightweight material representation for lists
 */
export interface MaterialSummaryDTO extends BaseEntityDTO {
  id: string;
  name: string;
  category: MaterialCategory;
  status: MaterialStatus;
  quantity: number;
  unit: MaterialUnit;
  pricePerUnit: number;
  totalValue?: number;
  supplierName?: string;
  location?: string;
  isLowStock?: boolean;
  isExpired?: boolean;
  tags?: string[];
}

/**
 * Material inventory interface
 * Inventory tracking and management
 */
export interface MaterialInventoryDTO {
  materialId: string;
  currentQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  lastCountDate?: string;
  nextCountDate?: string;
  averageMonthlyUsage?: number;
  location?: string;
  warehouseId?: string;
}

/**
 * Material supplier interface
 * Supplier information for materials
 */
export interface MaterialSupplierDTO {
  id: string;
  name: string;
  code?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  paymentTerms?: string;
  deliveryTime?: number; // in days
  qualityRating?: number; // 1-5
  isActive?: boolean;
  materials?: string[]; // Material IDs only for DTO
}

/**
 * Material transaction interface
 * Transaction tracking for materials
 */
export interface MaterialTransactionDTO {
  id: string;
  materialId: string;
  type: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'return';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  reference?: string;
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  performedBy?: string;
  performedAt?: string;
  notes?: string;
}

/**
 * Material details interface
 * Extended material data structure
 */
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

/**
 * Material filter interface
 * Filtering criteria for material lists
 */
export interface MaterialFilterDTO {
  id?: string;
  name?: string;
  category?: MaterialCategory;
  unit?: MaterialUnit;
  priceRange?: {
    min: number;
    max: number;
  };
  quantityRange?: {
    min: number;
    max: number;
  };
  status?: MaterialStatus;
  search?: string;
  searchQuery?: string;
  inStockOnly?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'pricePerUnit' | 'availableQuantity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
