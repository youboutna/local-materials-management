/**
 * User Mapper / Transformer
 * Maps between Supabase data, Domain entities, and DTOs
 * Following hexagonal architecture principles
 */

import { User, SomelecRole, UserRoleEntity } from '@/domain/entities/User';

// Interface for Supabase user data
interface SupabaseUserData {
  id: string;
  email?: string;
  full_name?: string;
  phone?: string;
  role?: string;
  avatar_url?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    national_id?: string;
  };
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  roles?: unknown[];
}

// DTOs d'API (Adapter Layer)
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

// Transformer/Mapper (Adapter Layer)
export class UserMapper {
  /**
   * Transforme les données brutes Supabase vers l'entité du domaine
   */
  static toDomain(supabaseUser: SupabaseUserData): User {
    // Validate and map the role to ensure it's a valid SomelecRole
    const validRoles = Object.values(SomelecRole) as string[];
    const rawRole = supabaseUser.role || 'user';
    
    // Normalize the role string to handle case variations
    const normalizedRole = rawRole.toLowerCase().trim();
    
    console.log('UserMapper.toDomain: Raw role from Supabase:', rawRole);
    console.log('UserMapper.toDomain: Normalized role:', normalizedRole);
    console.log('UserMapper.toDomain: Valid SomelecRole values:', validRoles);
    
    // Map normalized roles to SomelecRole values
    let mappedRole: SomelecRole = 'user' as SomelecRole;
    
    if (normalizedRole === 'admin') mappedRole = SomelecRole.ADMIN;
    else if (normalizedRole === 'manager') mappedRole = SomelecRole.MANAGER;
    else if (normalizedRole === 'director') mappedRole = SomelecRole.DIRECTOR;
    else if (normalizedRole === 'agent') mappedRole = SomelecRole.AGENT;
    else if (normalizedRole === 'supplier') mappedRole = SomelecRole.SUPPLIER;
    else mappedRole = 'user' as SomelecRole; // Default fallback
    
    console.log('UserMapper.toDomain: Final mapped role:', mappedRole);

    return new User(
      supabaseUser.id,
      supabaseUser.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email || 'Unknown User', // name (required)
      supabaseUser.email || `${supabaseUser.id}@temp.local`, // email (required)
      supabaseUser.phone || '', // phone (required, but can be empty)
      mappedRole, // role (required, validated)
      supabaseUser.avatar_url || supabaseUser.user_metadata?.avatar_url || '', // image
      [], // workspaceIds (empty array)
      supabaseUser.is_active !== undefined ? supabaseUser.is_active : true, // isActive
      supabaseUser.created_at ? new Date(supabaseUser.created_at) : undefined, // createdAt
      supabaseUser.updated_at ? new Date(supabaseUser.updated_at) : undefined, // updatedAt
      (supabaseUser.roles || []) as UserRoleEntity[], // userRoles
      supabaseUser.full_name || supabaseUser.user_metadata?.full_name || supabaseUser.email, // fullName
      supabaseUser.avatar_url || supabaseUser.user_metadata?.avatar_url, // avatar
      supabaseUser.last_login ? new Date(supabaseUser.last_login) : undefined // lastLogin
    );
  }
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
   * Transforme le DTO de requête vers l'entité du domaine
   */
  static toDomainFromCreateDto(requestDto: CreateUserRequestDto): User {
    return new User(
      crypto.randomUUID(), // ID généré
      requestDto.fullName, // name (required)
      requestDto.email, // email (required)
      requestDto.phone || '', // phone (required, can be empty)
      requestDto.role as SomelecRole || 'user', // role (required, cast to SomelecRole)
      requestDto.avatar || '', // image
      [], // workspaceIds (empty array)
      true, // isActive initial
      new Date(), // createdAt
      new Date(), // updatedAt
      [], // userRoles initial - empty array
      requestDto.fullName, // fullName
      requestDto.avatar, // avatar
      undefined // lastLogin initial
    );
  }

  /**
   * Transforme le DTO de mise à jour vers les données partielles de l'entité
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
   * Transforme l'entité du domaine vers les données de la base de données Supabase
   */
  static toSupabaseRow(user: User): Record<string, unknown> {
    return {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      phone: user.phone || null,
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
  static toDomainArray(supabaseUsers: SupabaseUserData[]): User[] {
    return supabaseUsers.map(user => UserMapper.toDomain(user));
  }

  /**
   * Transforme un tableau d'entités du domaine vers les DTOs de réponse
   */
  static toResponseDtoArray(users: User[]): UserResponseDto[] {
    return users.map(user => UserMapper.toResponseDto(user));
  }
}
