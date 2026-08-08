/**
 * Supplier Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO, ContactInfoDTO } from '../shared';

export interface SupplierDTO extends BaseEntityDTO {
  externalRef?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  category?: string;
  rating?: number;
  isActive: boolean;
  nif?: string;
  commerceRegisterRef?: string;

  // NEW: Additional database fields from suppliers table
  accountNumber?: string;                    // account_number
  bankName?: string;                         // bank_name
  defaultPasswordResetRequired?: boolean;    // default_password_reset_required
  rib?: string;                              // rib
  userId?: string;                           // user_id
}

export interface SupplierDetailsDTO extends SupplierDTO {
  contactInfo?: ContactInfoDTO;
  materials?: Array<{
    id: string;
    name: string;
    price: number;
    unit: string;
    availability: string;
  }>;
  projects?: Array<{
    id: string;
    title: string;
    status: string;
    contractValue?: number;
  }>;
  performanceMetrics?: {
    averageDeliveryTime: number;
    qualityScore: number;
    onTimeDeliveryRate: number;
    totalContracts: number;
  };
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
  }>;
  certifications?: Array<{
    name: string;
    issuedBy: string;
    validUntil: string;
    documentUrl: string;
  }>;
}

export interface SupplierSummaryDTO {
  id: string;
  name: string;
  category?: string;
  rating?: number;
  isActive: boolean;
  projectCount?: number;
  totalContractValue?: number;
  averagePerformance?: number;
}

export interface CreateSupplierDTO {
  externalRef?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  category?: string;
  rating?: number;
  isActive: boolean;
  nif?: string;
  commerceRegisterRef?: string;
}

export type UpdateSupplierDTO = Partial<CreateSupplierDTO>;

export interface SupplierFilterDTO {
  category?: string;
  isActive?: boolean;
  ratingRange?: {
    min: number;
    max: number;
  };
  searchQuery?: string;
  hasActiveContracts?: boolean;
}

export interface SearchSuppliersOptions {
  searchTerm?: string;
  isActive?: boolean;
  limit?: number;
}

export interface SearchSuppliersResult {
  suppliers: SupplierSummaryDTO[];
  total: number;
}
// Moved from src/components/project/EnhancedTaskManager.tsx
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  type?: string;
}

// Moved from src/components/suppliers/EnhancedDocumentSharing.tsx
export interface Supplier {
  id: string;
  name: string | null;
  email?: string | null;
  contactPerson?: string | null;
}

// Moved from src/hooks/hexagonal/useSuppliersManagementHex.ts
export interface SupplierFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  nif?: string;
  commerce_register_ref?: string;
}

// Moved from src/hooks/hexagonal/useActiveSuppliersHex.ts
export interface ActiveSupplier {
  id: string;
  name: string;
  contactPerson?: string;
  type?: string;
}
// Moved from src/dtos/entities/PaymentInitiationDTO.ts (reconciled)
export interface SupplierCompletionData {
  completedAt: string;
  finalAmount: number;
  description: string;
  paymentReason: string;
  additionalDocuments?: string[];
  notes?: string;
}

// Moved from src/dtos/entities/PaymentInitiationDTO.ts (reconciled)
export interface SupplierCompletionDTO {
  notificationId: string;
  finalAmount: number;
  description: string;
  paymentReason: string;
  additionalDocuments?: string[];
  notes?: string;
}

// Moved from src/dtos/entities/PaymentInitiationDTO.ts (reconciled)
export interface SupplierInfoDTO {
  userId: string;
  name: string;
  email: string;
}
