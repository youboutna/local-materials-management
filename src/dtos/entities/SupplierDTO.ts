/**
 * Supplier Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO, ContactInfoDTO } from '../shared';

export interface SupplierDTO extends BaseEntityDTO {
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
