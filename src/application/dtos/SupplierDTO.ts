/**
 * Supplier Data Transfer Objects
 */

export interface SupplierDTO {
  id: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDTO {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  category?: string;
  rating?: number;
  nif?: string;
  commerceRegisterRef?: string;
}

export interface UpdateSupplierDTO {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  category?: string;
  rating?: number;
  isActive?: boolean;
  nif?: string;
  commerceRegisterRef?: string;
}
