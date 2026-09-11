/**
 * Types des profils de déploiement.
 *
 * Un profil = une combinaison cohérente de providers (auth, data, storage)
 * + un ensemble de variables attendues (saisies par l'admin ou build-time).
 */

import type { AuthProvider, DatabaseProvider, StorageProvider } from '@/config/app';

export interface ProfileField {
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  type?: 'text' | 'password' | 'url' | 'email';
}

export interface ProfileAuthConfig {
  provider: AuthProvider;
  url: string;
  urlLabel?: string;
  urlPlaceholder?: string;
  requiresKey?: boolean;
  keyLabel?: string;
  requiresSecret?: boolean;
  secretLabel?: string;
  extraFields?: ProfileField[];
  urlStorageKey?: string;
  keyStorageKey?: string;
  secretStorageKey?: string;
}

export interface ProfileDataConfig {
  provider: DatabaseProvider;
  url: string;
  urlLabel?: string;
  urlPlaceholder?: string;
  inheritFromAuth?: boolean;
  urlStorageKey?: string;
}

export interface ProfileStorageConfig {
  provider: StorageProvider;
  url: string;
  urlLabel?: string;
  urlPlaceholder?: string;
  inheritFromAuth?: boolean;
  requiresKey?: boolean;
  keyLabel?: string;
  requiresSecret?: boolean;
  secretLabel?: string;
  urlStorageKey?: string;
  keyStorageKey?: string;
  secretStorageKey?: string;
}

export interface DeploymentProfile {
  id: string;
  label: string;
  description: string;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  recommended: boolean;
  auth: ProfileAuthConfig;
  data: ProfileDataConfig;
  storage: ProfileStorageConfig;
  requiredEnvVars: string[];
  docsUrl?: string;
}
