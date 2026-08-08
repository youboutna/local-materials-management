/**
 * Auth Repository Interface
 * Defines the contract for authentication data access
 * Following hexagonal architecture principles
 */

export interface AuthUser {
  id: string;
  email?: string;
  fullName?: string;
  role?: string;
  phone?: string;
  nationalId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  nationalId?: string;
  role?: string;
}

export interface IAuthRepository {
  /**
   * Get current session
   */
  getCurrentSession(): Promise<{ session: AuthSession | null; error: Error | null }>;

  /**
   * Sign in with credentials
   */
  signIn(credentials: LoginCredentials): Promise<{ session: AuthSession | null; error: Error | null }>;

  /**
   * Sign up new user
   */
  signUp(data: RegisterData): Promise<{ user: AuthUser | null; error: Error | null }>;

  /**
   * Sign out current user
   */
  signOut(): Promise<{ error: Error | null }>;

  /**
   * Reset password
   */
  resetPassword(email: string): Promise<{ error: Error | null }>;

  /**
   * Update password
   */
  updatePassword(newPassword: string): Promise<{ error: Error | null }>;

  /**
   * Get current user
   */
  getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }>;

  /**
   * Update user role
   */
  updateUserRole(userId: string, role: string): Promise<{ user: AuthUser | null; error: Error | null }>;
}
