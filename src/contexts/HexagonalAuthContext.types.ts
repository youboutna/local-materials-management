/**
 * Types pour le contexte d'authentification hexagonal
 * 
 * @version 2.1.0
 * @description Types unifiés pour l'authentification multi-providers
 *              (Supabase, Keycloak, Auth0, Local)
 * 
 * @fixes
 * - Correction de l'export AuthManagerConfig (import depuis le bon module)
 * - Correction du type `boolean | undefined` → `boolean` (ligne 100)
 * - Ajout de l'export du contexte pour useHexagonalAuth
 * - Types complets pour OAuth et l'éditeur d'email
 */

// ============================================================================
// IMPORTS
// ============================================================================

import type { AuthManagerConfig } from '@/application/services/AuthManager';
import type {
  OAuthLoginData,
  UnifiedAuthSession,
  UnifiedAuthUser,
} from '@/application/services/UnifiedAuthService';
import type { AuthProvider } from '@/config/app';
import type { LoginCredentials, RegisterData } from '@/domain/repositories/IAuthRepository';

// ============================================================================
// RE-EXPORTS (pour compatibilité)
// ============================================================================

export type { AuthManagerConfig, AuthProvider, LoginCredentials, OAuthLoginData, RegisterData, UnifiedAuthSession, UnifiedAuthUser };

// ============================================================================
// TYPES DE BASE
// ============================================================================

/**
 * Métadonnées d'authentification (remplace `any`)
 */
export interface AuthMetadata {
  [key: string]: string | number | boolean | null | undefined | string[];
}

/**
 * Configuration d'un fournisseur OAuth
 */
export interface OAuthProviderConfig {
  id: string;
  providerName: string;
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string[];
  metadata?: AuthMetadata;
  createdAt: string;
  updatedAt: string;
}

/**
 * État de l'authentification
 */
export interface AuthState {
  user: UnifiedAuthUser | null;
  session: UnifiedAuthSession | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isDevelopmentMode: boolean;
  currentProvider: AuthProvider;
}

// ============================================================================
// TYPE PRINCIPAL DU CONTEXTE
// ============================================================================

/**
 * Interface complète du contexte d'authentification hexagonal
 * Utilisée par les composants React via `useHexagonalAuth()`
 */
export interface HexagonalAuthContextType {
  // ==========================================================================
  // ÉTAT (State)
  // ==========================================================================

  /** Utilisateur actuellement connecté */
  user: UnifiedAuthUser | null;

  /** Session active */
  session: UnifiedAuthSession | null;

  /** Indique si l'utilisateur est authentifié */
  isAuthenticated: boolean;

  /** Indique si l'authentification est en cours de chargement */
  isLoading: boolean;

  /** Alias de isLoading (compatibilité) */
  loading: boolean;

  /** Erreur d'authentification (message) */
  error: string | null;

  /** Indique si le mode développement est actif */
  isDevelopmentMode: boolean;

  /** Fournisseur d'authentification actuel */
  currentProvider: AuthProvider;

  /** Liste des fournisseurs supportés */
  supportedProviders: Array<{
    value: AuthProvider;
    label: string;
    description: string;
  }>;

  // ==========================================================================
  // ACTIONS D'AUTHENTIFICATION
  // ==========================================================================

  /**
   * Connexion avec email/mot de passe
   */
  login: (credentials: LoginCredentials) => Promise<void>;

  /**
   * Connexion avec OAuth (Google, GitHub, Keycloak, etc.)
   */
  loginWithOAuth: (oAuthData: OAuthLoginData) => Promise<void>;

  /**
   * Inscription d'un nouvel utilisateur
   */
  register: (data: RegisterData) => Promise<void>;

  /**
   * Déconnexion de l'utilisateur
   */
  logout: () => Promise<void>;

  /**
   * Alias de logout (compatibilité)
   */
  signOut: () => Promise<void>;

  /**
   * Changement de fournisseur d'authentification
   */
  switchProvider: (config: AuthManagerConfig) => Promise<void>;

  // ==========================================================================
  // OAuth SPÉCIFIQUE
  // ==========================================================================

  /**
   * Récupère la liste des fournisseurs OAuth disponibles
   */
  getOAuthProviders: () => Promise<OAuthProviderConfig[]>;

  /**
   * Génère l'URL d'authentification OAuth pour un fournisseur
   */
  generateOAuthUrl: (provider: string, redirectUri: string) => Promise<string>;

  // ==========================================================================
  // GESTION DE SESSION
  // ==========================================================================

  /**
   * Recharge les données de l'utilisateur
   */
  refetch: () => void;

  /**
   * Récupère le fournisseur actuel
   */
  getCurrentProvider: () => AuthProvider;

  // ==========================================================================
  // UTILITAIRES (Permissions)
  // ==========================================================================

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole: (roleName: string) => boolean;

  /**
   * Vérifie si l'utilisateur a au moins un des rôles spécifiés
   */
  hasAnyRole: (roleNames: string[]) => boolean;

  // ==========================================================================
  // ÉDITEUR D'EMAIL (pour confirmation)
  // ==========================================================================

