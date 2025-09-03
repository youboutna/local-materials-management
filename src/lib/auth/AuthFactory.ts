/**
 * Authentication Factory
 * Supports multiple authentication providers
 */

import { getAppConfig, AuthProvider } from '@/config/app';
import { User, Session } from '@supabase/supabase-js';

export interface AuthResult {
  user?: User | any;
  session?: Session | any;
  error?: string;
}

export interface AuthService {
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string, userData?: any): Promise<AuthResult>;
  signOut(): Promise<{ error?: string }>;
  getCurrentUser(): Promise<{ user?: User | any; session?: Session | any }>;
  onAuthStateChange(callback: (event: string, session: any) => void): () => void;
}

// Supabase Auth Service
class SupabaseAuthService implements AuthService {
  private supabase: any;

  constructor() {
    import('@/integrations/supabase/client').then(({ supabase }) => {
      this.supabase = supabase;
    });
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data?.user,
      session: data?.session,
      error: error?.message,
    };
  }

  async signUp(email: string, password: string, userData?: any): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    return {
      user: data?.user,
      session: data?.session,
      error: error?.message,
    };
  }

  async signOut(): Promise<{ error?: string }> {
    const { error } = await this.supabase.auth.signOut();
    return { error: error?.message };
  }

  async getCurrentUser() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return {
      user: session?.user,
      session,
    };
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(callback);
    return () => subscription.unsubscribe();
  }
}

// Keycloak Auth Service
class KeycloakAuthService implements AuthService {
  private keycloak: any;

  constructor() {
    this.initKeycloak();
  }

  private async initKeycloak() {
    const config = getAppConfig();
    if (config.auth.provider === 'keycloak') {
      const Keycloak = (await import('keycloak-js')).default;
      this.keycloak = new Keycloak({
        url: config.auth.url!,
        realm: config.auth.realm!,
        clientId: config.auth.clientId!,
      });
      
      await this.keycloak.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      });
    }
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      await this.keycloak.login();
      return {
        user: this.keycloak.tokenParsed,
        session: { access_token: this.keycloak.token },
      };
    } catch (error) {
      return { error: 'Login failed' };
    }
  }

  async signUp(): Promise<AuthResult> {
    return { error: 'Sign up not supported with Keycloak' };
  }

  async signOut(): Promise<{ error?: string }> {
    try {
      await this.keycloak.logout();
      return {};
    } catch (error) {
      return { error: 'Logout failed' };
    }
  }

  async getCurrentUser() {
    if (this.keycloak?.authenticated) {
      return {
        user: this.keycloak.tokenParsed,
        session: { access_token: this.keycloak.token },
      };
    }
    return {};
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    // Keycloak doesn't have a built-in state change listener
    // You would need to implement polling or use Keycloak events
    return () => {};
  }
}

// Custom Auth Service (for other providers)
class CustomAuthService implements AuthService {
  async signIn(email: string, password: string): Promise<AuthResult> {
    // Implement custom authentication logic
    return { error: 'Custom auth not implemented' };
  }

  async signUp(email: string, password: string): Promise<AuthResult> {
    return { error: 'Custom auth not implemented' };
  }

  async signOut(): Promise<{ error?: string }> {
    return { error: 'Custom auth not implemented' };
  }

  async getCurrentUser() {
    return {};
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return () => {};
  }
}

// Auth Factory
export class AuthFactory {
  static createAuthService(): AuthService {
    const config = getAppConfig();
    
    switch (config.auth.provider) {
      case 'supabase':
        return new SupabaseAuthService();
      case 'keycloak':
        return new KeycloakAuthService();
      case 'auth0':
      case 'custom':
      default:
        return new CustomAuthService();
    }
  }
}

// Export singleton
export const authService = AuthFactory.createAuthService();