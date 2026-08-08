/**
 * Reception Management Data Transfer Objects
 * Centralized for hexagonal architecture
 */

import { BaseEntityDTO } from '@/dtos/entities/OrganizationDTO';;

export enum ReceptionType {
  PROVISIONAL = 'provisional',
  DEFINITIVE = 'definitive'
}

export enum ReceptionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRE_RESUBMISSION = 'require_resubmission'
}

export interface ReceptionDocumentDTO extends BaseEntityDTO {
  id: string;
  projectId: string;
  phaseId?: string;
  title: string;
  description: string;
  type: 'certificate' | 'report' | 'photo' | 'plan' | 'other';
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  isRequired: boolean;
  isSubmitted: boolean;
  validationStatus: 'pending' | 'approved' | 'rejected';
  validationNotes?: string;
}

export interface ReceptionInspectionDTO extends BaseEntityDTO {
  id: string;
  projectId: string;
  phaseId?: string;
  title: string;
  description: string;
  inspectionType: 'provisional' | 'definitive';
  scheduledDate: string;
  actualDate?: string;
  inspectorId: string;
  inspectorName: string;
  status: 'scheduled' | 'completed' | 'approved' | 'rejected';
  findings: ReceptionFindingDTO[];
  recommendations: string[];
  nextInspectionDate?: string;
  requiresFollowUp: boolean;
}

export interface ReceptionFindingDTO {
  id: string;
  category: 'conformity' | 'defect' | 'safety' | 'quality' | 'documentation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  photoUrls?: string[];
  resolutionRequired: boolean;
  resolutionDeadline?: string;
  resolutionStatus: 'pending' | 'inProgress' | 'resolved';
  assignedTo?: string;
}

export interface ReceptionDTO extends BaseEntityDTO {
  id: string;
  projectId: string;
  phaseId?: string;
  type: ReceptionType;
  status: ReceptionStatus;
  scheduledDate: string;
  actualDate?: string;
  receptionCommittee: string[];
  chairmanId: string;
  chairmanName: string;
  participants: ReceptionParticipantDTO[];
  documents: ReceptionDocumentDTO[];
  inspections: ReceptionInspectionDTO[];
  findings: ReceptionFindingDTO[];
  decisions: ReceptionDecisionDTO[];
  conditions: ReceptionConditionDTO[];
  provisionalValidUntil?: string;
  definitiveApprovalDate?: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceptionParticipantDTO {
  id: string;
  name: string;
  role: string;
  organization: string;
  signature?: string;
  signatureDate?: string;
  hasApproved: boolean;
}

export interface ReceptionDecisionDTO {
  id: string;
  type: 'approval' | 'conditionalApproval' | 'rejection' | 'deferment';
  description: string;
  conditions?: string[];
  validUntil?: string;
  decidedBy: string;
  decidedAt: string;
}

export interface ReceptionConditionDTO {
  id: string;
  description: string;
  category: 'corrective' | 'preventive' | 'documentation' | 'payment';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: string;
  responsibleParty: string;
  status: 'pending' | 'inProgress' | 'completed' | 'overdue';
  completedAt?: string;
}

// Validation DTOs

export interface ReceptionValidationErrorDTO {
  field: string;
  code: string;
  message: string;
  severity: 'error';
  suggestedFix: string;
}

export interface ReceptionValidationWarningDTO {
  field: string;
  code: string;
  message: string;
  severity: 'warning';
  recommendation?: string;
}

// Workflow DTOs
export interface ReceptionWorkflowDTO {
  projectId: string;
  currentStep: number;
  totalSteps: number;
  ste;
}

export interface ReceptionWorkflowStepDTO {
  step: number;
  name: string;
  title: string;
  description: string;
  status: 'pending' | 'inP