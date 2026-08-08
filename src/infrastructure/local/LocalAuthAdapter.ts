/**
 * LocalAuthAdapter — DEV / Mode B IAuthRepository implementation.
 *
 * Validates credentials against DEV_USERS (defaults + localStorage overrides)
 * and mints an HS256 JWT signed with VITE_JWT_SECRET so a self-hosted
 * PostgREST/GoTrue backend accepts the token for RLS in "Mode B" (local
 * auth + self-hosted data). Falls back to an opaque dev token if the secret
 * is missing (fully offline mode).
 */

import {
  IAuthRepository,
  AuthUser,
  AuthSession,
  LoginCredentials,
  RegisterData,
} from '@/domain/repositories/IAuthRepository';
import {
  getDevUsersSnapshot,
  DevUserProfile,
  setActiveDevRole,
} from '@/config/constants';

const SESSION_KEY = 'dev_session';
const SESSION_VERSION = 3;

interface PersistedDevSession {
  v?: number;
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
  const users = getDevUsersSnapshot();
  for (const [key, profile] of Object.entries(users)) {
    if (profile.email.toLowerCase() === target) return { key, profile };
  }
  return null;
}

function readPersistedSession(): PersistedDevSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedDevSession;
    if (parsed?.v !== SESSION_VERSION) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
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

// ---------- HS256 JWT signing (browser, WebCrypto) ----------

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function base64UrlEncodeString(s: string): string {
  return base64UrlEncode(new TextEncoder().encode(s));
}

async function signHs256(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encoded = `${base64UrlEncodeString(JSON.stringify(header))}.${base64UrlEncodeString(JSON.stringify(payload))}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(encoded));
  return `${encoded}.${base64UrlEncode(new Uint8Array(sig))}`;
}

async function mintAccessToken(profile: DevUserProfile, ttlSeconds: number): Promise<string> {
  const secret = (import.meta as any)?.env?.VITE_JWT_SECRET as string | undefined;
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'authenticated',
    role: 'authenticated',
    sub: profile.id,
    email: profile.email,
    app_metadata: { provider: 'local', roles: [profile.user_metadata.role] },
    user_metadata: {
      ...profile.user_metadata,
      permissions: profile.permissions ?? [],
      teams: profile.teams ?? [],
    },
    iat: now,
    exp: now + ttlSeconds,
  };
  if (!secret) {
    // Offline mode: opaque token, RLS backends will reject it (expected).
    return `dev-token-${profile.id}-${now}`;
  }
  try {
    return await signHs256(payload, secret);
  } catch (err) {
    console.warn('[LocalAuthAdapter] HS256 sign failed, using opaque token', err);
    return `dev-token-${profile.id}-${now}`;
  }
}

async function buildSession(
  profile: DevUserProfile,
  persisted?: PersistedDevSession,
): Promise<AuthSession> {
  const ttl = Number((import.meta as any)?.env?.VITE_JWT_EXPIRY ?? 3600);
  const expiresAt =
    persisted?.expires_at ?? new Date(Date.now() + ttl * 1000).toISOString();
  const accessToken = persisted?.access_token ?? (await mintAccessToken(profile, ttl));
  return {
    access_token: accessToken,
    refresh_token: persisted?.refresh_token ?? `dev-refresh-${profile.id}`,
    expires_at: expiresAt,
    user: profileToAuthUser(profile),
  };
}

export class LocalAuthAdapter implements IAuthRepository {
  async getCurrentSession(): Promise<{ session: AuthSession | null; error: Error | null }> {
    const persisted = readPersistedSession();
    if (!persisted) return { session: null, error: null };

    const users = getDevUsersSnapshot();
    const profile = Object.values(users).find((p) => p.id === persisted.userId);
    if (!profile) {
      clearPersistedSession();
      return { session: null, error: null };
    }
    return { session: await buildSession(profile, persisted), error: null };
  }

  async signIn(credentials: LoginCredentials): Promise<{ session: AuthSession | null; error: Error | null }> {
    const match = findProfileByEmail(credentials.email);
    if (!match || match.profile.password !== credentials.password) {
      return { session: null, error: new Error('Invalid login credentials') };
    }

    setActiveDevRole(match.profile.user_metadata.role);

    const ttl = Number((import.meta as any)?.env?.VITE_JWT_EXPIRY ?? 3600);
    const accessToken = await mintAccessToken(match.profile, ttl);
    const persisted: PersistedDevSession = {
      v: SESSION_VERSION,
      userId: match.profile.id,
      roleKey: match.key,
      access_token: accessToken,
      refresh_token: `dev-refresh-${match.profile.id}`,
      expires_at: new Date(Date.now() + ttl * 1000).toISOString(),
    };
    writePersistedSession(persisted);

    return { session: await buildSession(match.profile, persisted), error: null };
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
