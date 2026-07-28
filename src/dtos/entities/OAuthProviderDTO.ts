// =============================================================================
// OAuthProviderDTO.ts – Data Transfer Objects pour OAuth Providers
// Aligné avec la table public.oauth_providers
// =============================================================================

/**
 * OAuth Provider – DTO de base (lecture)
 */
export interface OAuthProviderDTO {
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
 * OAuth Provider Create Data – DTO pour la création
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
 * OAuth Provider Update Data – DTO pour la mise à jour partielle
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
 * OAuth Session DTO – Session OAuth
 */
export interface OAuthSessionDTO {
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
 * OAuth Session Create DTO – Création d'une session
 */
export interface OAuthSessionCreateDTO {
  userId: string;
  provider: string;
  providerSessionId?: string | null;
  expiresAt?: string | null;
  refreshToken?: string | null;
  accessToken?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * OAuth Session Update DTO – Mise à jour d'une session
 */
export interface OAuthSessionUpdateDTO {
  providerSessionId?: string | null;
  expiresAt?: string | null;
  refreshToken?: string | null;
  accessToken?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * OAuth Provider Response – DTO pour les réponses API (simplifié)
 */
export interface OAuthProviderResponse {
  id: string;
  providerName: string;
  clientId?: string | null;
  enabled: boolean | null;
  scopes?: string[] | null;
}

/**
 * OAuth Provider List Response – DTO pour la liste avec statistiques
 */
export interface OAuthProviderListResponse {
  providers: OAuthProviderDTO[];
  total: number;
  enabledCount: number;
}