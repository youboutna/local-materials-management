import { User } from '@/domain/entities/User';
import { UserDTO } from '../entities/UserDTO';

export class UserTransformer {
  static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      primaryRole: user.primaryRole,
      phone: user.phone,
      nationalId: user.nationalId,
      avatarUrl: user.avatar,
      isActive: user.isActive,
      userRoles: user.userRoles.map(role => role.roleName),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  static fromDTO(dto: UserDTO): User {
    return new User(
      dto.id,
      dto.email,
      dto.fullName,
      dto.primaryRole,
      dto.phone,
      dto.nationalId,
      dto.avatarUrl,
      dto.isActive,
      dto.lastLogin ? new Date(dto.lastLogin) : undefined,
      new Date(dto.createdAt),
      new Date(dto.updatedAt),
      dto.userRoles.map(role => new UserRole(role, true))
    );
  }
}
