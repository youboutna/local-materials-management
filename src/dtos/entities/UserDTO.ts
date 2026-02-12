import { BaseEntityDTO, ContactInfoDTO } from '../shared';

// UserRole DTO for the enhanced role system
export interface UserRoleDTO extends BaseEntityDTO {
  userId: string;
  roleName: string;
  status: string;
  assignedAt: string;
  assignedBy?: string;
  revokedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRoleDTO extends Omit<UserRoleDTO, 'id' | 'assignedAt' | 'revokedAt' | 'createdAt' | 'updatedAt'> {}

export interface UpdateUserRoleDTO extends Partial<CreateUserRoleDTO> {}

export interface UserDTO extends BaseEntityDTO {
  email: string;
  fullName: string;
  primaryRole: string;
  phone?: string;
  nationalId?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  userRoles: UserRoleDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO extends Omit<UserDTO, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateUserDTO extends Partial<CreateUserDTO> {}
