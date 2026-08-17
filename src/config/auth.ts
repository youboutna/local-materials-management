/**
 * Auth Configuration Constants
 * Centralized configuration for authentication system
 */

import { AuthProvider } from '@/config/app';

export const AUTH_PROVIDERS = [
  { value: 'supabase' as AuthProvider, label: 'Supabase', description: 'Default cloud provider' },
  { value: 'keycloak' as AuthProvider, label: 'Keycloak', description: 'Enterprise SSO' },
  { value: 'auth0' as AuthProvider, label: 'Auth0', description: 'Cloud authentication' },
  { value: 'custom' as AuthProvider, label: 'Custom', description: 'Database authentication' }
];

export const DEFAULT_USER_ROLE = 'user';
export const DASHBOARD_ALLOWED_ROLES = ['admin', 'director', 'project_manager'];
export const ADMIN_DIRECTOR_ROLES = ['admin', 'director'];

export const DEV_MODE_CONFIG = {
  enabled: false,
  defaultRole: 'admin',
  mockDelay: 500
};

export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Email ou mot de passe incorrect. Vérifiez vos identifiants.",
  EMAIL_NOT_CONFIRMED: "Veuillez confirmer votre email avant de vous connecter.",
  EMAIL_UPDATE_FAILED: "Impossible de mettre à jour l'email. Veuillez réessayer.",
  NO_PROFILE_FOUND: "Aucun compte associé à cet ID national.",
  PROVIDER_SWITCH_FAILED: "Échec du changement de fournisseur d'authentification.",
  CONNECTION_FAILED: "Impossible de se connecter au fournisseur d'authentification."
};

export const AUTH_SUCCESS_MESSAGES = {
  SIGN_IN: "Bienvenue sur la plateforme.",
  SIGN_UP: "Compte créé avec succès. Vérifiez votre email.",
  SIGN_OUT: "Vous avez été déconnecté avec succès.",
  PHONE_OTP_SENT: "Code OTP envoyé à votre téléphone.",
  PHONE_OTP_VERIFIED: "Vous êtes maintenant connecté.",
  PROVIDER_SWITCHED: "Fournisseur changé pour {provider}.",
  EMAIL_UPDATED: "Un email de confirmation a été envoyé à {email}."
};

export const AUTH_REDIRECTS = {
  DEFAULT: '/dashboard',
  SIGN_IN: '/auth',
  SIGN_UP: '/auth',
  AFTER_SIGN_OUT: '/auth'
};

export const SESSION_CONFIG = {
  STALE_TIME: 5 * 60 * 1000,
  CACHE_TIME: 30 * 60 * 1000,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 500
};