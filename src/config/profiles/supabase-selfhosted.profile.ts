import type { DeploymentProfile } from './types';

export const SUPABASE_SELFHOSTED_PROFILE: DeploymentProfile = {
  id: 'supabase-selfhosted',
  label: 'Supabase Self-Hosted',
  description: 'Stack Supabase complète sur votre infrastructure (Docker).',
  icon: '🐳',
  difficulty: 'medium',
  recommended: false,
  auth: {
    provider: 'supabase',
    url: '',
    urlLabel: 'URL de votre instance Supabase',
    urlPlaceholder: 'https://supabase.mon-domaine.com',
    requiresKey: true,
    keyLabel: 'Clé anon publique',
    urlStorageKey: 'VITE_SUPABASE_URL',
    keyStorageKey: 'VITE_SUPABASE_ANON_KEY',
  },
  data: { provider: 'supabase', url: '', inheritFromAuth: true },
  storage: { provider: 'supabase', url: '', inheritFromAuth: true },
  requiredEnvVars: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
  docsUrl: 'https://supabase.com/docs/guides/self-hosting',
};
