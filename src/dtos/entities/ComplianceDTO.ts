/**
 * Compliance Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

import { BaseEntityDTO } from '../shared';

// Enum types for compliance
export type ComplianceType = 'regulatory' | 'insurance' | 'bank_guarantee' | 'technical' | 'environmental' | 'health_safety' | 'quality' | 'financial' | 'data_protection' | 'labor_law' | 'procurement';
export type ComplianceStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'requires_action';
export type CompliancePriority = 'low' | 'medium' | 'high' | 'critical';
export type ComplianceLevel = 'partial' | 'full' | 'exceeded';
export type ComplianceRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ComplianceItemDTO extends BaseEntityDTO {
  id: string;
  type: ComplianceType;
  title: string;
  description?: string;
  status: ComplianceStatus;
  priority: CompliancePriority;
  deadline?: string;
  responsible: string;
  projectId: string;
  bankGuaranteeId?: string;
  createdBy: string;
  updatedBy?: string;
  category: string;
  subcategory?: string;
  complianceLevel: ComplianceLevel;
  lastReviewed: string;
  nextReview: string;
  externalReferences: string[];
  riskLevel: ComplianceRiskLevel;
  mitigationRequired: boolean;
  mitigationPlan?: string;
  // Legacy snake_case aliases for compatibility
  project_id?: string;
  bank_guarantee_id?: string;
  created_by?: string;
  updated_by?: string;
  compliance_level?: string;
  last_reviewed?: string;
  next_review?: string;
  external_references?: string[];
  risk_level?: ComplianceRiskLevel;
  mitigation_required?: boolean;
  mitigation_plan?: string;
}

export interface ComplianceDocumentDTO extends BaseEntityDTO {
  id: string;
  complianceItemId: string;
  documentId: string;
  category: string;
  subcategory?: string;
  isRequired: boolean;
  uploadedBy?: string;
  fileUrl?: string;
  uploadedAt: string;
  // Legacy snake_case aliases for compatibility
  compliance_item_id?: string;
  document_id?: string;
  is_required?: boolean;
  uploaded_by?: string;
  file_url?: string;
  uploaded_at?: string;
}

export interface ComplianceNoteDTO extends BaseEntityDTO {
  id: string;
  complianceItemId: string;
  note: string;
  createdBy: string;
  createdAt: string;
  // Legacy snake_case aliases for compatibility
  compliance_item_id?: string;
  created_by?: string;
  created_at?: string;
}

export interface ComplianceAuditEntryDTO extends BaseEntityDTO {
  id: string;
  complianceItemId: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: string;
  // Legacy snake_case aliases for compatibility
  compliance_item_id?: string;
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changed_by?: string;
  changed_at?: string;
}

export interface ComplianceValidationRuleDTO extends BaseEntityDTO {
  id: string;
  name: string;
  description: string;
  required: boolean;
  validationType: 'document' | 'inspection' | 'certification' | 'review';
  frequency: 'once' | 'monthly' | 'quarterly' | 'annually';
  lastValidated?: string;
  nextDue: string;
  status: 'pending' | 'valid' | 'expired' | 'failed';
}

// Request DTOs for service layer
export interface CreateComplianceRequestDTO {
  type: ComplianceType;
  title: string;
  description?: string;
  status?: ComplianceStatus;
  priority?: CompliancePriority;
  deadline?: string;
  responsible: string;
  projectId: string;
  bankGuaranteeId?: string;
  category?: string;
  subcategory?: string;
  complianceLevel?: ComplianceLevel;
  lastReviewed?: string;
  nextReview?: string;
  externalReferences?: string[];
  riskLevel?: ComplianceRiskLevel;
  mitigationRequired?: boolean;
  mitigationPlan?: string;
  createdBy: string;
}

export interface UpdateComplianceRequestDTO {
  title?: string;
  description?: string;
  status?: ComplianceStatus;
  priority?: CompliancePriority;
  deadline?: string;
  responsible?: string;
  category?: string;
  subcategory?: string;
  complianceLevel?: ComplianceLevel;
  lastReviewed?: string;
  nextReview?: string;
  externalReferences?: string[];
  riskLevel?: ComplianceRiskLevel;
  mitigationRequired?: boolean;
  mitigationPlan?: string;
  updatedBy?: string;
}

export interface CreateComplianceNoteRequestDTO {
  complianceItemId: string;
  note: string;
  createdBy: string;
}

export interface ComplianceStatisticsDTO {
  totalItems: number;
  approvedItems: number;
  pendingItems: number;
  inProgressItems: number;
  rejectedItems: number;
  criticalItems: number;
  overdueItems: number;
  overallComplianceScore: number;
  itemsByType: Record<ComplianceType, number>;
  itemsByStatus: Record<ComplianceStatus, number>;
  itemsByPriority: Record<CompliancePriority, number>;
}

export interface ComplianceFilterDTO {
  projectId?: string;
  type?: ComplianceType;
  status?: ComplianceStatus;
  priority?: CompliancePriority;
  responsible?: string;
  deadline?: string;
  riskLevel?: ComplianceRiskLevel;
  mitigationRequired?: boolean;
}

export interface ComplianceAlertDTO {
  id: string;
  complianceItemId: string;
  type: 'overdue' | 'criticalPriority' | 'risk_level' | 'mitigation_required';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: strnceAuditEntry = ComplianceAuditEntryDTO;
export type CreateComplianceData = CreateComplianceRequestDTO;
export type UpdateComplianceData = UpdateComplianceRequestDTO;