  /** Indique si l'éditeur d'email est visible */
  showEmailEditor: boolean;

  /** Email non confirmé en attente */
  unconfirmedEmail: string | null;

  /**
   * Met à jour l'email de l'utilisateur
   */
  updateEmail: (newEmail: string) => Promise<void>;

  /**
   * Annule l'édition de l'email
   */
  cancelEmailEdit: () => void;

  /**
   * Déclenche l'éditeur d'email pour un email spécifique
   */
  triggerEmailEditor: (email: string) => void;
}

// ============================================================================
// PROPS DU PROVIDER
// ============================================================================

/**
 * Props du provider HexagonalAuthContext
 */
export interface HexagonalAuthProviderProps {
  /** Enfants React */
  children: React.ReactNode;

  /** Configuration optionnelle (surcharge) */
  config?: Partial<AuthManagerConfig>;

  /** Mode développement forcé */
  forceDevMode?: boolean;

  /** Redirection après connexion */
  redirectAfterLogin?: string;

  /** Redirection après déconnexion */
  redirectAfterLogout?: string;
}

// ============================================================================
// TYPES D'ÉVÉNEMENTS (pour les hooks personnalisés)
// ============================================================================

/**
 * Événements d'authentification
 */
export type AuthEvent =
  | { type: 'login'; user: UnifiedAuthUser }
  | { type: 'logout' }
  | { type: 'register'; user: UnifiedAuthUser }
  | { type: 'provider_switch'; provider: AuthProvider }
  | { type: 'error'; error: string }
  | { type: 'email_update'; oldEmail: string; newEmail: string };

/**
 * Callback pour les événements d'authentification
 */
export type AuthEventListener = (event: AuthEvent) => void;

// ============================================================================
// TYPES D'AIDE
// ============================================================================

/**
 * Options de filtrage des fournisseurs OAuth
 */
export interface OAuthProviderFilterOptions {
  /** Filtrer par nom de fournisseur */
  providerName?: string;
  /** Filtrer par statut activé */
  enabled?: boolean;
  /** Filtrer par scopes disponibles */
  scopes?: string[];
  /** Filtrer par fournisseur actif */
  isActive?: boolean;
}

/**
 * Résultat de la génération d'URL OAuth
 */
export interface OAuthUrlResult {
  url: string;
  provider: string;
  state?: string;
  codeChallenge?: string;
  codeVerifier?: string;
  nonce?: string;
}

/**
 * Résultat de la connexion OAuth
 */
export interface OAuthLoginResult {
  success: boolean;
  user?: UnifiedAuthUser;
  session?: UnifiedAuthSession;
  error?: string;
  provider: string;
}

// ============================================================================
// TYPES POUR L'ÉDITEUR D'EMAIL
// ============================================================================

/**
 * État de l'éditeur d'email
 */
export interface EmailEditorState {
  /** Indique si l'éditeur est visible */
  show: boolean;
  /** Email actuel (non confirmé) */
  currentEmail: string | null;
  /** Nouvel email saisi */
  newEmail: string;
  /** Indique si la mise à jour est en cours */
  isUpdating: boolean;
  /** Erreur éventuelle */
  error: string | null;
  /** Succès de la mise à jour */
  success: boolean;
}

// ============================================================================
// FONCTIONS UTILITAIRES DE TYPE
// ============================================================================

/**
 * Vérifie si un fournisseur est supporté
 */
export function isSupportedProvider(provider: string): provider is AuthProvider {
  const providers: AuthProvider[] = ['supabase', 'keycloak', 'auth0', 'local', 'custom'];
  return providers.includes(provider as AuthProvider);
}

/**
 * Vérifie si l'utilisateur a un rôle
 */
export function hasRole(user: UnifiedAuthUser | null, roleName: string): boolean {
  if (!user) return false;
  return user.role === roleName || (user.roles && user.roles.includes(roleName));
}

/**
 * Vérifie si l'utilisateur a au moins un des rôles
 */
export function hasAnyRole(user: UnifiedAuthUser | null, roleNames: string[]): boolean {
  if (!user) return false;
  return roleNames.some(role => hasRole(user, role));
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export function isAuthenticated(user: UnifiedAuthUser | null): boolean {
  return !!user;
}

/**
 * Vérifie si le mode développement est actif
 */
export function isDevelopmentMode(mode: string | undefined): boolean {
  return mode === 'development' || mode === 'dev' || mode === 'local-bypass';
}

/**
 * Récupère le nom d'affichage de l'utilisateur
 */
export function getUserDisplayName(user: UnifiedAuthUser | null): string {
  if (!user) return 'Invité';
  return user.fullName || user.email || user.username || 'Utilisateur';
}

/**
 * Récupère l'avatar de l'utilisateur
 */
export function getUserAvatar(user: UnifiedAuthUser | null): string | undefined {
  return user?.avatarUrl || user?.picture || undefined;
}

// ============================================================================
// EXPORT PAR DÉFAUT
// ============================================================================

/**
 * Export par défaut du type du contexte
 */
export type HexagonalAuthContextTypeDefault = HexagonalAuthContextType;

export default HexagonalAuthContextType;