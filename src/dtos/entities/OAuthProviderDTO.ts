// =============================================================================
// OAuthProviderDTO.ts – Data Transfer Objects pour OAuth Providers
// Aligné avec la table public.oauth_providers
// =============================================================================

/**
 * OAuth Provider – DTO de base (lecture)
 */

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
ing, any> | null;
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
 * O Session Update DTO – Mise à jour d'une session
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
export interface OAuthProvider enabledCount: number;
}