/**
 * User Service
 * Implements business logic for user and profile management
 */

import { IUserRepository, SearchUsersResult } from '@/domain/repositories/IUserRepository';
import { UserProfile } from '@/domain/entities/User';
import { AppError, ErrorCode, ErrorLogger } from '@/utils/errorHandling';

export interface SearchUsersOptions {
  searchTerm?: string;
  roleFilter?: string[];
  limit?: number;
}

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async searchUsers(options: SearchUsersOptions = {}): Promise<SearchUsersResult> {
    try {
      const result = await this.userRepository.searchUsers({
        searchTerm: options.searchTerm,
        roleFilter: options.roleFilter,
        limit: options.limit
      });

      console.log('Users searched successfully:', {
        searchTerm: options.searchTerm,
        roleFilter: options.roleFilter,
        resultCount: result.users.length
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search users';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  async getUserById(id: string): Promise<UserProfile | null> {
    try {
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        console.warn('User not found:', id);
        return null;
      }

      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  async getActiveUsers(): Promise<UserProfile[]> {
    try {
      return await this.userRepository.findActive();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get active users';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  async getUsersByRole(role: string): Promise<UserProfile[]> {
    try {
      return await this.userRepository.findByRole(role);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get users by role';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  async createUser(userData: Omit<UserProfile, 'id'>): Promise<UserProfile> {
    try {
      const newUser = await this.userRepository.create({
        full_name: userData.full_name || '',
        email: userData.email || '',
        phone: userData.phone || null,
        national_id: userData.national_id || null,
        role: userData.role || 'user',
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      console.log('User created successfully:', newUser.id);
      return newUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  async updateUser(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
      }

      const updatedUser = await this.userRepository.update(id, {
        ...updates,
        updated_at: new Date().toISOString()
      });
      
      console.log('User updated successfully:', id);
      return updatedUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await this.userRepository.delete(id);
      console.log('User deleted successfully:', id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  async updateProfile(userId: string, data: {
    full_name?: string;
    phone?: string;
    national_id?: string;
  }): Promise<void> {
    try {
      await this.updateUser(userId, {
        full_name: data.full_name,
        phone: data.phone,
        national_id: data.national_id
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }
}
