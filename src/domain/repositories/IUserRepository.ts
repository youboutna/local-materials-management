/**
 * User Repository Interface
 * Defines the contract for user data access (CRUD, search)
 * Following hexagonal architecture principles
 */

import { User } from '@/domain/entities/User';

export interface SearchUsersOptions {
  searchTerm?: string;
  roleFilter?: string[];
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchUsersResult {
  users: User[];
  total: number;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  searchUsers(options: SearchUsersOptions): Promise<SearchUsersResult>;
  findAll(): Promise<User[]>;
  create(userData: Omit<User, 'id'>): Promise<User>;
  update(id: string, userData: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  findByRole(role: string): Promise<User[]>;
  findActive(): Promise<User[]>;
}