import { SomelecRole, User, UserRoleEntity, UserRoleStatus } from '@/domain/entities/User';
import { CreateUserRoleDTO, UpdateUserRoleDTO, UserDTO, UserRoleDTO } from '../entities/UserDTO';

// =================== API DTOs (Adapter Layer) ===================

export class UserResponseDto {
  constructor(
    public id: string,
    public email: string,
    public fullName: string,
    public role: string,
    public isActive: boolean,
    public createdAt: string,
    public updatedAt: string,
    public phone?: string,
    public avatar?: string,
    public lastLogin?: string
  ) {}
}

export class CreateUserRequestDto {
  constructor(
    public email: string,
    public fullName: string,
    public role: string,
    public password: string,
    public phone?: string,
    public nationalId?: string,
    public avatar?: string
  ) {}
}

export class UpdateUserRequestDto {
  constructor(
    public email?: string,
    public fullName?: string,
    public role?: string,
    public phone?: string,
    public nationalId?: string,
    public avatar?: string,
    public isActive?: boolean
  ) {}
}

export class LoginRequestDto {
  constructor(
    public email: string,
    public password: string
  ) {}
}

export class LoginResponseDto {
  constructor(
    public user: UserResponseDto,
    public token: string,
    public refreshToken: string
  ) {}
}

// =================== DOMAIN ↔ DTO TRANSFORMATIONS (Application Layer) ===================

export class UserTransformer {
  // =================== DTO TRANSFORMATIONS (Application Layer) ===================

  /**
   * Transform domain entity to UserDTO
   */
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

  /**
   * Transform UserDTO to domain entity
   */
  static fromDTO(dto: UserDTO): User {
    return new User(
      dto.id,
      dto.fullName,
      dto.email,
      dto.phone || '',
      dto.primaryRole as SomelecRole,
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

  // =================== USER ROLE TRANSFORMATIONS ===================

  /**
   * Transform UserRoleEntity to UserRoleDTO
   */
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

  /**
   * Transform CreateUserRoleDTO or UpdateUserRoleDTO to UserRoleEntity
   */
  static fromUserRoleDTO(dto: CreateUserRoleDTO | UpdateUserRoleDTO): UserRoleEntity {
    const id = 'id' in dto ? (dto.id as string) : '';
    const revokedAt = 'revokedAt' in dto ? (dto.revokedAt as string) : undefined;
    const expiresAt = 'expiresAt' in dto ? (dto.expiresAt as string) : undefined;
    return UserRoleEntity.create({
      id: id || '',
      userId: dto.userId || '',
      roleName: dto.roleName as SomelecRole,
      status: dto.status as UserRoleStatus,
      assignedAt: new Date(),
      assignedBy: dto.assignedBy,
      revokedAt: revokedAt ? new Date(revokedAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });
  }

  /**
   * Transform domain entity to response DTO
   */
  static toResponseDto(user: User): UserResponseDto {
    return new UserResponseDto(
      user.id,
      user.email,
      user.fullName,
      user.role,
      user.isActive,
      user.createdAt.toISOString(),
      user.updatedAt.toISOString(),
      user.phone,
      user.avatar,
      user.lastLogin?.toISOString()
    );
  }

  /**
   * Transform array of domain entities to response DTOs
   */
  static toResponseDtoArray(users: User[]): UserResponseDto[] {
    return users.map(user => UserTransformer.toResponseDto(user));
  }

  /**
   * Transform create request DTO to domain entity
   */
  static toDomainFromCreateDto(requestDto: CreateUserRequestDto): User {
    return new User(
      crypto.randomUUID(),
      requestDto.fullName,
      requestDto.email,
      requestDto.phone || '',
      requestDto.role as SomelecRole || 'user',
      requestDto.avatar || '',
      [],
      true,
      new Date(),
      new Date(),
      [],
      requestDto.fullName,
      requestDto.avatar,
      undefined
    );
  }

  /**
   * Transform update request DTO to domain partial
   */
  static toUpdateData(requestDto: UpdateUserRequestDto): Partial<User> {
    return {
      email: requestDto.email,
      fullName: requestDto.fullName,
      role: requestDto.role as SomelecRole,
      phone: requestDto.phone,
      avatar: requestDto.avatar,
      isActive: requestDto.isActive,
      updatedAt: new Date()
    } as Partial<User>;
  }


  /**
   * Transform Supabase database row to domain entity
   */
  static toDomain(data: any): User {
    return new User(
      data.id || '',
      data.full_name || '',
      data.email || '',
      data.phone || '',
      (data.role as SomelecRole) || 'user',
      data.avatar_url || '',
      [], // Permissions or internal roles array
      data.is_admin || false, // Mapping is_admin as the isActive proxy
      data.created_at ? new Date(data.created_at) : new Date(),
      data.updated_at ? new Date(data.updated_at) : new Date(),
      [], // userRoles
      data.full_name || '',
      data.avatar_url || '',
      data.last_login ? new Date(data.last_login) : undefined
    );
  }

  /**
   * Transform domain entity (or partial) to Supabase database row
   */
  static toSupabaseRow(user: Partial<User>): any {
    const row: any = {};
    
    if (user.id !== undefined) row.id = user.id;
    // Map domain fields to Supabase snake_case columns
    if (user.fullName !== undefined) row.full_name = user.fullName;
    if (user.phone !== undefined) row.phone = user.phone;
    if (user.role !== undefined) row.role = user.role;
    if (user.avatar !== undefined) row.avatar_url = user.avatar;
    if (user.isActive !== undefined) row.is_admin = user.isActive; 
    if (user.updatedAt !== undefined) row.updated_at = user.updatedAt.toISOString();
    if (user.createdAt !== undefined) row.created_at = user.createdAt.toISOString();
    
    return row;
  }
}
