/**
 * DTO: StakeholderDTO
 * Data Transfer Object pour les parties prenantes
 * Utilisé pour les échanges entre UI et services
 */

export interface StakeholderContactDTO {
  name: string;
  email: string;
  phone?: string;
  position?: string;
}

export interface StakeholderOrganizationDTO {
  id: string;
  name: string;
  type: string;
  category?: string;
  address?: string;
  phone?: string;
  email?: string;
  nif?: string;
  registrationNumber?: string;
}

export interface StakeholderDTO {
  id: string;
  projectId: string;
  type: string;
  role: string;
  organizationId: string | null;
  employeeId: string | null;
  isPrimary: boolean;
  isInternal: boolean;
  contact: StakeholderContactDTO;
  organization: StakeholderOrganizationDTO | null;
  responsibilities: string[];
  accessLevel: 'read' | 'write' | 'admin' | 'full';
  startDate: string | null;
  endDate: string | null;
  hourlyRate: number | null;
  contractType: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStakeholderRequestDTO {
  projectId: string;
  type: string;
  role: string;
  organizationId: string | null;
  employeeId: string | null;
  isPrimary: boolean;
  contact: StakeholderContactDTO;
  organization: StakeholderOrganizationDTO | null;
  responsibilities: string[];
  accessLevel: 'read' | 'write' | 'admin' | 'full';
  startDate: string | null;
  endDate: string | null;
  hourlyRate: number | null;
  contractType: string | null;
  notes: string | null;
}

export interface UpdateStakeholderRequestDTO {
  role?: string;
  organizationId?: string | null;
  employeeId?: string | null;
  isPrimary?: boolean;
  contact?: StakeholderContactDTO;
  organization?: StakeholderOrganizationDTO | null;
  responsibilities?: string[];
  accessLevel?: 'read' | 'write' | 'admin' | 'full';
  startDate?: string | null;
  endDate?: string | null;
  hourlyRate?: number | null;
  contractType?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

export interface StakeholderResponseDTO {
  id: string;
  projectId: string;
  type: string;
  role: string;
  organizationId: string | null;
  employeeId: string | null;
  isPrimary: boolean;
  isInternal: boolean;
  contact: StakeholderContactDTO;
  organization: StakeholderOrganizationDTO | null;
  responsibilities: string[];
  accessLevel: 'read' | 'write' | 'admin' | 'full';
  startDate: string | null;
  endDate: string | null;
  hourlyRate: number | null;
  contractType: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  displayName: string;
  fullTitle: string;
  isEmployee: boolean;
  isExternal: boolean;
  isSupplier: boolean;
  isInspector: boolean;
  isManager: boolean;
  canRead: boolean;
  canWrite: boolean;
  canAdmin: boolean;
  hasFullAccess: boolean;
  isActiveInProject: boolean;
}
