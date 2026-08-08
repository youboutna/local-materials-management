/**
 * Project Stakeholder Data Transfer Objects
 * Centralized and standardized for hexagonal architecture
 */

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
  organizationId?: strirnalStakeholderDTO {
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
  empyee' | 'external';
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