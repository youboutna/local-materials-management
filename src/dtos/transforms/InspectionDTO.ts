/**
 * Inspection DTOs
 * Data transfer objects for API/UI exchanges
 * NOT domain entities - just data structures
 */

export interface InspectionDocumentDTO {
  id: string;
  type: string;
  name: string;
  url?: string;
  uploadDate?: string;
  uploadedBy?: string;
  size?: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface InspectionDTO {
  id: string;
  projectId: string;
  phaseId?: string;
  inspectionType: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'cancelled' | 'pending' | 'requires_changes';
  inspectorId?: string;
  inspectorName?: string;
  scheduledDate?: string;
  completionDate?: string;
  location?: string;
  requirements?: string[];
  findings?: string[];
  recommendations?: string[];
  score?: number;
  maxScore?: number;
  documents?: InspectionDocumentDTO[];
  paymentType?: string;
  progressAtInspection?: number;
  comments?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInspectionRequestDTO {
  projectId: string;
  phaseId?: string;
  inspectionType: string;
  title: string;
  description?: string;
  inspectorId?: string;
  scheduledDate?: string;
  location?: string;
  requirements?: string[];
  documents?: InspectionDocumentDTO[];
}

export interface UpdateInspectionRequestDTO {
  title?: string;
  description?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'cancelled' | 'pending' | 'requires_changes';
  scheduledDate?: string;
  completionDate?: string;
  location?: string;
  findings?: string[];
  recommendations?: string[];
  score?: number;
  comments?: string;
  documents?: InspectionDocumentDTO[];
}
