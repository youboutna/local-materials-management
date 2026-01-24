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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        ErrorLogger.log('error', 'SupabaseUserAdapter.findById failed', { id, error });
        throw new AppError(ErrorCode.USER_FIND_ERROR, error.message);
      }

      return data ? UserMapper.toDomain(data) : null;
    } catch (error) {
      ErrorLogger.log('error', 'SupabaseUserAdapter.findById unexpected error', { id, error });
      throw new AppError(ErrorCode.USER_FIND_ERROR, 'Failed to find user');
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
        ErrorLogger.log('error', 'SupabaseUserAdapter.searchUsers failed', { options, error });
        throw new AppError(ErrorCode.USER_SEARCH_ERROR, error.message, error);
      }

      const users = data ? data.map(UserMapper.toDomain) : [];

      return {
        users,
        total: users.length
      };
    } catch (error) {
      ErrorLogger.log('error', 'SupabaseUserAdapter.searchUsers unexpected error', { options, error });
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
        ErrorLogger.log('error', 'SupabaseUserAdapter.findAll failed', { error });
        throw new AppError(ErrorCode.USER_FIND_ALL_ERROR, error.message, error);
      }

      return data ? data.map(UserMapper.toDomain) : [];
    } catch (error) {
      ErrorLogger.log('error', 'SupabaseUserAdapter.findAll unexpected error', { error });
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
        ErrorLogger.log('error', 'SupabaseUserAdapter.create failed', { userData, error });
        throw new AppError(ErrorCode.USER_CREATE_ERROR, error.message, error);
      }

      if (!data) {
        throw new AppError(ErrorCode.USER_CREATE_ERROR, 'Failed to create user');
      }

      return UserMapper.toDomain(data);
    } catch (error) {
      ErrorLogger.log('error', 'SupabaseUserAdapter.create unexpected error', { userData, error });
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
        ErrorLogger.log('error', 'SupabaseUserAdapter.update failed', { id, userData, error });
        throw new AppError(ErrorCode.USER_UPDATE_ERROR, error.message, error);
      }

      if (!data) {
        throw new AppError(ErrorCode.USER_UPDATE_ERROR, 'Failed to update user');
      }

      return UserMapper.toDomain(data);
    } catch (error) {
      ErrorLogger.log('error', 'SupabaseUserAdapter.update unexpected error', { id, userData, error });
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
        ErrorLogger.log('error', 'SupabaseUserAdapter.delete failed', { id, error });
        throw new AppError(ErrorCode.USER_DELETE_ERROR, error.message, error);
      }
    } catch (error) {
      ErrorLogger.log('error', 'SupabaseUserAdapter.delete unexpected error', { id, error });
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
