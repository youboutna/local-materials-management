/**
 * BaseAuthAdapter
 * Fournit des implémentations par défaut pour les capacités optionnelles
 * du contrat IAuthRepository (OAuth id-token, profils, sessions, email).
 * Les adaptateurs concrets surchargent uniquement ce que leur provider supporte.
 */

import { UserProfile } from '@/domain/entities/UserProfile';
import { AuthSession, AuthUser, OAuthSignInParams } from '@/domain/repositories/IAuthRepository';

const notSupported = (capability: string): Error =>
  new Error(`Auth capability not supported by this provider: ${capability}`);

export abstract class BaseAuthAdapter {
  async signInWithIdToken(_params: OAuthSignInParams): Promise<{ session: AuthSession | null; error: Error | null }> {
    return { session: null, error: notSupported('signInWithIdToken') };
  }

  async resendConfirmationEmail(_email: string): Promise<{ error: Error | null }> {
    return { error: notSupported('resendConfirmationEmail') };
  }

  async confirmUserEmail(_userId: string): Promise<{ error: Error | null }> {
    return { error: notSupported('confirmUserEmail') };
  }

  async getProfile(_userId: string): Promise<{ profile: UserProfile | null; error: Error | null }> {
    return { profile: null, error: null };
  }

  async upsertProfile(_profile: UserProfile): Promise<{ error: Error | null }> {
    return { error: null };
  }

  async clearSessions(_userId: string): Promise<{ error: Error | null }> {
    return { error: null };
  }

  async setSession(_params: {
    access_token: string;
    refresh_token: string;
    user?: AuthUser | null;
    expires_at?: string | number;
  }): Promise<{ session: AuthSession | null; error: Error | null }> {
    return { session: null, error: notSupported('setSession') };
  }

  async updateEmail(_oldEmail: string, _newEmail: string): Promise<{ error: Error | null }> {
    return { error: notSupported('updateEmail') };
  }

  async updateUserRole(_userId: string, _role: string): Promise<{ user: AuthUser | null; error: Error | null }> {
    return { user: null, error: notSupported('updateUserRole') };
  }
}
