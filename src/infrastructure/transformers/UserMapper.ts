import { User, UserRoleEntity } from '@/domain/entities/User';

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

/**
 * User Mapper - Infrastructure Layer
 * Maps between Supabase data and Domain entities
 * Following hexagonal architecture principles
 */
export class UserMapper {
  /**
   * Transforme les données brutes Supabase vers l'entité du domaine
   */
  static toDomain(supabaseUser: SupabaseUserData): User {
    // Validate and map the role to ensure it's a valid SomelecRole
    const validRoles = ['admin', 'manager', 'director', 'agent', 'supplier'];
    const rawRole = supabaseUser.role || 'user';

    // Normalize the role string to handle case variations
    const normalizedRole = rawRole.toLowerCase().trim();

    // Map normalized roles to SomelecRole values
    let mappedRole: any = 'user';
    if (normalizedRole === 'admin') mappedRole = 'admin';
    else if (normalizedRole === 'manager') mappedRole = 'manager';
    else if (normalizedRole === 'director') mappedRole = 'director';
    else if (normalizedRole === 'agent') mappedRole = 'agent';
    else if (normalizedRole === 'supplier') mappedRole = 'supplier';

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

  /**
   * Transforme un tableau de données Supabase vers les entités du domaine
   */
  static toDomainArray(supabaseUsers: SupabaseUserData[]): User[] {
    return supabaseUsers.map(user => UserMapper.toDomain(user));
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
}
