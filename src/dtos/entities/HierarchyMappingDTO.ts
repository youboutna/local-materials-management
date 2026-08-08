// DTOs for Hierarchy Mapping
// Data transfer objects for hierarchy-employee integration

// Template position DTO (from UI/OrganizationalHierarchyManager)


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
export interface HierarchyAssignmeport interface RoleValidationDTO {
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
idationResults: RoleValidationDTO[];
  mappingDate: string;
}