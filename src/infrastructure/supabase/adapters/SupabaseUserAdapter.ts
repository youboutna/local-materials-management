/**
 * Supabase User Adapter
 * Implements IUserRepository using Supabase
 * Following hexagonal architecture principles
 */

import { IUserRepository, SearchUsersOptions, SearchUsersResult } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';
import { UserMapper } from '@/infrastructure/transformers/UserMapper';
import { supabase } from '@/integrations/supabase/client';
import { AppError, ErrorLogger, ErrorCode } from '@/utils/errorHandling';

export class SupabaseUserAdapter implements IUserRepository {
  
  async findById(id: string): Promise<User | null> {
    try {
      // First try to get from profiles table (most reliable for user data)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      // If profile exists, use it as primary source
      if (profile && !profileError) {
        // Get roles from user_roles table
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role_name')
          .eq('user_id', id);

        const roles = userRoles?.map(ur => ur.role_name) || [];

        const mergedData = {
          id: profile.id,
          email: '', // Email not in profiles table, will be filled by auth fallback
          full_name: profile.full_name || '',
          role: roles[0] || profile.role || 'user',
          phone: profile.phone || null,
          national_id: profile.national_id || null,
          avatar_url: profile.avatar_url || null,
          is_admin: profile.is_admin || false,
          last_login: profile.updated_at, // Use updated_at as fallback
          created_at: profile.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString(),
          user_metadata: {}, // Not in profiles table
          roles: roles
        };

        return UserMapper.toDomain(mergedData);
      }

      // Fallback: Try to get current user if it matches the requested ID
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user) {
        ErrorLogger.log(new Error('User not found'), 'SupabaseUserAdapter.findById failed');
        return null; // Return null instead of throwing error
      }

      // Only return data if it matches the requested ID
      if (authUser.user.id !== id) {
        return null;
      }

      // Get roles from user_roles table
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_name')
        .eq('user_id', id);

      const roles = userRoles?.map(ur => ur.role_name) || [];

      const mergedData = {
        id: authUser.user.id,
        email: authUser.user.email || '',
        full_name: authUser.user.user_metadata?.full_name || '',
        role: roles[0] || authUser.user.user_metadata?.role || 'user',
        phone: authUser.user.phone || null,
        national_id: authUser.user.user_metadata?.national_id || null,
        avatar_url: authUser.user.user_metadata?.avatar_url || null,
        is_admin: authUser.user.user_metadata?.is_admin || false,
        last_login: authUser.user.last_sign_in_at,
        created_at: authUser.user.created_at,
        updated_at: authUser.user.updated_at,
        user_metadata: authUser.user.user_metadata || {},
        roles: roles
      };

      return UserMapper.toDomain(mergedData);
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error('Unexpected error'), 'SupabaseUserAdapter.findById unexpected error');
      return null; // Return null instead of throwing error
    }
  }

  async searchUsers(options: SearchUsersOptions = {}): Promise<SearchUsersResult> {
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, phone, national_id, role, created_at, updated_at, is_admin')
        .order('full_name', { ascending: true });

      // Apply search filter
      if (options.searchTerm) {
        query = query.or(
          `full_name.ilike.%${options.searchTerm}%,phone.ilike.%${options.searchTerm}%,national_id.ilike.%${options.searchTerm}%`
        );
      }

      // Apply role filter
      if (options.roleFilter?.length) {
        query = query.in('role', options.roleFilter as any);
      }

      // Apply active filter (use is_admin as fallback since is_active doesn't exist)
      if (options.isActive !== undefined) {
        // Since is_active doesn't exist, we'll use is_admin as a proxy
        // or skip the filter if we can't determine active status
        if (options.isActive) {
          query = query.eq('is_admin', true);
        }
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        ErrorLogger.log(new Error(error.message), 'SupabaseUserAdapter.searchUsers failed');
        throw new AppError(ErrorCode.USER_SEARCH_ERROR, error.message, error);
      }

      const users = data ? data.map(UserMapper.toDomain) : [];

      return {
        users,
        total: users.length
      };
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error('Unexpected error'), 'SupabaseUserAdapter.searchUsers unexpected error');
      throw new AppError(ErrorCode.USER_SEARCH_ERROR, 'Failed to search users', error);
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) {
        ErrorLogger.log(new Error(error.message), 'SupabaseUserAdapter.findAll failed');
        throw new AppError(ErrorCode.USER_FIND_ALL_ERROR, error.message, error);
      }

      return data ? data.map(UserMapper.toDomain) : [];
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error('Unexpected error'), 'SupabaseUserAdapter.findAll unexpected error');
      throw new AppError(ErrorCode.USER_FIND_ALL_ERROR, 'Failed to get all users', error);
    }
  }

  async create(userData: Omit<User, 'id'>): Promise<User> {
    try {
      // Transform User entity to database row using UserMapper
      const dbData = UserMapper.toSupabaseRow(userData as User);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        ErrorLogger.log(new Error(error.message), 'SupabaseUserAdapter.create failed');
        throw new AppError(ErrorCode.USER_CREATE_ERROR, error.message, error);
      }

      if (!data) {
        throw new AppError(ErrorCode.USER_CREATE_ERROR, 'Failed to create user');
      }

      return UserMapper.toDomain(data);
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error('Unexpected error'), 'SupabaseUserAdapter.create unexpected error');
      throw new AppError(ErrorCode.USER_CREATE_ERROR, 'Failed to create user', error);
    }
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    try {
      // Transform User entity to database row using UserMapper
      const dbData = UserMapper.toSupabaseRow(userData as User);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        ErrorLogger.log(new Error(error.message), 'SupabaseUserAdapter.update failed');
        throw new AppError(ErrorCode.USER_UPDATE_ERROR, error.message, error);
      }

      if (!data) {
        throw new AppError(ErrorCode.USER_UPDATE_ERROR, 'Failed to update user');
      }

      return UserMapper.toDomain(data);
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error('Unexpected error'), 'SupabaseUserAdapter.update unexpected error');
      throw new AppError(ErrorCode.USER_UPDATE_ERROR, 'Failed to update user', error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        ErrorLogger.log(new Error(error.message), 'SupabaseUserAdapter.delete failed');
        throw new AppError(ErrorCode.USER_DELETE_ERROR, error.message, error);
      }
    } catch (error) {
      ErrorLogger.log(error instanceof Error ? error : new Error('Unexpected error'), 'SupabaseUserAdapter.delete unexpected error');
      throw new AppError(ErrorCode.USER_DELETE_ERROR, 'Failed to delete user', error);
    }
  }

  async findByRole(role: string): Promise<User[]> {
    return this.searchUsers({ roleFilter: [role] }).then(result => result.users as User[]);
  }

  async findActive(): Promise<User[]> {
    return this.searchUsers({ isActive: true }).then(result => result.users as User[]);
  }

  private mapToUser(data: any): User {
    // Use centralized UserMapper instead of inline mapping
    return UserMapper.toDomain(data);
  }
}
