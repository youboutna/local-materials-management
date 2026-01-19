/**
 * User Entity
 * Represents a user profile in the domain
 * Following hexagonal architecture principles
 */

export class User {
  constructor(
    public id: string,
    public email: string,
    public fullName: string,
    public role: string = 'user',
    public phone?: string | null,
    public nationalId?: string | null,
    public avatar?: string | null,
    public isActive: boolean = true,
    public lastLogin?: Date | null,
    public createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}
}

export type UserRole = 'admin' | 'manager' | 'employee' | 'supplier' | 'inspector' | 'engineer' | 'user';

export interface AuthSession {
  user: User;
  token: string;
  refreshToken: string;
  expiresAt: Date;
}

// Legacy interface for backward compatibility
export interface UserProfile {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  national_id?: string | null;
  role?: string | null;
  email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_active?: boolean;
}
