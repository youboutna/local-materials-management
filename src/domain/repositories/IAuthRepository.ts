/**
 * Auth Repository Interface
 * Defines the contract for authentication data access
 * Following hexagonal architecture principles
 */

import { UserProfile } from '@/domain/entities/UserProfile';

/**
 * Type utilisateur unique de l'application (défini dans les DTOs).
 * Réexporté ici pour que le port domaine et la couche présentation
 * partagent exactement la même forme (aucun doublon divergent).
 */
export type { AuthUser } from '@/dtos/entities/AuthDTO';
import type { AuthUser } from '@/dtos/entities/AuthDTO';


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