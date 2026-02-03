/**
 * Auth Manager - Multi-Providers Coordination
 * Centralizes authentication provider switching and adapter management
 * Following hexagonal architecture principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { AuthUser, AuthSession as BaseAuthSession, LoginCredentials, RegisterData } from '@/domain/repositories/IAuthRepository';
import { getAppConfig, AuthProvider } from '@/config/app';
import { AuthUserStatus } from '@/domain/entities/AuthUser';

// Local types for AuthManager internal use
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: AuthErrorDTO;
}

export interface AuthErrorDTO {
  code: string;
  message: string;
}

export interface AuthManagerConfig {
  provider: AuthProvider;
  url?: string;
  clientId?: string;
  realm?: string;
  redirectUri?: string;
}

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpData {
  email: string;
  password: string;
  name: string;
}

// Internal session type for AuthManager
interface AuthManagerSession {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

interface IAuthRepository {
  authenticate(provider: AuthProvider, credentials: AuthCredentials): Promise<AuthResult>;
  getCurrentSession(): Promise<{ session: AuthManagerSession | null; error: Error | null }>;
  getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }>;
  signIn(credentials: LoginCredentials): Promise<{ session: AuthManagerSession | null; error: Error | null }>;
  signUp(data: RegisterData): Promise<{ user: AuthUser | null; error: Error | null }>;
  signOut(): Promise<{ error: Error | null }>;
  resetPassword(email: string): Promise<{ error: Error | null }>;
  updatePassword(newPassword: string): Promise<{ error: Error | null }>;
}

class SupabaseAuthAdapter implements IAuthRepository {
  async authenticate(provider: AuthProvider, credentials: AuthCredentials): Promise<AuthResult> {
    return { success: true, user: undefined, token: undefined };
  }

  async getCurrentSession(): Promise<{ session: AuthManagerSession | null; error: Error | null }> {
    return { session: null, error: null };
  }

  async getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }> {
    return { user: null, error: null };
  }

  async signIn(credentials: LoginCredentials): Promise<{ session: AuthManagerSession | null; error: Error | null }> {
    return { session: null, error: null };
  }

  async signUp(data: RegisterData): Promise<{ user: AuthUser | null; error: Error | null }> {
    return { user: null, error: null };
  }

  async signOut(): Promise<{ error: Error | null }> {
    return { error: null };
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    return { error: null };
  }

  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    return { error: null };
  }
}

class KeycloakAuthAdapter implements IAuthRepository {
  private config: AuthManagerConfig;

  constructor(config: AuthManagerConfig) {
    this.config = config;
  }

  async authenticate(provider: AuthProvider, credentials: AuthCredentials): Promise<AuthResult> {
    return { success: true, user: undefined, token: undefined };
  }

  async getCurrentSession(): Promise<{ session: AuthManagerSession | null; error: Error | null }> {
    return { session: null, error: null };
  }

  async getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }> {
    return { user: null, error: null };
  }

  async signIn(credentials: LoginCredentials): Promise<{ session: AuthManagerSession | null; error: Error | null }> {
    return { session: null, error: null };
  }

  async signUp(data: RegisterData): Promise<{ user: AuthUser | null; error: Error | null }> {
    return { user: null, error: null };
  }

  async signOut(): Promise<{ error: Error | null }> {
    return { error: null };
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    return { error: null };
  }

  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    return { error: null };
  }
}

class Auth0Adapter implements IAuthRepository {
  private config: AuthManagerConfig;

  constructor(config: AuthManagerConfig) {
    this.config = config;
  }

  async authenticate(provider: AuthProvider, credentials: AuthCredentials): Promise<AuthResult> {
    return { success: true, user: undefined, token: undefined };
  }

  async getCurrentSession(): Promise<{ session: AuthManagerSession | null; error: Error | null }> {
    return { session: null, error: null };
  }

  async getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }> {
    return { user: null, error: null };
  }

  async signIn(credentials: LoginCredentials): Promise<{ session: AuthManagerSession | null; error: Error | null }> {
    return { session: null, error: null };
  }

  async signUp(data: RegisterData): Promise<{ user: AuthUser | null; error: Error | null }> {
    return { user: null, error: null };
  }

  async signOut(): Promise<{ error: Error | null }> {
    return { error: null };
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    return { error: null };
  }

  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    return { error: null };
  }
}

class DatabaseAuthAdapter implements IAuthRepository {
  private config: AuthManagerConfig;

  constructor(config: AuthManagerConfig) {
    this.config = config;
  }

  async authenticate(provider: AuthProvider, credentials: AuthCredentials): Promise<AuthResult> {
    return { success: true, user: undefined, token: undefined };
  }

  async getCurrentSession(): Promise<{ session: AuthManagerSession | null; error: Error | null }> {
    return { session: null, error: null };
  }

  async getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }> {
    return { user: null, error: null };
  }

  async signIn(credentials: LoginCredentials): Promise<{ session: AuthManagerSession | null; error: Error | null }> {
    return { session: null, error: null };
  }

  async signUp(data: RegisterData): Promise<{ user: AuthUser | null; error: Error | null }> {
    return { user: null, error: null };
  }

  async signOut(): Promise<{ error: Error | null }> {
    return { error: null };
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    return { error: null };
  }

  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    return { error: null };
  }
}

export class AuthManager {
  private currentAdapter: IAuthRepository | null = null;
  private currentConfig: AuthManagerConfig;

  constructor(config?: AuthManagerConfig) {
    this.currentConfig = config || this.getDefaultConfig();
    this.currentAdapter = this.createAdapter(this.currentConfig);
  }

  /**
   * Get default configuration from app config
   */
  private getDefaultConfig(): AuthManagerConfig {
    const appConfig = getAppConfig();
    return {
      provider: appConfig.auth.provider,
      url: appConfig.auth.url,
      clientId: appConfig.auth.clientId,
      realm: appConfig.auth.realm,
      redirectUri: appConfig.auth.redirectUri
    };
  }

  /**
   * Create adapter based on provider configuration
   */
  private createAdapter(config: AuthManagerConfig): IAuthRepository {
    switch (config.provider) {
      case 'supabase':
        return new SupabaseAuthAdapter();
      
      case 'keycloak':
        return new KeycloakAuthAdapter(config);
      
      case 'auth0':
        return new Auth0Adapter(config);
      
      case 'custom':
        return new DatabaseAuthAdapter(config);
      
      default:
        return new SupabaseAuthAdapter();
    }
  }

  /**
   * Get current auth adapter
   */
  getAdapter(): IAuthRepository {
    if (!this.currentAdapter) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'No auth adapter available');
    }
    return this.currentAdapter;
  }

  /**
   * Get current provider configuration
   */
  getConfig(): AuthManagerConfig {
    return this.currentConfig;
  }

  /**
   * Switch to a different provider
   */
  async switchProvider(newConfig: AuthManagerConfig): Promise<void> {
    try {
      // Test new provider connection
      const testAdapter = this.createAdapter(newConfig);
      await this.testConnection(testAdapter);

      // If successful, switch to new provider
      this.currentConfig = newConfig;
      this.currentAdapter = testAdapter;

      console.log(`Switched to ${newConfig.provider} auth provider`);
    } catch (error) {
      console.error('Failed to switch provider:', error);
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to switch authentication provider');
    }
  }

  /**
   * Test connection to provider
   */
  private async testConnection(adapter: IAuthRepository): Promise<void> {
    try {
      // Simple connection test - try to get current session
      await adapter.getCurrentSession();
    } catch (error) {
      throw new AppError(ErrorCode.CONNECTION_ERROR, 'Cannot connect to authentication provider');
    }
  }

  /**
   * Get current session
   */
  async getCurrentSession(): Promise<{ session: AuthManagerSession | null; error: Error | null }> {
    return this.getAdapter().getCurrentSession();
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<{ user: AuthUser | null; error: Error | null }> {
    return this.getAdapter().getCurrentUser();
  }

  /**
   * Sign in with credentials
   */
  async signInWithCredentials(credentials: LoginCredentials): Promise<{ session: AuthManagerSession | null; error: Error | null }> {
    return this.getAdapter().signIn(credentials);
  }

  /**
   * Sign up new user
   */
  async signUp(data: RegisterData): Promise<{ user: AuthUser | null; error: Error | null }> {
    return this.getAdapter().signUp(data);
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    return this.getAdapter().signOut();
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ error: Error | null }> {
    return this.getAdapter().resetPassword(email);
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    return this.getAdapter().updatePassword(newPassword);
  }

  /**
   * Get supported providers
   */
  getSupportedProviders(): Array<{ value: AuthProvider; label: string; description: string }> {
    return [
      { value: 'supabase', label: 'Supabase Auth', description: 'Managed authentication with social providers' },
      { value: 'keycloak', label: 'Keycloak', description: 'Enterprise SSO and identity management' },
      { value: 'auth0', label: 'Auth0', description: 'Universal authentication & authorization platform' },
      { value: 'custom', label: 'Custom', description: 'Custom authentication implementation' }
    ];
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(provider: AuthProvider): boolean {
    switch (provider) {
      case 'supabase':
        return true; // Always available
      case 'keycloak':
        return true; // Available (mock implementation)
      case 'auth0':
        return true; // Available (mock implementation)
      case 'custom':
        return true; // Available (mock implementation)
      default:
        return false;
    }
  }

  /**
   * Sign in with provider
   */
  async signIn(credentials: SignInCredentials, provider?: AuthProvider): Promise<AuthManagerSession | null> {
    const result = await this.getAdapter().signIn({
      email: credentials.email,
      password: credentials.password
    });
    return result.session;
  }

  async authenticate(
    provider: AuthProvider,
    credentials: AuthCredentials
  ): Promise<AuthResult> {
    try {
      const result = await this.getAdapter().authenticate(provider, credentials);
      return {
        success: true,
        user: result.user,
        token: result.token
      };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error)
      };
    }
  }

  private handleAuthError(error: unknown): AuthErrorDTO {
    if (error instanceof Error) {
      return {
        code: 'server_error',
        message: error.message
      };
    }
    return {
      code: 'server_error',
      message: 'Unknown authentication error'
    };
  }

  // ... all other methods from AuthManagerNew
}

// Singleton instance for global access
let authManagerInstance: AuthManager | null = null;

export function getAuthManager(): AuthManager {
  if (!authManagerInstance) {
    authManagerInstance = new AuthManager();
  }
  return authManagerInstance;
}

export function resetAuthManager(): void {
  authManagerInstance = null;
}
