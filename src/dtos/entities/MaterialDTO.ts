/**
 * Material Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 * Aligned with EnhancedMaterialForm requirements
 */

import { BaseEntityDTO } from '../shared';

/**
 * Material category enumeration
 * Standard categories for materials in BTP projects
 */
export type MaterialCategory =
  | 'construction'
  | 'building'
  | 'pierre'
  | 'electrical'
  | 'plumbing'
  | 'finishing'
  | 'equipment'
  | 'safety'
  | 'tools'
  | 'other';

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
 * Coordinate point interface for geographic locations
 */


/**
 * Main Material DTO
 * Core material data structure aligned with form and domain requirements
 */
export interface MaterialDTO extends BaseEntityDTO {
  // Core identification
  id: string;
  name: string;
  description?: string;

  // Classification
  category: MaterialCategory;
  subcategory?: string;
  status: MaterialStatus;

  // Inventory and pricing
  unit: MaterialUnit;
  quantity: number;
  pricePerUnit: number;
  availableQuantity: number;
  minQuantity: number;
  totalValue?: number;

  // Supplier information
  supplierId?: string;
  supplierName?: string;
  supplierCode?: string;

  // Location and storage
  workspaceId: string;
  originLocation?: string;
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  adresse?: string;
  forme?: "polygon" | "rectangle" | "circle" | "point";
  localisation?: CoordinatePoint[]; // Array of coordinate objects

  // Product identifiers
  gtin?: string;
  sku?: string;
  ean?: string;
  asin?: string;

  // Multi-language support
  multilangLabels?: Record<string, string>;

  // Timeline
  timeline?: {
    start: Date;
    end: Date;
    estimatedDuration?: number;
  };

  // Supplier details
  supplier?: {
    name: string;
    contact: string;
    leadTime: number;
  };

  // Documentation
  image?: string;
  documents?: string[]; // Document URLs only for DTO

