/**
 * LocalAuthAdapter — DEV-only IAuthRepository implementation.
 *
 * Validates credentials against DEV_USERS defined in src/config/constants.ts
 * and persists a fake session in localStorage (key: dev_session). No network calls.
 *
 * Architecture: this adapter lives on the infrastructure side of the hexagon,
 * exactly like SupabaseAuthAdapter. It exposes snake_case AuthUser/AuthSession
 * shapes; the Service (UnifiedAuthService) is responsible for converting to
 * the camelCase UnifiedAuthUser DTO consumed by the UI.
 */

import {
  IAuthRepository,
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
} from '@/domain/repositories/IAuthRepository';
import {
  DEV_USERS,
  DevUserProfile,
  setActiveDevRole,
} from '@/config/constants';

const SESSION_KEY = 'dev_session';

interface PersistedDevSession {
  userId: string;
  roleKey: string;
  access_token: string;
  refresh_token: string;
  expires_at: string;
}

function profileToAuthUser(profile: DevUserProfile): AuthUser {
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.user_metadata.full_name,
    role: profile.user_metadata.role,
    phone: profile.user_metadata.phone,
    national_id: profile.user_metadata.national_id,
    created_at: new Date(0).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function findProfileByEmail(email: string): { key: string; profile: DevUserProfile } | null {
  const target = email.trim().toLowerCase();
  for (const [key, profile] of Object.entries(DEV_USERS)) {
    if (profile.email.toLowerCase() === target) return { key, profile };
  }
  return null;
}

function readPersistedSession(): PersistedDevSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedDevSession;
  } catch {
    return null;
  }
}

function writePersistedSession(session: PersistedDevSession): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearPersistedSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
}

function buildSession(profile: DevUserProfile, persisted?: PersistedDevSession): AuthSession {
  const expiresAt =
    persisted?.expires_at ?? new Date(Date.now() + 24 * 3600_000).toISOString();
  return {
    access_token: persisted?.access_token ?? `dev-token-${profile.id}`,
    refresh_token: persisted?.refresh_token ?? `dev-refresh-${profile.id}`,
    expires_at: expiresAt,
    user: profileToAuthUser(profile),
  };
}

export class LocalAuthAdapter implements IAuthRepository {
  async getCurrentSession(): Promise<{ session: AuthSession | null; error: Error | null }> {
    const persisted = readPersistedSession();
    if (!persisted) return { session: null, error: null };

    const profile = Object.values(DEV_USERS).find((p) => p.id === persisted.userId);
    if (!profile) {
      clearPersistedSession();
      return { session: null, error: null };
    }
    return { session: buildSession(profile, persisted), error: null };
  }

  async signIn(credentials: LoginCredentials): Promise<{ session: AuthSession | null; error: Error | null }> {
    const match = findProfileByEmail(credentials.email);
    if (!match || match.profile.password !== credentials.password) {
      return { session: null, error: new Error('Invalid login credentials') };
    }

    // Align the active dev role with the account that just signed in — keeps the
    // DEV_USER Proxy and any UI role selector consistent with the session.
    setActiveDevRole(match.profile.user_metadata.role);

    const persisted: PersistedDevSession = {
      userId: match.profile.id,
      roleKey: match.key,
      access_token: `dev-token-${match.profile.id}-${Date.now()}`,
      refresh_token: `dev-refresh-${match.profile.id}`,
      expires_at: new Date(Date.now() + 24 * 3600_000).toISOString(),
    };
    writePersistedSession(persisted);

    return { session: buildSession(match.profile, persisted), error: null };
  }

  async signUp(_data: RegisterData): Promise<{ user: AuthUser | null; error: Error | null }> {
    return { user: null, error: new Error('Sign-up disabled in DEV mode') };
  }

  async signOut(): Promise<{ error: Error | null }> {
    clearPersistedSession();
    return { error: null };
  }

  async resetPassword(_email: string): Promise<{ error: Error | null }> {
    return { error: null };
  }

  async updatePassword(_newPassword: string): Promise<{ error: Error | null }> {
    return { error: null };
  }

  async getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }> {
    const { session } = await this.getCurrentSession();
    return { user: session?.user ?? null, error: null };
  }

  async updateUserRole(_userId: string, _role: string): Promise<{ user: AuthUser | null; error: Error | null }> {
    return { user: null, error: new Error('Role update disabled in DEV mode') };
  }
}
