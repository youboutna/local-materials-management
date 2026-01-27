/**
 * Auth Manager - Multi-Providers Coordination
 * Centralizes authentication provider switching and adapter management
 * Following hexagonal architecture principles
 */

import { AppError, ErrorCode } from '@/utils/errorHandling';
import { IAuthRepository, AuthUser, AuthSession, LoginCredentials, RegisterData } from '@/domain/repositories/IAuthRepository';
import { SupabaseAuthAdapter } from '@/infrastructure/supabase/adapters/SupabaseAuthAdapter';
import { KeycloakAuthAdapter } from '@/infrastructure/supabase/adapters/KeycloakAuthAdapter';
import { Auth0Adapter } from '@/infrastructure/supabase/adapters/Auth0Adapter';
import { DatabaseAuthAdapter } from '@/infrastructure/supabase/adapters/DatabaseAuthAdapter';
import { getAppConfig, AuthProvider } from '@/config/app';

export interface AuthManagerConfig {
  provider: AuthProvider;
  url?: string;
  clientId?: string;
  realm?: string;
  redirectUri?: string;
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
  async getCurrentSession(): Promise<{ session: AuthSession | null; error: Error | null }> {
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
  async signIn(credentials: LoginCredentials): Promise<{ session: AuthSession | null; error: Error | null }> {
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
