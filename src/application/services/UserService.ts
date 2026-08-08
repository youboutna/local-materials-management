/**
 * User Service
 * Implements business logic for user and profile management
 */

import { IUserRepository, SearchUsersResult } from '@/domain/repositories/IUserRepository';
import { User, SomelecRole } from '@/domain/entities/User';
import { AppError, ErrorCode, ErrorLogger } from '@/utils/errorHandling';

export interface SearchUsersOptions {
  searchTerm?: string;
  roleFilter?: string[];
  limit?: number;
}

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.userRepository.findAll();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get all users';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

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

  async getUserById(id: string): Promise<User | null> {
    try {
      return await this.userRepository.findById(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  async getActiveUsers(): Promise<User[]> {
    try {
      return await this.userRepository.findActive();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get active users';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      return await this.userRepository.findByRole(role);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get users by role';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    try {
      const createdUser = await this.userRepository.create(userData);

      console.log('User created successfully:', createdUser.id);
      return createdUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    try {
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new AppError(ErrorCode.NOT_FOUND, 'User not found');
      }

      const userUpdates: Partial<User> = { ...updates };
      (userUpdates as any).updatedAt = new Date();

      const updatedUser = await this.userRepository.update(id, userUpdates);

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
    fullName?: string;
    phone?: string;
    avatar?: string;
  }): Promise<void> {
    try {
      await this.updateUser(userId, {
        fullName: data.fullName,
        phone: data.phone,
        avatar: data.avatar
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      ErrorLogger.log(new AppError(ErrorCode.INTERNAL_ERROR, errorMessage));
      throw new AppError(ErrorCode.INTERNAL_ERROR, errorMessage);
    }
  }
}

let userServiceInstance: UserService | null = null;
export function getUserService(): UserService {
  if (!userServiceInstance) {
    userServiceInstance = new UserService(RepositoryFactory.getUserRepository());
  }
  return userServiceInstance;
}
