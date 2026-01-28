/**
 * Auth Repository Interface
 * Defines the contract for authentication data access
 * Following hexagonal architecture principles
 */

export interface AuthUser {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  phone?: string;
  national_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user: AuthUser;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  national_id?: string;
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
