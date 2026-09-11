import type { DeploymentProfile } from './types';

export const KEYCLOAK_POSTGREST_PROFILE: DeploymentProfile = {
  id: 'keycloak-postgrest',
  label: 'Keycloak + PostgREST',
  description: 'SSO entreprise avec Keycloak et API PostgREST.',
  icon: '🔐',
  difficulty: 'expert',
  recommended: false,
  auth: {
    provider: 'keycloak',
    url: '',
    urlLabel: 'URL de Keycloak',
    urlPlaceholder: 'https://sso.mon-domaine.com',
    requiresKey: false,
    urlStorageKey: 'VITE_KEYCLOAK_URL',
    extraFields: [
      { key: 'realm', label: 'Realm', placeholder: 'mon-realm', required: true },
      { key: 'clientId', label: 'Client ID', placeholder: 'mon-client-frontend', required: true },
    ],
  },
  data: {
    provider: 'postgrest',
    url: '',
    urlLabel: 'URL de PostgREST',
    urlPlaceholder: 'https://api.mon-domaine.com',
    urlStorageKey: 'VITE_POSTGREST_URL',
  },
  storage: {
    provider: 's3',
    url: '',
    urlLabel: 'Endpoint S3/MinIO',
    urlPlaceholder: 'https://storage.mon-domaine.com',
    requiresKey: true,
    keyLabel: 'Access Key',
    requiresSecret: true,
    secretLabel: 'Secret Key',
    urlStorageKey: 'VITE_STORAGE_ENDPOINT',
    keyStorageKey: 'VITE_STORAGE_ACCESS_KEY',
    secretStorageKey: 'VITE_STORAGE_SECRET_KEY',
  },
  requiredEnvVars: [
    'VITE_KEYCLOAK_URL',
    'VITE_KEYCLOAK_REALM',
    'VITE_KEYCLOAK_CLIENT_ID',
    'VITE_POSTGREST_URL',
    'VITE_STORAGE_ENDPOINT',
  ],
};
