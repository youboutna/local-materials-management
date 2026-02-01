/**
 * Contract Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO, ContactInfoDTO, MonetaryDTO } from '../shared';

export interface ContractDTO extends BaseEntityDTO {
  contractNumber: string;
  title: string;
  description: string | null;
  projectId: string | null;
  supplierId: string | null;
  clientId: string | null;
  contractType: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate: string | null;
  totalValue: MonetaryDTO;
  currency: string;
  paymentTerms: PaymentTerms;
  deliveryTerms: string | null;
  scopeOfWork: string | null;
  deliverables: string[];
  milestones: ContractMilestone[];
  penalties: ContractPenalty[];
  documents: string[]; // Document IDs
  signedAt: string | null;
  signedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  renewalDate: string | null;
  autoRenewal: boolean;
  terminationClause: string | null;
  governingLaw: string | null;
  jurisdiction: string | null;
  metadata: Record<string, unknown> | null;
}

export interface ContractDetailsDTO extends ContractDTO {
  projectDetails?: {
    id: string;
    title: string;
    status: string;
  };
  supplierDetails?: {
    id: string;
    name: string;
    contactInfo: ContactInfoDTO;
  };
  clientDetails?: {
    id: string;
    name: string;
    contactInfo: ContactInfoDTO;
  };
  amendments: ContractAmendment[];
  payments: ContractPayment[];
  performanceMetrics: ContractPerformanceMetrics;
  riskAssessment: ContractRiskAssessment;
  complianceStatus: ContractComplianceStatus;
  auditTrail: ContractAuditEntry[];
}

export interface ContractSummaryDTO {
  id: string;
  contractNumber: string;
  title: string;
  contractType: ContractType;
  status: ContractStatus;
  totalValue: MonetaryDTO;
  startDate: string;
  endDate: string | null;
  progress: number;
  isOverdue: boolean;
  isExpiringSoon: boolean;
  projectTitle?: string;
  supplierName?: string;
}

export interface CreateContractDTO {
  contractNumber: string;
  title: string;
  description: string | null;
  projectId: string | null;
  supplierId: string | null;
  clientId: string | null;
  contractType: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate: string | null;
  totalValue: MonetaryDTO;
  currency: string;
  paymentTerms: PaymentTerms;
  deliveryTerms: string | null;
  scopeOfWork: string | null;
  deliverables: string[];
  milestones: ContractMilestone[];
  penalties: ContractPenalty[];
  documents: string[]; // Document IDs
  signedAt: string | null;
  signedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  renewalDate: string | null;
  autoRenewal: boolean;
  terminationClause: string | null;
  governingLaw: string | null;
  jurisdiction: string | null;
  metadata: Record<string, unknown> | null;
}

export type UpdateContractDTO = Partial<CreateContractDTO>;

export interface ContractFilterDTO {
  projectId?: string;
  supplierId?: string;
  clientId?: string;
  contractType?: ContractType;
  status?: ContractStatus;
  dateRange?: {
    start: string;
    end: string;
  };
  valueRange?: {
    min: number;
    max: number;
  };
  searchQuery?: string;
  isOverdue?: boolean;
  isExpiringSoon?: boolean;
  needsRenewal?: boolean;
}

export type ContractType = 
  | 'fixed_price'
  | 'time_materials'
  | 'cost_plus'
  | 'retainer'
  | 'service_agreement'
  | 'consulting'
  | 'construction'
  | 'supply'
  | 'maintenance'
  | 'other';

export type ContractStatus = 
  | 'draft'
  | 'pending_signature'
  | 'signed'
  | 'active'
  | 'suspended'
  | 'completed'
  | 'terminated'
  | 'expired'
  | 'cancelled';

export type PaymentTerms = 
  | 'net_30'
  | 'net_60'
  | 'net_90'
  | 'upon_delivery'
  | 'milestone_based'
  | 'progress_billing'
  | 'custom';

export interface ContractMilestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  value: MonetaryDTO;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedAt: string | null;
  deliverables: string[];
  dependencies: string[]; // Other milestone IDs
}

export interface ContractPenalty {
  id: string;
  type: 'delay' | 'quality' | 'performance' | 'compliance';
  description: string;
  amount: MonetaryDTO;
  isPercentage: boolean;
  triggerConditions: string[];
  isApplicable: boolean;
  appliedAt: string | null;
}

export interface ContractAmendment {
  id: string;
  amendmentNumber: number;
  title: string;
  description: string;
  type: 'addition' | 'modification' | 'termination' | 'extension';
  effectiveDate: string;
  changes: Record<string, unknown>;
  approvedBy: string;
  approvedAt: string;
  documents: string[]; // Document IDs
}

export interface ContractPayment {
  id: string;
  paymentNumber: number;
  amount: MonetaryDTO;
  dueDate: string;
  paidDate: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  associatedMilestones: string[];
  documents: string[]; // Document IDs
}

export interface ContractPerformanceMetrics {
  overallScore: number; // 0-100
  onTimeDelivery: number; // percentage
  qualityScore: number; // 0-100
  budgetAdherence: number; // percentage
  complianceScore: number; // 0-100
  lastUpdated: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ContractRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  financialRisk: 'low' | 'medium' | 'high' | 'critical';
  operationalRisk: 'low' | 'medium' | 'high' | 'critical';
  complianceRisk: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: Array<{
    factor: string;
    level: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string;
  }>;
  lastAssessed: string;
}

export interface ContractComplianceStatus {
  isCompliant: boolean;
  complianceScore: number; // 0-100
  violations: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    identifiedAt: string;
    resolvedAt: string | null;
  }>;
  lastAuditDate: string;
  nextAuditDate: string | null;
}

export interface ContractAuditEntry {
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  details: string;
  documents: string[]; // Document IDs
  ipAddress: string | null;
}
