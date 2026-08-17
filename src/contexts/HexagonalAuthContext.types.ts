/**
 * Types pour le contexte d'authentification hexagonal
 */

import { AuthProvider } from '@/config/app';
import { UnifiedAuthUser, UnifiedAuthSession, OAuthLoginData } from '@/application/services/UnifiedAuthService';
import { LoginCredentials, RegisterData } from '@/domain/repositories/IAuthRepository';

export interface HexagonalAuthContextType {
  // Core auth state
  user: UnifiedAuthUser | null;
  session: UnifiedAuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Auth actions
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithOAuth: (oAuthData: OAuthLoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  
  // OAuth specific
  getOAuthProviders: () => Promise<any[]>;
  generateOAuthUrl: (provider: string, redirectUri: string) => Promise<string>;
  
  // Session management
  refetch: () => void;
  getCurrentProvider: () => AuthProvider;
  
  // Utility
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;

  // Éditeur d'email
  showEmailEditor: boolean;
  unconfirmedEmail: string | null;
  updateEmail: (newEmail: string) => Promise<void>;
  cancelEmailEdit: () => void;
  triggerEmailEditor: (email: string) => void;
}