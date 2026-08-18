/**
 * User Transformer
 * Converts between domain entities (User, UserRoleEntity) and DTOs (UserDTO, UserRoleDTO)
 * Centralizes all mappings – no duplication
 */

import { User, UserRoleEntity, UserRoleStatus } from '@/domain/entities/User';
import { AuthUser } from '@/domain/repositories/IAuthRepository';
import { CreateUserRoleDTO, UpdateUserRoleDTO, UserDTO, UserRoleDTO } from '@/dtos/entities/UserDTO';

export class UserTransformer {
  // ============================
  // User ↔ UserDTO
  // ============================
  static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      primaryRole: user.primaryRole,
      phone: user.phone,
      nationalId: user.nationalId,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      lastLogin: user.lastLogin?.toISOString(),
      userRoles: user.userRoles.map(r => UserTransformer.toUserRoleDTO(r)),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  static fromDTO(dto: UserDTO): User {
    const user = new User(
      dto.id,
      dto.email,
      dto.fullName,
      dto.phone,
      dto.nationalId,
      dto.avatarUrl,
      dto.isActive,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
      dto.lastLogin ? new Date(dto.lastLogin) : undefined,
      dto.userRoles.map(r => UserTransformer.fromUserRoleDTO(r)),
      undefined // profile séparé
    );
    return user;
  }

  // ============================
  // UserRole ↔ UserRoleDTO
  // ============================
  static toUserRoleDTO(role: UserRoleEntity): UserRoleDTO {
    return {
      id: role.id,
      userId: role.userId,
      roleName: role.roleName,
      status: role.status,
      assignedAt: role.assignedAt.toISOString(),
      assignedBy: role.assignedBy,
      revokedAt: role.revokedAt?.toISOString(),
      expiresAt: role.expiresAt?.toISOString(),
      createdAt: role.assignedAt.toISOString(),
      updatedAt: role.revokedAt?.toISOString() || role.expiresAt?.toISOString() || role.assignedAt.toISOString()
    };
  }

  static fromUserRoleDTO(dto: UserRoleDTO | CreateUserRoleDTO | UpdateUserRoleDTO): UserRoleEntity {
    const id = 'id' in dto ? (dto.id as string) : '';
    const revokedAt = 'revokedAt' in dto && dto.revokedAt ? new Date(dto.revokedAt) : undefined;
    const expiresAt = 'expiresAt' in dto && dto.expiresAt ? new Date(dto.expiresAt) : undefined;
    const status = (dto.status as UserRoleStatus) || UserRoleStatus.ACTIVE;
    return UserRoleEntity.create({
      id: id || '',
      userId: dto.userId || '',
      roleName: dto.roleName,
      status: status,
      assignedAt: new Date(),
      assignedBy: dto.assignedBy,
      revokedAt: revokedAt,
      expiresAt: expiresAt
    });
  }

  // ============================
  // AuthUser → User (pour l'adaptateur)
  // ============================
  static authUserToDomain(authUser: AuthUser): User {
    return new User(
      authUser.id,
      authUser.email || '',
      authUser.full_name || '',
      authUser.phone,
      authUser.national_id,
      undefined,
      true,
      authUser.created_at ? new Date(authUser.created_at) : new Date(),
      authUser.updated_at ? new Date(authUser.updated_at) : new Date(),
      undefined,
      [],
      undefined
    );
  }

  // ============================
  // Database row → User (pour l'adaptateur)
  // ============================
  static toDomain(row: any): User {
    // row contient id, email, full_name, role, phone, national_id, avatar_url, is_admin, user_roles, etc.
    const userRoles = (row.user_roles || []).map((r: any) =>
      UserRoleEntity.create({
        id: r.id,
        userId: r.userId || row.id,
        roleName: r.roleName || r.role_name || 'user',
        status: r.status || 'active',
        assignedAt: r.assignedAt || r.assigned_at ? new Date(r.assignedAt || r.assigned_at) : new Date(),
        assignedBy: r.assignedBy || r.assigned_by,
        revokedAt: r.revokedAt || r.revoked_at ? new Date(r.revokedAt || r.revoked_at) : undefined,
        expiresAt: r.expiresAt || r.expires_at ? new Date(r.expiresAt || r.expires_at) : undefined
      })
    );

    return new User(
      row.id,
      row.email || '',
      row.full_name || '',
      row.phone,
      row.national_id,
      row.avatar_url,
      row.is_active !== undefined ? row.is_active : true,
      row.created_at ? new Date(row.created_at) : new Date(),
      row.updated_at ? new Date(row.updated_at) : new Date(),
      row.last_login ? new Date(row.last_login) : undefined,
      userRoles
    );
  }

  static toSupabaseRow(user: Partial<User> | Omit<User, 'id'>): any {
    const row: any = {};
    const u = user as Partial<User>;
    if (u.id !== undefined) row.id = u.id;
    if (user.email !== undefined) row.email = user.email;
    if (user.fullName !== undefined) row.full_name = user.fullName;
    if (user.phone !== undefined) row.phone = user.phone;
    if (user.nationalId !== undefined) row.national_id = user.nationalId;
    if (user.avatarUrl !== undefined) row.avatar_url = user.avatarUrl;
    if (user.isActive !== undefined) row.is_active = user.isActive;
    if (user.updatedAt !== undefined) row.updated_at = user.updatedAt.toISOString();
    if (user.createdAt !== undefined) row.created_at = user.createdAt.toISOString();
    return row;
  }
}