/**
 * User DTOs for data exchange between layers
 * Transforms domain entities to presentation/API format
 * Avoid duplication by referencing domain types
 */

import { UserRoleStatus } from '@/domain/entities/User';

export interface UserRoleDTO {
  id: string;
  userId: string;
  roleName: string;
  status: UserRoleStatus | 'active' | 'inactive' | 'revoked' | 'pending';
  assignedAt: string;
  assignedBy?: string;
  revokedAt?: string;
  expiresAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserRoleDTO extends Omit<UserRoleDTO, 'id' | 'assignedAt' | 'revokedAt' | 'createdAt' | 'updatedAt'> {}

export interface UpdateUserRoleDTO extends Partial<CreateUserRoleDTO> {}

export interface LoginData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
  full_name?: string;
  phone?: string;
  nationalId?: string;
  national_id?: string;
  role?: string;
}

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  primaryRole: string;
  phone?: string;
  nationalId?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  userRoles: UserRoleDTO[];
  profile?: any; // on peut ajouter un sous-DTO pour le profil
  createdAt: string;
  updatedAt: string;
  // Métadonnées de sécurité / activité (optionnelles)
  lastLoginAt?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  hasTwoFactor?: boolean;
  hasCompletedProfile?: boolean;
  lastPasswordChange?: string;
  failedLoginAttempts?: number;
  totalLogins?: number;
  avgSessionDuration?: number;
}

export interface CreateUserDTO extends Omit<UserDTO, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateUserDTO extends Partial<CreateUserDTO> {}