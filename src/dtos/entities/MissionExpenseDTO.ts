// Auto-generated DTO

// Moved from src/dtos/entities/InspectionPermissionDTO.ts (reconciled)
export interface PermissionContextDTO {
  userId: string;
  projectId: string;
  phaseId?: string;
  inspectionType: string;
}

// Moved from src/dtos/entities/InspectionPermissionDTO.ts (reconciled)
export interface PermissionResultDTO {
  hasPermission: boolean;
  reason?: string;
  alternativeInspectors?: AssignableInspectorDTO[];
  suggestedActions?: string[];
  requiresApproval?: boolean;
  approvalRequiredFrom?: string[];
}

// Moved from src/dtos/entities/InspectionPermissionDTO.ts (reconciled)
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