  // Metadata
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Material form data interface
 * Input for material creation/editing forms
 */
export interface MaterialFormDataDTO {
  name: string;
  description?: string;
  category: MaterialCategory;
  subcategory?: string;
  unit: MaterialUnit;
  quantity: number;
  minQuantity: number;
  pricePerUnit: number;
  availableQuantity: number;
  workspaceId: string;
  image?: string;
  adresse?: string;
  forme?: "polygon" | "rectangle" | "circle" | "point";
  localisation?: CoordinatePoint[];
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  gtin?: string;
  sku?: string;
  ean?: string;
  asin?: string;
  multilangLabels?: Record<string, string>;
  timeline?: {
    start: Date;
    end: Date;
    estimatedDuration: number;
  };
  supplier?: {
    name: string;
    contact: string;
    leadTime: number;
    supplierId?: string;
  };
  supplierId?: string;
}

/**
 * Material creation request interface
 * Input for creating new materials
 */
export interface CreateMaterialDTO extends Omit<MaterialDTO, keyof BaseEntityDTO | 'status' | 'totalValue'> {
  name: string;
  description?: string;
  category: MaterialCategory;
  subcategory?: string;
  unit: MaterialUnit;
  pricePerUnit: number;
  quantity: number;
  availableQuantity: number;
  minQuantity: number;
  workspaceId: string;
  gtin?: string;
  sku?: string;
  ean?: string;
  asin?: string;
  image?: string;
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  adresse?: string;
  forme?: "polygon" | "rectangle" | "circle" | "point";
  localisation?: CoordinatePoint[];
  multilangLabels?: Record<string, string>;
  timeline?: {
    start: Date;
    end: Date;
    estimatedDuration?: number;
  };
  supplier?: {
    name: string;
    contact: string;
    leadTime: number;
  };
}

/**
 * Material update request interface
 * Input for updating existing materials
 */
export interface UpdateMaterialDTO {
  name?: string;
  description?: string;
  category?: MaterialCategory;
  subcategory?: string;
  status?: MaterialStatus;
  unit?: MaterialUnit;
  quantity?: number;
  pricePerUnit?: number;
  availableQuantity?: number;
  minQuantity?: number;
  supplierId?: string;
  supplierName?: string;
  supplierCode?: string;
  workspaceId?: string;
  originLocation?: string;
  coordinatesLatitude?: number;
  coordinatesLongitude?: number;
  adresse?: string;
  forme?: "polygon" | "rectangle" | "circle" | "point";
  localisation?: CoordinatePoint[];
  gtin?: string;
  sku?: string;
  ean?: string;
  asin?: string;
  image?: string;
  multilangLabels?: Record<string, string>;
  timeline?: {
    start: Date;
    end: Date;
    estimatedDuration?: number;
  };
  supplier?: {
    name: string;
    contact: string;
    leadTime: number;
  };
  tags?: string[];
  notes?: string;
}

/**
 * Material summary interface
 * Lightweight material representation for lists
 */
export interface MaterialSummaryDTO extends BaseEntityDTO {
  id: string;
  name: string;
  category: MaterialCategory;
  subcategory?: string;
  status: MaterialStatus;
  quantity: number;
  availableQuantity: number;
  unit: MaterialUnit;
  pricePerUnit: number;
  totalValue?: number;
  supplierName?: string;
  workspaceId: string;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  image?: string;
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
  workspaceId: string;
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
  unit MaterialCategory;
  subcategory?: string;
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
  workspaceId?: string;
  supplierId?: string;
  search?: string;
  searchQuery?: string;
  inStockOnly?: boolean;
  lowStockOnly?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'pricePerUnit' | 'availableQuantity' | 'category';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// ============================================================================
// PROJECT ↔ MATERIAL RELATION DTOs
// ============================================================================

export type ProjectMaterialStatus = 'planned' | 'ordered' | 'received' | 'used';

export interface ProjectMaterialDTO {
  id: string;
  projectId: string;
  materialId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  status: ProjectMaterialStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectMaterialDTO {
  projectId: string;
  materialId: string;
  quantity: number;
  unit?: string;
  unitPrice?: number;
  status?: ProjectMaterialStatus;
  notes?: string | null;
}
// Moved from src/components/materials/MaterialDocuments.tsx
export interface MaterialDocument {
  id: string;
  materialId: string;
  documentType: 'invoice' | 'deliveryNote' | 'warranty' | 'certificate' | 'manual' | 'other';
  title: string;
  description?: string;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  documentNumber?: string;
  documentDate?: string;
  expiryDate?: string;
  supplierName?: string;
  
  // Legacy snakeCase for backward compatibility
  materialId?: string;
  documentType?: 'invoice' | 'deliveryNote' | 'warranty' | 'certificate' | 'manual' | 'other';
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  documentNumber?: string;
  documentDate?: string;
  expiryDate?: string;
  supplierName?: string;
  
  metadata?: MaterialDocumentMetadata;
  tags?: string[];
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Moved from src/components/project/ProjectMaterials.tsx
export interface ProjectMaterial {
  id: string;
  quantity: number;
  material: {
    id: string;
    name: string;
    description: string;
    category: string;
    unit: string;
    price_per_unit: number;
    originLocation?: string;
    image?: string;
  };
}

// Moved from src/components/project/TeamOverview.tsx
export interface ProjectResource {
  id: string;
  projectId: string;
  name: string;
  type: string;
  allocationDate: string | null;
  cost_per_unit: number | null;
  quantity: number | null;
  totalCost: number | null;
  unit: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Moved from src/components/tenders/DqeResourcePicker.tsx
export interface DqeResourceValue {
  resourceKind?: 'internalQualification' | 'externalProvider' | 'material';
  employee_qualification_id?: string;
  supplierId?: string;
  supplier_contract_ref?: string;
  estimatedHours?: number;
}