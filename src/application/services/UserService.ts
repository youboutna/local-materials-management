/**
 * User Service
 * Implements business logic for user and profile management
 */

import { IUserRepository } from '@/domain/repositories/IUserRepository';
import { UserProfile, UserRole } from '@/domain/entities/User';
import { AppError, ErrorLogger } from '@/utils/errorHandling';

export interface SearchUsersOptions {
  searchTerm?: string;
  roleFilter?: string[];
  limit?: number;
}

export interface SearchUsersResult {
  users: UserProfile[];
  total: number;
}

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  /**
   * Search users with filters
   */
  async searchUsers(options: SearchUsersOptions = {}): Promise<SearchUsersResult> {
    try {
      const result = await this.userRepository.searchUsers(options);
      
      ErrorLogger.log('info', 'Users searched successfully', {
        searchTerm: options.searchTerm,
        roleFilter: options.roleFilter,
        resultCount: result.users.length
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search users';
      ErrorLogger.log('error', 'UserService.searchUsers failed', { 
        options, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'USER_SEARCH_ERROR');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserProfile | null> {
    try {
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        ErrorLogger.log('warning', 'User not found', { userId: id });
        return null;
      }

      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user';
      ErrorLogger.log('error', 'UserService.getUserById failed', { 
        userId: id, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'USER_GET_ERROR');
    }
  }

  /**
   * Get all active users
   */
  async getActiveUsers(): Promise<UserProfile[]> {
    try {
      const result = await this.userRepository.searchUsers({ 
        isActive: true,
        limit: 100 
      });
      
      return result.users;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get active users';
      ErrorLogger.log('error', 'UserService.getActiveUsers failed', { 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'ACTIVE_USERS_ERROR');
    }
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: string): Promise<UserProfile[]> {
    try {
      const result = await this.userRepository.searchUsers({ 
        roleFilter: [role],
        limit: 50 
      });
      
      return result.users;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get users by role';
      ErrorLogger.log('error', 'UserService.getUsersByRole failed', { 
        role, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'USERS_BY_ROLE_ERROR');
    }
  }

  /**
   * Create new user
   */
  async createUser(userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    try {
      const newUser = new UserProfile(
        crypto.randomUUID(),
        userData.full_name || '',
        userData.email || '',
        userData.phone || null,
        userData.national_id || null,
        userData.avatar_url || null,
        userData.role || 'user',
        userData.is_active !== undefined ? userData.is_active : true,
        new Date().toISOString(),
        new Date().toISOString()
      );

      await this.userRepository.save(newUser);
      ErrorLogger.log('info', 'User created successfully', { 
        userId: newUser.id 
      });

      return newUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      ErrorLogger.log('error', 'UserService.createUser failed', { 
        userData, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'USER_CREATE_ERROR');
    }
  }

  /**
   * Update existing user
   */
  async updateUser(id: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new AppError('User not found', 'USER_NOT_FOUND_ERROR');
      }

      const updatedUser = { ...existingUser, ...updates } as UserProfile;
      const result = await this.userRepository.save(updatedUser);
      
      ErrorLogger.log('info', 'User updated successfully', { 
        userId: id,
        updates: Object.keys(updates)
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      ErrorLogger.log('error', 'UserService.updateUser failed', { 
        id, 
        updates, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'USER_UPDATE_ERROR');
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await this.userRepository.delete(id);
      ErrorLogger.log('info', 'User deleted successfully', { 
        userId: id 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      ErrorLogger.log('error', 'UserService.deleteUser failed', { 
        userId: id, 
        error: errorMessage 
      });
      
      throw new AppError(errorMessage, 'USER_DELETE_ERROR');
    }
  }
}
