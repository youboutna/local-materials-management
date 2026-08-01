/**
 * Project Stakeholder Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

export interface ProjectStakeholderDTO {
  id: string;
  projectId: string;
  stakeholderType: string;
  stakeholderEntityType: 'employee' | 'supplier';
  employeeId?: string;
  supplierId?: string;
  organizationId?: string;
  externalRef?: string;
  stakeholderId?: string;
  stakeholderName?: string;
  role?: string;
  permissions?: string[];
  contactInfo?: Record<string, unknown>;
  roleDescription?: string;
  isPrimary?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectStakeholderDTO {
  projectId: string;
  stakeholderType: string;
  stakeholderEntityType: 'employee' | 'supplier';
  employeeId?: string;
  supplierId?: string;
  organizationId?: string;
  externalRef?: string;
  roleDescription?: string;
  isPrimary?: boolean;
}

export interface UpdateProjectStakeholderDTO {
  stakeholderType?: string;
  stakeholderEntityType?: 'employee' | 'supplier';
  employeeId?: string;
  supplierId?: string;
  organizationId?: string;
  externalRef?: string;
  roleDescription?: string;
  isPrimary?: boolean;
}

export interface StakeholderDelegationDTO {
  role: string;
  employees: Array<{
    id: string;
    selected: boolean;
    roleDescription?: string;
    isPrimary?: boolean;
  }>;
}

export interface ExternalStakeholderDTO {
  id: string;
  selected: boolean;
  type?: string;
  roleDescription?: string;
  isPrimary?: boolean;
}

export interface StakeholderInputDTO {
  id?: string;
  type: string;
  role: string;
  name: string;
  email: string;
  phone?: string;
  organizationId?: string;
  employeeId?: string;
  isPrimary?: boolean;
  isInternal?: boolean;
}

export interface CreateStakeholderInputDTO extends StakeholderInputDTO {
  projectId: string;
}

export interface StakeholderFormDataDTO {
  id?: string;
  projectId: string;
  stakeholderType: 'employee' | 'external';
  entityId: string;
  role: string;
  isPrimary: boolean;
  isInternal: boolean;
  name: string;
  email?: string;
  phone?: string;
  organizationId?: string;
  employeeId?: string;
  isActive: boolean;
}
