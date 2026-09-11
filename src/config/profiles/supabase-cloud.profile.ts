import type { DeploymentProfile } from './types';

export const SUPABASE_CLOUD_PROFILE: DeploymentProfile = {
  id: 'supabase-cloud',
  label: 'Supabase Cloud',
  description: 'Solution SaaS managée par Supabase (recommandé pour la production).',
  icon: '☁️',
  difficulty: 'easy',
  recommended: true,
  auth: {
    provider: 'supabase',
    url: '',
    urlLabel: 'URL du projet Supabase',
    urlPlaceholder: 'https://xxxxxxxxxxxx.supabase.co',
    requiresKey: true,
    keyLabel: 'Clé anon publique',
    urlStorageKey: 'VITE_SUPABASE_URL',
    keyStorageKey: 'VITE_SUPABASE_ANON_KEY',
  },
  data: { provider: 'supabase', url: '', inheritFromAuth: true },
  storage: { provider: 'supabase', url: '', inheritFromAuth: true },
  requiredEnvVars: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  docsUrl: 'https://supabase.com/docs/guides/getting-started',
};
