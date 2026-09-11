import type { DeploymentProfile } from './types';

export const LOCAL_BYPASS_PROFILE: DeploymentProfile = {
  id: 'local-bypass',
  label: 'Mode Local (offline)',
  description: 'Développement hors ligne avec utilisateurs mockés, aucun appel réseau.',
  icon: '💻',
  difficulty: 'easy',
  recommended: false,
  auth: { provider: 'local', url: '', requiresKey: false },
  data: { provider: 'local', url: '' },
  storage: { provider: 'local', url: '' },
  requiredEnvVars: [],
};
