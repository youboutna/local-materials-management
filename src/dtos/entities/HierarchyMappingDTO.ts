// DTOs for Hierarchy Mapping
// Data transfer objects for hierarchy-employee integration

// Template position DTO (from UI/OrganizationalHierarchyManager)
export interface PositionTemplateDTO {
  title: string;
  department: string;
  category: string;
  level: number;
  parent?: string;
  permissions: {
    canApproveProjects: boolean;
    canApprovePayments: boolean;
    canEscalateToDirector: boolean;
  };
}

// Role suggestion result DTO
export interface RoleSuggestionDTO {
  suggestedRole: string;
  confidence: number;
  matchedPermissions: string[];
  missingPermissions: string[];
  extraPermissions: string[];
  compatibilityReason: string;
}

// Hierarchy assignment DTO
export interface HierarchyAssignmentDTO {
  employeeId: string;
  positionId: string;
  hierarchyId: string;
  organizationName: string;
  assignmentDate: string;
  assignedBy: string;
  notes?: string;
}

// Validation result DTO
export interface RoleValidationDTO {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
  alternativeRoles: Array<{
    role: string;
    compatibility: number;
    reason: string;
  }>;
}

// Complete hierarchy mapping DTO
export interface HierarchyMappingDTO {
  organizationName: string;
  totalPositions: number;
  assignedPositions: number;
  unassignedPositions: number;
  assignments: HierarchyAssignmentDTO[];
  validationResults: RoleValidationDTO[];
  mappingDate: string;
}
