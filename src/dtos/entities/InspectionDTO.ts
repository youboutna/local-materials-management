/**
 * Inspection Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 * Following clean code principles: camelCase only, no business logic
 */

import { BaseEntityDTO } from '../shared';
import { CreateDocumentDTO } from './DocumentDTO';

/**
 * Inspection status enumeration
 * Current state of inspection execution
 */
export enum InspectionStatus {
  SCHEDULED = 'scheduled',
  PENDING = 'pending',
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REQUIRES_REVIEW = 'requires_review',
  REQUIRES_CHANGES = 'requires_changes',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
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
  
  // Legacy snake_case aliases for backward compatibility (Rule #9)
  project_id?: string;        // Legacy: Use projectId instead
  date?: string;             // Legacy: Use scheduledDate instead
  progress_at_inspection?: number; // Legacy: Use progress instead
  phase_id?: string;          // Legacy: Use phaseId instead
  created_at?: string;         // Legacy: Use createdAt from BaseEntityDTO instead
  updated_at?: string;         // Legacy: Use updatedAt from BaseEntityDTO instead
  videos?: string[]; // Video URLs only for DTO
  reports?: string[]; // Report URLs only for DTO
  tags?: string[];
  notes?: string;

  // Supabase table fields for adapter compatibility
  comments?: string | null;
  payment_type?: string | null;
}

/**
 * Inspection update request interface
 * Input for updating existing inspections
 */
export interface CreateInspectionDTO {
  id?: string; // Optional ID for updates
  title?: string;
  description?: string;
  type?: InspectionType;
  status?: InspectionStatus;
  priority?: InspectionPriority;
  inspector?: string; // Employee ID only for DTO
  inspectorRole?: string;
  scheduledDate?: string; // Preferred: Use scheduledDate instead
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
  projectId: string;
  projectTitle?: string;
  phaseId?: string;
  phaseName?: string;
  date: string;
  paymentType?: string;
  comments?: string;
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


export type UpdateInspectionDTO = Partial<CreateInspectionDTO>;

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
  documents: InspectionDocumentEntity[];
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
export interface InspectionMeasurement {
  id?: string;
  type: string;
  value: number;
  unit: string;
  notes?: string;
  measuredAt?: string;
  measuredBy?: string;
}

export interface InspectionParticipant {
  id?: string;
  name: string;
  role: string;
  department?: string;
  contact?: string;
  joinedAt?: string;
}

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

export interface InspectionExecutionResult {
  success: boolean;
  inspectionId?: string;
  error?: string;
  data?: {
    measurements?: InspectionMeasurement[];
    participants?: InspectionParticipant[];
    documents?: string[];
    notes?: string;
    completedAt?: string;
  };
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

// VerificationItemDTO est défini de façon canonique dans './MilestoneDTO'
// (un item de vérification appartient au checkpoint d'un jalon).
export type { VerificationItemDTO } from './MilestoneDTO';


// Add execution data interface from InspectionService
export interface InspectionExecutionDataDTO {
  id: string;
  status: string;
  progressAtInspection?: number;
  comments?: string;
  documents: InspectionDocumentEntity[];
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

// Types moved from InspectionExecutionService
export interface InspectionExecutionData {
  id: string;
  inspectionId: string;
  status: 'in_progress' | 'completed' | 'paused';
  progressAtInspection: number;
  comments?: string;
  documents: InspectionDocumentEntity[];
  observations: InspectionObservation[];
  checklist: ChecklistItem[];
  projectId: string;
  inspector: string;
  date: string;
  // Extended fields
  measurements?: unknown[];
  participants?: unknown[];
  location?: { latitude: number; longitude: number; address?: string; captured_at?: string };
  started_at?: Date | string;
  completed_at?: string;
  overall_conformity?: ConformityStatus;
  progress_percentage?: number;
  summary?: string;
  recommendations?: string[];
  corrective_actions_required?: boolean;
}

export interface InspectionObservation {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved';
  photo?: string;
  createdAt: string;
  resolvedAt?: string;
  // Legacy aliases
  type?: string;
  category?: string;
  conformity?: string;
  created_at?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  completed: boolean;
  checked?: boolean;
  notes?: string;
  category?: string;
}

// Updated InspectionDocument interface to match service
export interface InspectionDocumentEntity {
  id: string;
  name: string;
  type: 'certificate' | 'checklist' | 'photo' | 'report' | 'scan';
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
  size?: number;
  mime_type?: string;
  uploaded_at?: string;
  uploaded_by?: string;
}

// Additional types for UI compatibility
export type ObservationType = 'technical' | 'safety' | 'quality' | 'non_conformity';
export type SeverityLevel = 'minor' | 'major' | 'critical';

// Observation categories for UI
export const OBSERVATION_CATEGORIES = {
  technical: [
    'Structure', 'Fondations', 'Maçonnerie', 'Charpente',
    'Électricité', 'Plomberie', 'Menuiserie', 'Peinture', 'Finitions'
  ],
  safety: [
    'EPI', 'Signalisation', 'Accès', 'Incendie',
    'Électrique', 'Hauteur', 'Excavation', 'Circulation'
  ],
  quality: [
    'Matériaux', 'Dimensions', 'Alignement', 'Nivellement',
    'Étanchéité', 'Isolation', 'Acoustique', 'Esthétique'
  ],
  non_conformity: [
    'Matériaux non conformes', 'Dimensions incorrectes', 'Mauvaise exécution', 'Non-respect normes'
  ],
};

// Updated ConformityStatus to match service
export type ConformityStatus = 'conforme' | 'non_conforme' | 'en_attente';

// Checklist templates
export const CHECKLIST_TEMPLATES: Record<string, ChecklistItem[]> = {
  standard: [
    { id: '1', title: 'Vérification des plans', required: true, completed: false },
    { id: '2', title: 'Contrôle des matériaux', required: true, completed: false },
    { id: '3', title: 'Sécurité du chantier', required: true, completed: false }
  ]
};

// Request DTOs moved from service
export type StartInspectionRequestDto = {
  inspectionId: string;
  projectId: string;
  inspector: string;
  phaseId?: string;
  stepId?: string;
  comments?: string;
  location?: { latitude: number; longitude: number; address?: string };
};

export type AddObservationRequestDto = {
  inspectionId: string;
  observation: Omit<InspectionObservation, 'id' | 'createdAt'>;
};

export type AddDocumentRequestDto = {
  inspectionId: string;
  document: CreateDocumentDTO;
};

export type UpdateChecklistItemRequestDto = {
  inspectionId: string;
  itemId: string;
  updates: Partial<ChecklistItem>;
};
