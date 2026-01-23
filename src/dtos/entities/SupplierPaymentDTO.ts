/**
 * Supplier Payment Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO } from '../shared';

export interface SupplierPaymentRequestDTO extends BaseEntityDTO {
  inspectionId: string;
  supplierId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  requestedAt: string;
  processedAt?: string;
  comments?: string;
  documents: string[];
  paymentType: string;
  bankAccount?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  workDescription?: string;
  workLocation?: string;
  workPeriod?: string;
  validatedBy?: string;
  validatedAt?: string;
  rejectionReason?: string;
}

export interface CreateSupplierPaymentRequestDTO {
  inspectionId: string;
  supplierId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  comments?: string;
  documents: string[];
  paymentType: string;
  bankAccount?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  workDescription?: string;
  workLocation?: string;
  workPeriod?: string;
  validatedBy?: string;
  validatedAt?: string;
  rejectionReason?: string;
}

export interface UpdateSupplierPaymentRequestDTO {
  status?: 'pending' | 'approved' | 'rejected' | 'paid';
  comments?: string;
  rejectionReason?: string;
  validatedBy?: string;
  validatedAt?: string;
  documents?: string[];
  paymentType?: string;
  bankAccount?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  workDescription?: string;
  workLocation?: string;
  workPeriod?: string;
}
