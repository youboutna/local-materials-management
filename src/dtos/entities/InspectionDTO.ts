/**
 * Inspection Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 */

import { BaseEntityDTO } from '../shared';

/**
 * Inspection status enumeration
 * Current state of inspection execution
 */
export enum InspectionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_CHANGES = 'requires_changes',
  PENDING = 'pending',
  PLANNED = 'planned'
}

/**
 * Inspection type enumeration
 * Classification of inspection types
 */
export enum InspectionType {
  ROUTINE = 'routine',
  SPECIAL = 'special',
  SAFETY = 'safety',
  QUALITY = 'quality',
  COMPLIANCE = 'compliance'
}

/**
 * Inspection priority enumeration
 * Priority levels for inspections
 */
export enum InspectionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Main Inspection DTO
 * Core inspection data structure
 */
export interface InspectionDTO extends BaseEntityDTO {
  // Core identification
  id: string;
  title: string;
  description?: string;
  
  // Classification
  type: InspectionType;
  status: InspectionStatus;
  priority: InspectionPriority;
  
  // Assignment
  inspector?: string; // Employee ID only for DTO
  inspectorName?: string;
  inspectorRole?: string;
  
  // Timeline
  scheduledDate?: string;
  actualDate?: string;
  duration?: number; // in hours
  startTime?: string;
  endTime?: string;
  
  // Progress
  progress: number; // 0-100
  progressAtInspection?: number;
  
  // Location
  location?: string;
  siteConditions?: string;
  weatherConditions?: string;
  
  // Relationships
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  relatedInspections?: string[]; // Inspection IDs only for DTO
  
  // Results
  recommendations?: string[];
  actionItems?: string[];
  complianceStatus?: 'compliant' | 'non_compliant' | 'partially_compliant';
  qualityRating?: number; // 1-5
  
  // Documentation
  documents?: string[]; // Document IDs only for DTO
  attachments?: string[]; // Document IDs only for DTO
  photos?: string[]; // Photo URLs only for DTO
  videos?: string[]; // Video URLs only for DTO
  reports?: string[]; // Report URLs only for DTO
  
  // Metadata
  tags?: string[];
  notes?: string;
  
  // Form data fields (merged from InspectionFormDataDTO)
  checklist?: Array<{
    id: string;
    item: string;
    completed: boolean;
    notes?: string;
  }>;
  findings?: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'resolved';
  }>;
  
  // System fields
  createdAt: string;
  updatedAt: string;
}

/**
 * Inspection creation request interface
 * Input for creating new inspections
 */
export interface CreateInspectionDTO {
  title: string;
  description?: string;
  type: InspectionType;
  priority?: InspectionPriority;
  inspector?: string; // Employee ID only for DTO
  inspectorRole?: string;
  scheduledDate?: string;
  location?: string;
  siteConditions?: string;
  weatherConditions?: string;
  projectId?: string;
  phaseId?: string;
  taskId?: string;
  relatedInspections?: string[]; // Inspection IDs only for DTO
  documents?: string[]; // Document IDs only for DTO
  attachments?: string[]; // Document IDs only for DTO
  photos?: string[]; // Photo URLs only for DTO
  videos?: string[]; // Video URLs only for DTO
  reports?: string[]; // Report URLs only for DTO
  tags?: string[];
  notes?: string;
}

/**
 * Inspection update request interface
 * Input for updating existing inspections
 */
export interface UpdateInspectionDTO {
  title?: string;
  description?: string;
  type?: InspectionType;
  status?: InspectionStatus;
  priority?: InspectionPriority;
  inspector?: string; // Employee ID only for DTO
  inspectorRole?: string;
  scheduledDate?: string;
  actualDate?: string;
  duration?: number; // in hours
  startTime?: string;
  endTime?: string;
  progress?: number; // 0-100
  progressAtInspection?: number;
  location?: string;
  siteConditions?: string;
  weatherConditions?: string;
  findings?: string[];
  recommendations?: string[];
  actionItems?: string[];
  complianceStatus?: 'compliant' | 'non_compliant' | 'partially_compliant';
  qualityRating?: number; // 1-5
  relatedInspections?: string[]; // Inspection IDs only for DTO
  documents?: string[]; // Document IDs only for DTO
  attachments?: string[]; // Document IDs only for DTO
  photos?: string[]; // Photo URLs only for DTO
  videos?: string[]; // Video URLs only for DTO
  reports?: string[]; // Report URLs only for DTO
  tags?: string[];
  notes?: string;
  
  // Metadata
  updatedBy?: string;
  changeReason?: string;
}

/**
 * Inspection summary interface
 * Lightweight inspection representation for lists
 */
export interface InspectionSummaryDTO extends BaseEntityDTO {
  id: string;
  title: string;
  type: InspectionType;
  status: InspectionStatus;
  priority: InspectionPriority;
  inspector?: string; // Employee ID only for DTO
  inspectorName?: string;
  scheduledDate?: string;
  actualDate?: string;
  progress?: number;
  projectId?: string;
  phaseId?: string;
  isOverdue?: boolean;
  complianceStatus?: 'compliant' | 'non_compliant' | 'partially_compliant';
  qualityRating?: number;
  tags?: string[];
  projectTitle?: string;
  phaseName?: string;
}

/**
 * Inspection statistics interface
 * Performance metrics for inspection management
 */
