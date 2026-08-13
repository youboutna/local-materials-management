// config.ts

interface Env {
  VITE_KEYCLOAK_URL: string;
  VITE_KEYCLOAK_REALM: string;
  VITE_KEYCLOAK_CLIENT_ID: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

// Keycloak n'est utilisé que si le provider d'auth est explicitement keycloak :
// inutile de polluer la console avec des warnings en mode Supabase.
const KEYCLOAK_ENABLED = import.meta.env.VITE_AUTH_PROVIDER === 'keycloak';

function getEnvVariable(name: keyof Env, requiredWhen = true): string {
  const value = import.meta.env[name];
  if (!value && requiredWhen) {
    console.warn(`⚠️ Missing environment variable: ${name}`);
  }
  return value || '';
}

export const keycloakConfig = {
  url: getEnvVariable("VITE_KEYCLOAK_URL", KEYCLOAK_ENABLED) || 'http://localhost:8080',
  realm: getEnvVariable("VITE_KEYCLOAK_REALM", KEYCLOAK_ENABLED) || 'etr-ml',
  clientId: getEnvVariable("VITE_KEYCLOAK_CLIENT_ID", KEYCLOAK_ENABLED) || 'etr-ml-frontend',
};


export const supabaseConfig = {
  SUPABASE_URL: getEnvVariable("VITE_SUPABASE_URL"),
  SUPABASE_PUBLISHABLE_KEY: getEnvVariable("VITE_SUPABASE_PUBLISHABLE_KEY")
};
