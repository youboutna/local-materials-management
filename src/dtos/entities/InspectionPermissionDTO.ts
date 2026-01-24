/**
 * Inspection Permission Data Transfer Objects
 * DTOs for inspection permission management operations
 * Following hexagonal architecture principles
 */

export interface PermissionContextDTO {
  userId: string;
  projectId: string;
  phaseId?: string;
  inspectionType: string;
}

export interface AssignableInspectorDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  specializations: string[];
  certifications: string[];
  maxConcurrentInspections: number;
  currentInspections: number;
  availabilityStatus?: 'available' | 'busy' | 'unavailable';
  lastInspectionDate?: string;
  averageRating?: number;
  inspectionCount?: number;
  isDefault?: boolean;
  isEngineeringConsultant?: boolean;
  isTechnicalManager?: boolean;
}

export interface PermissionResultDTO {
  hasPermission: boolean;
  reason?: string;
  alternativeInspectors?: AssignableInspectorDTO[];
  suggestedActions?: string[];
  requiresApproval?: boolean;
  approvalRequiredFrom?: string[];
}

export interface InspectorAssignmentDTO {
  inspectorId: string;
  inspectionId: string;
  assignmentDate: string;
  assignedBy: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  notes?: string;
  estimatedDuration?: number;
  actualDuration?: number;
}

export interface InspectorAvailabilityDTO {
  inspectorId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'busy' | 'unavailable';
  currentAssignments: number;
  maxAssignments: number;
  location?: string;
  specializationRequirements: string[];
}

export interface CreatePermissionRequestDTO {
  userId: string;
  projectId: string;
  phaseId?: string;
  inspectionType: string;
  requestedBy: string;
  requestDate: string;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;
}

export interface UpdateInspectorStatusDTO {
  inspectorId: string;
  availabilityStatus: 'available' | 'busy' | 'unavailable';
  currentInspections?: number;
  maxConcurrentInspections?: number;
  lastUpdated?: string;
  updatedBy: string;
}

export interface InspectionTypeRequirementDTO {
  inspectionType: string;
  requiredCertifications: string[];
  requiredSpecializations: string[];
  minimumExperience?: number;
  estimatedDuration?: number;
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  approvalRoles: string[];
}
