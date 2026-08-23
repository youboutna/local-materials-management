/**
 * Auth Repository Interface
 * Defines the contract for authentication data access
 * Following hexagonal architecture principles
 */

import { UserProfile } from '@/domain/entities/UserProfile';

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

export interface OAuthSignInParams {
  provider: string;
  token: string;
  nonce?: string;
}

export interface IAuthRepository {
  // Session
  getCurrentSession(): Promise<{ session: AuthSession | null; error: Error | null }>;
  signIn(credentials: LoginCredentials): Promise<{ session: AuthSession | null; error: Error | null }>;
  signInWithIdToken(params: OAuthSignInParams): Promise<{ session: AuthSession | null; error: Error | null }>;
  signUp(data: RegisterData): Promise<{ user: AuthUser | null; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  resetPassword(email: string): Promise<{ error: Error | null }>;
  updatePassword(newPassword: string): Promise<{ error: Error | null }>;
  getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }>;
  updateUserRole(userId: string, role: string): Promise<{ user: AuthUser | null; error: Error | null }>;

  // Email confirmation
  resendConfirmationEmail(email: string): Promise<{ error: Error | null }>;
  confirmUserEmail(userId: string): Promise<{ error: Error | null }>;

  // Profile
  getProfile(userId: string): Promise<{ profile: UserProfile | null; error: Error | null }>;
  upsertProfile(profile: UserProfile): Promise<{ error: Error | null }>;

  // Session cleanup
  clearSessions(userId: string): Promise<{ error: Error | null }>;

  // Session restore (e.g. password recovery links)
  setSession(params: { access_token: string; refresh_token: string; user?: AuthUser | null; expires_at?: string | number }): Promise<{ session: AuthSession | null; error: Error | null }>;

  // Email change without active session
  updateEmail(oldEmail: string, newEmail: string): Promise<{ error: Error | null }>;

  /**
   * Souscription aux changements de session (port réactif).
   * Retourne une fonction de désinscription. Les providers qui ne diffusent pas
   * d'évènements renvoient un noop (voir BaseAuthAdapter).
   */
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;

}