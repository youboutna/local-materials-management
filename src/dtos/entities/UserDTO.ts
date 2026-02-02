import { BaseEntityDTO, ContactInfoDTO } from '../shared';

export interface UserDTO extends BaseEntityDTO {
  email: string;
  fullName: string;
  primaryRole: string;
  phone?: string;
  nationalId?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLogin?: string;
  userRoles: string[];
}

export interface CreateUserDTO extends Omit<UserDTO, 'id' | 'createdAt' | 'updatedAt'> {}
export interface UpdateUserDTO extends Partial<CreateUserDTO> {}
