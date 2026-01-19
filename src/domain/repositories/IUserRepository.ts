/**
 * User Repository Interface
 * Defines the contract for user data access
 */

import { UserProfile } from '@/domain/entities/User';

export interface SearchUsersOptions {
  searchTerm?: string;
  roleFilter?: string[];
  isActive?: boolean;
  limit?: number;
}

export interface SearchUsersResult {
  users: UserProfile[];
  total: number;
}

export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: string): Promise<UserProfile | null>;

  /**
   * Search users with filters
   */
  searchUsers(options: SearchUsersOptions): Promise<SearchUsersResult>;

  /**
   * Get all users
   */
  findAll(): Promise<UserProfile[]>;

  /**
   * Create new user
   */
  create(userData: Omit<UserProfile, 'id'>): Promise<UserProfile>;

  /**
   * Update user
   */
  update(id: string, userData: Partial<UserProfile>): Promise<UserProfile>;

  /**
   * Delete user
   */
  delete(id: string): Promise<void>;

  /**
   * Get users by role
   */
  findByRole(role: string): Promise<UserProfile[]>;

  /**
   * Get active users
   */
  findActive(): Promise<UserProfile[]>;
}
