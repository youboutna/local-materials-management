/**
 * IAuthRepository Interface (Multi-Providers)
 * Port pour l'authentification multi-providers
 * Architecture hexagonale pure - aucune dépendance externe
 */

import { AuthUser, AuthProvider, AuthUserStatus } from '../entities/AuthUser';

export interface SignInCredentials {
  email: string;
  password: string;
  provider?: AuthProvider;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  nationalId?: string;
  provider?: AuthProvider;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  refreshToken: string;
  expiresAt: Date;
  provider: AuthProvider;
}

export interface AuthProviderConfig {
  name: string;
  displayName: string;
  isEnabled: boolean;
  config: Record<string, any>;
}

export interface IAuthRepository {
  /**
   * Authentifie un utilisateur avec ses identifiants
   */
  signIn(credentials: SignInCredentials): Promise<AuthSession>;

  /**
   * Enregistre un nouvel utilisateur
   */
  signUp(userData: SignUpData): Promise<AuthUser>;

  /**
   * Déconnecte un utilisateur
   */
  signOut(sessionId: string): Promise<void>;

  /**
   * Récupère l'utilisateur actuellement authentifié
   */
  getCurrentUser(): Promise<AuthUser | null>;

  /**
   * Rafraîchit une session avec un refresh token
   */
  refreshSession(refreshToken: string): Promise<AuthSession>;

  /**
   * Vérifie la validité d'un token
   */
  validateToken(token: string): Promise<boolean>;

  /**
   * Réinitialise le mot de passe d'un utilisateur
   */
  resetPassword(email: string): Promise<void>;

  /**
   * Confirme la réinitialisation du mot de passe
   */
  confirmPasswordReset(token: string, newPassword: string): Promise<void>;

  /**
   * Change le mot de passe d'un utilisateur authentifié
   */
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;

  /**
   * Active/désactive un utilisateur
   */
  updateUserStatus(userId: string, status: AuthUserStatus): Promise<void>;

  /**
   * Met à jour les métadonnées d'un utilisateur
   */
  updateUserMetadata(userId: string, metadata: Record<string, any>): Promise<void>;

  /**
   * Récupère la configuration d'un provider
   */
  getProviderConfig(provider: AuthProvider): Promise<AuthProviderConfig | null>;

  /**
   * Teste la connexion à un provider
   */
  testProviderConnection(provider: AuthProvider): Promise<boolean>;

  /**
   * Liste les providers disponibles
   */
  getAvailableProviders(): Promise<AuthProvider[]>;

  /**
   * Recherche des utilisateurs par critères
   */
  searchUsers(criteria: {
    email?: string;
    fullName?: string;
    provider?: AuthProvider;
    status?: AuthUserStatus;
    limit?: number;
    offset?: number;
  }): Promise<AuthUser[]>;

  /**
   * Compte le nombre d'utilisateurs correspondant aux critères
   */
  countUsers(criteria: {
    provider?: AuthProvider;
    status?: AuthUserStatus;
  }): Promise<number>;

  /**
   * Vérifie si un email est déjà utilisé
   */
  isEmailTaken(email: string, excludeUserId?: string): Promise<boolean>;
}
