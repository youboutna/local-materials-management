export interface OrganizationDTO {
  id: string;
  name: string;
  code?: string;
  orgType?: string;
  externalRef?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateOrganizationDTO = Omit<OrganizationDTO, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
export type UpdateOrganizationDTO = Partial<Omit<CreateOrganizationDTO, 'id'>>;
// Moved from src/dtos/entities/BaseEntityDTO.ts (reconciled)
export interface BaseEntityDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Moved from src/dtos/entities/OrganizationHierarchyDTO.ts (reconciled)
export interface OrganizationHierarchyDTO {
  id: string;
  organizationId?: string;
  employeeId?: string;
  parentId?: string;
  department?: string;
  positionTitle?: string;
  level?: number;
  directReportsCount?: number;
  canApproveProjects?: boolean;
  canApprovePayments?: boolean;
  canEscalateToDirector?: boolean;
  notificationPreferences?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

// Moved from src/dtos/entities/PhaseDTO.ts (reconciled)
export interface BaseEntityDTO {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Moved from src/dtos/entities/StakeholderDTO.ts (reconciled)
export interface StakeholderOrganizationDTO {
  id: string;
  name: string;
  type: string;
  industry?: string;
  size?: string;
  address?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}
