/**
 * GoTrueAuthAdapter
 * Implements IAuthRepository against a bare GoTrue server (/auth/v1).
 * Works with self-hosted Supabase Auth or standalone GoTrue.
 */
import {
  IAuthRepository,
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterData,
} from '@/domain/repositories/IAuthRepository';

const SESSION_KEY = 'gotrue_session';

function readSession(): AuthSession | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
  } catch {
    return null;
  }
}
function writeSession(s: AuthSession | null) {
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

function toUser(u: any): AuthUser {
  return {
    id: u.id,
    email: u.email,
    full_name: u.user_metadata?.full_name,
    role: u.user_metadata?.role ?? u.role,
    phone: u.phone,
    national_id: u.user_metadata?.national_id,
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
}

export class GoTrueAuthAdapter implements IAuthRepository {
  constructor(private baseUrl: string, private apiKey?: string) {}

  private async call<T>(path: string, method: string, body?: unknown, token?: string) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['apikey'] = this.apiKey;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(json?.msg ?? json?.error_description ?? res.statusText);
    return json as T;
  }

  async getCurrentSession() {
    const s = readSession();
    return { session: s, error: null };
  }

  async signIn(credentials: LoginCredentials) {
    try {
      const data = await this.call<any>('/token?grant_type=password', 'POST', {
        email: credentials.email,
        password: credentials.password,
      });
      const session: AuthSession = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: String(data.expires_at ?? ''),
        user: toUser(data.user),
      };
      writeSession(session);
      return { session, error: null };
    } catch (e) {
      return { session: null, error: e as Error };
    }
  }

  async signUp(data: RegisterData) {
    try {
      const res = await this.call<any>('/signup', 'POST', {
        email: data.email,
        password: data.password,
        data: {
          full_name: data.full_name,
          phone: data.phone,
          national_id: data.national_id,
          role: data.role,
        },
      });
      return { user: toUser(res.user ?? res), error: null };
    } catch (e) {
      return { user: null, error: e as Error };
    }
  }

  async signOut() {
    try {
      const s = readSession();
      if (s?.access_token) {
        await this.call('/logout', 'POST', {}, s.access_token).catch(() => null);
      }
      writeSession(null);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  }

  async resetPassword(email: string) {
    try {
      await this.call('/recover', 'POST', { email });
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  }

  async updatePassword(newPassword: string) {
    try {
      const s = readSession();
      if (!s) throw new Error('No session');
      const u = await this.call<any>('/user', 'PUT', { password: newPassword }, s.access_token);
      s.user = toUser(u);
      writeSession(s);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  }

  async getCurrentUser() {
    try {
      const s = readSession();
      if (!s) return { user: null, error: null };
      const u = await this.call<any>('/user', 'GET', undefined, s.access_token);
      return { user: toUser(u), error: null };
    } catch (e) {
      return { user: null, error: e as Error };
    }
  }

  async updateUserRole(_userId: string, role: string) {
    try {
      const s = readSession();
      if (!s) throw new Error('No session');
      const u = await this.call<any>(
        '/user',
        'PUT',
        { data: { role } },
        s.access_token
      );
      s.user = toUser(u);
      writeSession(s);
      return { user: s.user, error: null };
    } catch (e) {
      return { user: null, error: e as Error };
    }
  }
}
