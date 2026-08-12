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
  // Champs sécurité / activité (optionnels, alimentés par le provider d'auth)
  hasTwoFactor?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  hasCompletedProfile?: boolean;
  lastPasswordChange?: string;
  failedLoginAttempts?: number;
  lastLoginAt?: string;
  totalLogins?: number;
  avgSessionDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDTO extends Omit<UserDTO, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateUserDTO extends Partial<CreateUserDTO> {}

// Ré-exports de compatibilité : les payloads d'authentification vivent dans AuthDTO
export type { LoginData, RegisterData } from './AuthDTO';
