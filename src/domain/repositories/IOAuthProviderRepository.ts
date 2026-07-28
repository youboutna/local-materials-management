// =============================================================================
// IOAuthProviderRepository.ts – Port pour la gestion des providers OAuth
// Aligné avec la table public.oauth_providers
// =============================================================================

/**
 * OAuth Provider – Entité domaine
 * Correspond exactement à la table public.oauth_providers
 */
export interface OAuthProvider {
  id: string;
  providerName: string;
  clientId?: string | null;
  clientSecret?: string | null;
  authUrl?: string | null;
  tokenUrl?: string | null;
  userInfoUrl?: string | null;
  scopes?: string[] | null;
  enabled: boolean | null;
  configuration?: Record<string, any> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/**
 * OAuth Provider Create Data – Données pour la création
 */
export interface OAuthProviderCreateData {
  providerName: string;
  clientId?: string | null;
  clientSecret?: string | null;
  authUrl?: string | null;
  tokenUrl?: string | null;
  userInfoUrl?: string | null;
  scopes?: string[] | null;
  enabled?: boolean | null;
  configuration?: Record<string, any> | null;
}

/**
 * OAuth Provider Update Data – Données pour la mise à jour partielle
 */
export interface OAuthProviderUpdateData {
  providerName?: string | null;
  clientId?: string | null;
  clientSecret?: string | null;
  authUrl?: string | null;
  tokenUrl?: string | null;
  userInfoUrl?: string | null;
  scopes?: string[] | null;
  enabled?: boolean | null;
  configuration?: Record<string, any> | null;
}

/**
 * OAuth Session – Session OAuth
 * Correspond à la table public.auth_sessions
 */
export interface OAuthSession {
  id: string;
  userId: string;
  provider: string;
  providerSessionId?: string | null;
  expiresAt?: string | null;
  refreshToken?: string | null;
  accessToken?: string | null;
  metadata?: Record<string, any> | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/**
 * OAuth Session Create Data – Données pour la création d'une session
 */
export interface OAuthSessionCreateData {
  userId: string;
  provider: string;
  providerSessionId?: string | null;
  expiresAt?: string | null;
  refreshToken?: string | null;
  accessToken?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * OAuth Session Update Data – Données pour la mise à jour d'une session
 */
export interface OAuthSessionUpdateData {
  providerSessionId?: string | null;
  expiresAt?: string | null;
  refreshToken?: string | null;
  accessToken?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Port – Interface du repository OAuth Provider
 */
export interface IOAuthProviderRepository {
  // OAuth Providers
  findAll(): Promise<OAuthProvider[]>;
  findByName(name: string): Promise<OAuthProvider | null>;
  findEnabled(): Promise<OAuthProvider[]>;
  upsert(data: OAuthProviderCreateData): Promise<OAuthProvider>;
  toggleEnabled(name: string, enabled: boolean): Promise<void>;
  delete(name: string): Promise<void>;
}

/**
 * Port – Interface du repository OAuth Session
 */
export interface IOAuthSessionRepository {
  findByUserId(userId: string): Promise<OAuthSession[]>;
  findByProvider(userId: string, provider: string): Promise<OAuthSession | null>;
  create(data: OAuthSessionCreateData): Promise<OAuthSession>;
  update(id: string, data: OAuthSessionUpdateData): Promise<OAuthSession>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}