export interface InspectionStatisticsDTO {
  totalInspections: number;
  scheduledInspections: number;
  completedInspections: number;
  inProgressInspections: number;
  overdueInspections: number;
  averageDuration?: number;
  complianceRate: number;
  averageQualityRating?: number;
  byType: Record<InspectionType, number>;
  byStatus: Record<InspectionStatus, number>;
  byPriority: Record<InspectionPriority, number>;
  lastUpdated?: string;
}

/**
 * Inspection checklist interface
 * Checklist items for inspections
 */
export interface InspectionChecklistDTO {
  id: string;
  inspectionId: string;
  item: string;
  description?: string;
  category?: string;
  isRequired: boolean;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string; // Employee ID only for DTO
  notes?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Inspection finding interface
 * Issues found during inspections
 */
export interface InspectionFindingDTO {
  id: string;
  inspectionId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved';
  category?: string;
  location?: string;
  assignedTo?: string; // Employee ID only for DTO
  dueDate?: string;
  resolvedAt?: string;
  resolvedBy?: string; // Employee ID only for DTO
  resolution?: string;
  photos?: string[]; // Photo URLs only for DTO
  documents?: string[]; // Document IDs only for DTO
  cost?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Inspection filter interface
 * Filter criteria for inspection queries
 */
export interface InspectionFilterDTO {
  projectId?: string;
  phaseId?: string;
  inspector?: string;
  type?: InspectionType;
  status?: InspectionStatus;
  priority?: InspectionPriority;
  scheduledDateRange?: {
    startDate?: string;
    endDate?: string;
  };
  actualDateRange?: {
    startDate?: string;
    endDate?: string;
  };
  searchQuery?: string;
  tags?: string[];
  isOverdue?: boolean;
  complianceStatus?: 'compliant' | 'non_compliant' | 'partially_compliant';
}

export interface InspectionDetails extends InspectionDTO {
  projectDetails?: {
    title: string;
    status: string;
    progress: number;
  };
  phaseDetails?: {
    name: string;
    description: string;
  };
  documentsList?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
  }>;
  issues?: Array<{
    id: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'open' | 'in_progress' | 'resolved';
    deadline?: string;
    assignedTo?: string;
  }>;
}

export interface CreateInspectionDTO {
  projectId: string;
  projectTitle?: string;
  phaseId?: string;
  phaseName?: string;
  date: string;
  inspector: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'approved' | 'rejected' | 'requires_changes' | 'pending';
  progressAtInspection: number;
  paymentType?: string;
  comments?: string;
  documents?: Record<string, unknown>;
}

export type UpdateInspectionDTO = Partial<CreateInspectionDTO>;

export interface InspectionDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
  uploadedAt: string;
  uploadedBy?: string;
  inspectionId: string;
}

export interface InspectionWithPaymentRequest extends InspectionDTO {
  paymentRequest?: {
    id: string;
    amount: number;
    status: string;
    requestedAt: string;
    processedAt?: string;
  };
}

export interface InspectionExecutionData {
  inspectionId: string;
  documents: InspectionDocument[];
  statusUpdate: {
    status: string;
    comments?: string;
    progressAtCompletion?: number;
  };
  notifications?: Array<{
    recipientId: string;
    type: string;
    message: string;
  }>;
}

// Add inspection execution specific interfaces
export interface AddMeasurementRequestDTO {
  inspectionId: string;
  measurement: Omit<InspectionMeasurement, 'id'>;
}

export interface AddParticipantRequestDTO {
  inspectionId: string;
  participant: Omit<InspectionParticipant, 'id'>;
}

export interface CompleteInspectionRequestDTO {
  inspectionId: string;
  finalData: {
    overallConformity: ConformityStatus;
    notes?: string;
    documents?: string[];
  };
}

export interface InspectionOperationResultDTO {
  success: boolean;
  error?: string;
}

export interface InspectionApprovalContext {
  inspectionId: string;
  projectId: string;
  phaseId?: string | null;
  approvalType: 'phase' | 'final' | 'quality';
  requiredSignatures: number;
  receivedSignatures: number;
  nextActions?: InspectionAction[];
}

export interface InspectionAction {
  type: 'signature' | 'document' | 'payment' | 'notification';
  required: boolean;
  completed: boolean;
  deadline?: string;
  assigneeId?: string;
}

export interface VerificationItemDTO {
  id: string;
  name: string;
  title: string;
  status: 'pending' | 'in_progress' | 'verified' | 'failed' | 'skipped';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

// Add specific document interface from InspectionService
export interface InspectionDocumentDTO {
  id: string;
  type: string;
  name: string;
  url?: string;
  uploadedAt?: string;
  inspectionId: string;
  size?: number;
  uploadedBy?: string;
}

// Add execution data interface from InspectionService
export interface InspectionExecutionDataDTO {
  id: string;
  status: string;
  progressAtInspection?: number;
  comments?: string;
  documents: InspectionDocumentDTO[];
  completedAt?: string;
  completedBy?: string;
  projectId?: string;
  phaseId?: string;
  stepId?: string;
  inspector?: string;
  date?: string;
}

// Add payment validation interface from InspectionService
export interface InspectionPaymentValidationDTO {
  status: string;
  comments: string;
  payment_type: string;
  payment_status?: string;
  project_id?: string;
  inspection_id?: string;
  rejection_notes?: string;
}
