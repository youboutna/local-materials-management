/**
 * InvoiceDTO - Data Transfer Objects for invoice operations
 * Follows hexagonal architecture with proper camelCase naming
 */

import { BaseEntityDTO } from '@/dtos/entities/OrganizationDTO';;

export interface InvoiceDTO extends BaseEntityDTO {
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  projectId?: string;
  projectName?: string;
  purchaseOrderNumber?: string;
  paymentTerms?: string;
  paymentMethod?: 'bank_transfer' | 'check' | 'cash' | 'credit_card';
  taxAmount?: number;
  totalAmount?: number;
  attachments?: InvoiceAttachmentDTO[];
  metadata?: {
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    notes?: string;
    customFields?: Record<string, string | number | boolean>;
  };
}

export interface ParsedInvoiceDTO extends BaseEntityDTO {
  originalFileName: string;
  parsedAt: string;
  supplierInfo: {
    supplierId: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
  };
  invoiceData: {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    amount: number;
    currency: string;
    taxAmount?: number;
    totalAmount?: number;
    description?: string;
  };
  lineItems?: InvoiceLineItemDTO[];
  extractionConfidence: number;
  validationStatus: 'pending' | 'validated' | 'rejected' | 'needs_review';
  validationErrors?: string[];
  processingStatus: 'processing' | 'completed' | 'failed';
}

export interface UpdateInvoiceDTO {
  invoiceNumber?: string;
  amount?: number;
  currency?: string;
  dueDate?: string;
  status?: InvoiceDTO['status'];
  description?: string;
  projectId?: string;
  purchaseOrderNumber?: string;
  paymentTerms?: string;
  paymentMethod?: InvoiceDTO['paymentMethod'];
  taxAmount?: number;
  totalAmount?: number;
  attachments?: Omit<InvoiceAttachmentDTO, 'id' | 'createdAt' | 'updatedAt'>[];
  metadata?: Partial<InvoiceDTO['metadata']>;
}

export interface InvoiceAttachmentDTOort interface InvoiceSearchCriteriaDTO {
  supplierId?: string;
  status?: InvoiceDTO['status'];
  projectId?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  amountRange?: {
    minAmount: number;
    maxAmount: number;
  };
  searchText?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface InvoiceSearchResultDTO {
  invoices: InvoiceDTO[];
  totalCount: number;
  facets: {
    statuses: Record<string, number>;
    suppliers: Record<string, number>;
    categories: Record<string, number>;
    priorities: Record<string, number>;
  };
  suggestions?: Array<{
    type: 'correction' | 'expansion' | 'refinement';
    text: string;
    reason: string;
  }>;
}

 Record<string, number>;
  monthlyTrends: Array<{
    month: string;
    count: number;
    amount: number;
  }>;
  overdueAnalysis: {
    count: number;
    amount: number;
    averageDaysOverdue: number;
  };
}

export interface InvoiceValidationDTO {
  iray<{
    action: string;
    reason: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

export interface InvoiceProcessingDTO {
  invoiceId: string;
  status: 'queued' | 'processing' | 'validated' | 'rejected' | 'completed';
  steps: Array<{
    step: string;
    status: 'pending' | 'inProgress' | 'completed' | 'failed';
    startedA