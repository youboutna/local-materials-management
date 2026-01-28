/**
 * User Mapper / Transformer
 * Maps between Supabase data, Domain entities, and DTOs
 * Following hexagonal architecture principles
 */

import { User } from '@/domain/entities/User';

// DTOs d'API (Adapter Layer)
export class UserResponseDto {
  constructor(
    public id: string,
    public email: string,
    public fullName: string,
    public role: string,
    public phone?: string,
    public nationalId?: string,
    public avatar?: string,
    public isActive: boolean,
    public lastLogin?: string,
    public createdAt: string,
    public updatedAt: string
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

// Transformer/Mapper (Adapter Layer)
export class UserMapper {
  /**
   * Transforme les données brutes Supabase vers l'entité du domaine
   */
  static toDomain(supabaseUser: any): User {
    return new User(
      supabaseUser.id,
      supabaseUser.email || '',
      supabaseUser.full_name || supabaseUser.user_metadata?.full_name || '',
      supabaseUser.role || 'user', // Rôle principal depuis user_roles[0]
      supabaseUser.phone || null,
      supabaseUser.national_id || supabaseUser.user_metadata?.national_id || null,
      supabaseUser.avatar_url || supabaseUser.user_metadata?.avatar_url || null,
      supabaseUser.is_admin || false,
      supabaseUser.last_login ? new Date(supabaseUser.last_login) : undefined,
      new Date(supabaseUser.created_at),
      new Date(supabaseUser.updated_at),
      supabaseUser.roles || [] // Liste complète des rôles depuis user_roles
    );
  }

  /**
   * Transforme l'entité du domaine vers le DTO de réponse API
   */
  static toResponseDto(user: User): UserResponseDto {
    return new UserResponseDto(
      user.id,
      user.email,
      user.fullName,
      user.primaryRole,
      user.phone,
      user.nationalId,
      user.avatar,
      user.isActive,
      user.lastLogin?.toISOString(),
      user.createdAt.toISOString(),
      user.updatedAt.toISOString()
    );
  }

  /**
   * Transforme le DTO de requête vers l'entité du domaine
   */
  static toDomainFromCreateDto(requestDto: CreateUserRequestDto): User {
    return new User(
      crypto.randomUUID(), // ID généré
      requestDto.email,
      requestDto.fullName,
      requestDto.role,
      requestDto.phone, // Keep as undefined instead of null
      requestDto.nationalId, // Keep as undefined instead of null
      requestDto.avatar, // Keep as undefined instead of null
      true, // isActive initial
      undefined, // lastLogin initial
      new Date(),
      new Date(),
      [] // userRoles initial - empty array
    );
  }

  /**
   * Transforme le DTO de mise à jour vers les données partielles de l'entité
   */
  static toUpdateData(requestDto: UpdateUserRequestDto): Partial<User> {
    return {
      email: requestDto.email,
      fullName: requestDto.fullName,
      role: requestDto.role,
      phone: requestDto.phone,
      nationalId: requestDto.nationalId,
      avatar: requestDto.avatar,
      isActive: requestDto.isActive,
      updatedAt: new Date()
    } as Partial<User>;
  }

  /**
   * Transforme l'entité du domaine vers les données de la base de données Supabase
   */
  static toSupabaseRow(user: User): any {
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.primaryRole,
      phone: user.phone || null,
      national_id: user.nationalId || null,
      avatar: user.avatar || null,
      is_active: user.isActive,
      last_login: user.lastLogin?.toISOString() || null,
      created_at: user.createdAt.toISOString(),
      updated_at: user.updatedAt.toISOString()
    };
  }

  /**
   * Transforme un tableau de données Supabase vers les entités du domaine
   */
  static toDomainArray(supabaseUsers: any[]): User[] {
    return supabaseUsers.map(user => UserMapper.toDomain(user));
  }

  /**
   * Transforme un tableau d'entités du domaine vers les DTOs de réponse
   */
  static toResponseDtoArray(users: User[]): UserResponseDto[] {
    return users.map(user => UserMapper.toResponseDto(user));
  }
}
