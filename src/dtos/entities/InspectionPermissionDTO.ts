/**
 * Inspection Permission Data Transfer Objects
 * DTOs for inspection permission management operations
 * Following hexagonal architecture principles
 */



export interface AssignableInspectorDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  specializations: string[];ectorDTO[];
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
  date: stringace CreatePermissionRequestDTO {
  userId: string;
  projectId: string;
  phaseId?: string;
  inspectionType: string;
  requestedBy: string;
  requestDate: string;
  urgencyLevel?: 'low' | 'medium' | 'high' | 'urgent';
  notes?: string;InspectionTypeRequirementDTO {
  inspectionType: string;
  requiredCertifications: string[];
  requiredSpecializations: string[];
  minimumExperience?: number;
  estimatedDuration?: number;
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresApproval: boolean;
  a