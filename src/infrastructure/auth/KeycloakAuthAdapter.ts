/**
 * KeycloakAuthAdapter
 * Implements IAuthRepository against Keycloak (OIDC).
 * Uses password grant for programmatic sign-in (dev/staging); production apps
 * should combine with the existing keycloak-js redirect flow.
 */
import {
  IAuthRepository,
  AuthSession,
  AuthUser,
  LoginCredentials,
  RegisterData,
} from '@/domain/repositories/IAuthRepository';

const SESSION_KEY = 'keycloak_session';

interface KeycloakOptions {
  url: string; // e.g. https://kc.example.com
  realm: string;
  clientId: string;
  clientSecret?: string;
}

function tokenUrl(o: KeycloakOptions) {
  return `${o.url.replace(/\/$/, '')}/realms/${o.realm}/protocol/openid-connect/token`;
}
function userinfoUrl(o: KeycloakOptions) {
  return `${o.url.replace(/\/$/, '')}/realms/${o.realm}/protocol/openid-connect/userinfo`;
}
function logoutUrl(o: KeycloakOptions) {
  return `${o.url.replace(/\/$/, '')}/realms/${o.realm}/protocol/openid-connect/logout`;
}

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

async function form(url: string, body: Record<string, string>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(json?.error_description ?? res.statusText);
  return json;
}

function toUser(u: any): AuthUser {
  return {
    id: u.sub ?? u.id,
    email: u.email,
    full_name: u.name ?? u.preferred_username,
    role: (u.realm_access?.roles ?? [])[0],
  };
}

export class KeycloakAuthAdapter implements IAuthRepository {
  constructor(private opts: KeycloakOptions) {}

  async getCurrentSession() {
    return { session: readSession(), error: null };
  }

  async signIn(credentials: LoginCredentials) {
    try {
      const tok = await form(tokenUrl(this.opts), {
        grant_type: 'password',
        client_id: this.opts.clientId,
        ...(this.opts.clientSecret ? { client_secret: this.opts.clientSecret } : {}),
        username: credentials.email,
        password: credentials.password,
      });
      const info = await fetch(userinfoUrl(this.opts), {
        headers: { Authorization: `Bearer ${tok.access_token}` },
      }).then((r) => r.json());
      const session: AuthSession = {
        access_token: tok.access_token,
        refresh_token: tok.refresh_token,
        expires_at: String(Math.floor(Date.now() / 1000) + (tok.expires_in ?? 0)),
        user: toUser(info),
      };
      writeSession(session);
      return { session, error: null };
    } catch (e) {
      return { session: null, error: e as Error };
    }
  }

  async signUp(_data: RegisterData) {
    return {
      user: null,
      error: new Error('Keycloak sign-up must go through the Keycloak admin API'),
    };
  }

  async signOut() {
    try {
      const s = readSession();
      if (s?.refresh_token) {
        await form(logoutUrl(this.opts), {
          client_id: this.opts.clientId,
          ...(this.opts.clientSecret ? { client_secret: this.opts.clientSecret } : {}),
          refresh_token: s.refresh_token,
        }).catch(() => null);
      }
      writeSession(null);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  }

  async resetPassword(_email: string) {
    return { error: new Error('Password reset must be initiated from Keycloak UI') };
  }
  async updatePassword(_newPassword: string) {
    return { error: new Error('Password update must be performed through Keycloak') };
  }

  async getCurrentUser() {
    try {
      const s = readSession();
      if (!s) return { user: null, error: null };
      const info = await fetch(userinfoUrl(this.opts), {
        headers: { Authorization: `Bearer ${s.access_token}` },
      }).then((r) => r.json());
      return { user: toUser(info), error: null };
    } catch (e) {
      return { user: null, error: e as Error };
    }
  }

  async updateUserRole(_userId: string, _role: string) {
    return { user: null, error: new Error('Role assignment must go through Keycloak admin API') };
  }
}
