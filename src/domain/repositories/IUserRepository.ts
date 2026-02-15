/**
 * User Repository Interface
 * Defines the contract for user data access
 */

import { User } from '@/domain/entities/User';

export interface SearchUsersOptions {
  searchTerm?: string;
  roleFilter?: string[];
  isActive?: boolean;
  limit?: number;
}

export interface SearchUsersResult {
  users: User[];
  total: number;
}

export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Search users with filters
   */
  searchUsers(options: SearchUsersOptions): Promise<SearchUsersResult>;

  /**
   * Get all users
   */
  findAll(): Promise<User[]>;

  /**
   * Create new user
   */
  create(userData: Omit<User, 'id'>): Promise<User>;

  /**
   * Update user
   */
  update(id: string, userData: Partial<User>): Promise<User>;

  /**
   * Delete user
   */
  delete(id: string): Promise<void>;

  /**
   * Get users by role
   */
  findByRole(role: string): Promise<User[]>;

  /**
   * Get active users
   */
  findActive(): Promise<User[]>;
}
