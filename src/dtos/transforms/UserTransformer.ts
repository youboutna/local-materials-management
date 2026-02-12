import { User, UserRoleEntity, UserRole, SomelecRole, UserRoleStatus } from '@/domain/entities/User';
import { UserDTO, UserRoleDTO, CreateUserRoleDTO, UpdateUserRoleDTO } from '../entities/UserDTO';

export class UserTransformer {
  static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      primaryRole: user.role,
      phone: user.phone,
      nationalId: '', // Not available in User entity
      avatarUrl: user.avatar,
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString(),
      userRoles: user.userRoles.map(role => UserTransformer.toUserRoleDTO(role)),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  static fromDTO(dto: UserDTO): User {
    return new User(
      dto.id,
      dto.fullName,
      dto.email,
      '',
      dto.primaryRole as UserRole,
      dto.avatarUrl || '',
      [],
      dto.isActive,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
      dto.userRoles.map(role => UserTransformer.fromUserRoleDTO(role)),
      dto.fullName,
      dto.avatarUrl || '',
      dto.lastLogin ? new Date(dto.lastLogin) : undefined
    );
  }

  // UserRoleEntity transformer methods
  static toUserRoleDTO(userRole: UserRoleEntity): UserRoleDTO {
    return {
      id: userRole.id,
      userId: userRole.userId,
      roleName: userRole.roleName,
      status: userRole.status,
      assignedAt: userRole.assignedAt.toISOString(),
      assignedBy: userRole.assignedBy,
      revokedAt: userRole.revokedAt?.toISOString(),
      expiresAt: userRole.expiresAt?.toISOString(),
      createdAt: userRole.assignedAt.toISOString(),
      updatedAt: userRole.revokedAt?.toISOString() || userRole.expiresAt?.toISOString() || userRole.assignedAt.toISOString()
    };
  }

  static fromUserRoleDTO(dto: CreateUserRoleDTO | UpdateUserRoleDTO): UserRoleEntity {
    const id = 'id' in dto ? (dto.id as string) : '';
    const revokedAt = 'revokedAt' in dto ? (dto.revokedAt as string) : undefined;
    const expiresAt = 'expiresAt' in dto ? (dto.expiresAt as string) : undefined;
    return new UserRoleEntity(
      id || '',
      dto.userId || '',
      dto.roleName as SomelecRole,
      dto.status as UserRoleStatus,
      new Date(),
      dto.assignedBy,
      revokedAt ? new Date(revokedAt) : undefined,
      expiresAt ? new Date(expiresAt) : undefined
    );
  }

  static toUpdateUserRoleDTO(userRole: UserRoleEntity): UpdateUserRoleDTO {
    return {
      userId: userRole.userId,
      roleName: userRole.roleName,
      status: userRole.status,
      assignedBy: userRole.assignedBy,
      expiresAt: userRole.expiresAt?.toISOString()
    };
  }
}
