// config.ts

interface Env {
  VITE_KEYCLOAK_URL: string;
  VITE_KEYCLOAK_REALM: string;
  VITE_KEYCLOAK_CLIENT_ID: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

// Optionnel : valider que les variables sont bien présentes (en dev surtout)
function getEnvVariable(name: keyof Env): string {
  const value = import.meta.env[name];
  if (!value) {
    console.warn(`⚠️ Missing environment variable: ${name}`);
  }
  return value || '';
}

export const keycloakConfig = {
  url: getEnvVariable("VITE_KEYCLOAK_URL") || 'http://localhost:8080',
  realm: getEnvVariable("VITE_KEYCLOAK_REALM") || 'etr-ml',
  clientId: getEnvVariable("VITE_KEYCLOAK_CLIENT_ID") || 'etr-ml-frontend',
};

export const supabaseConfig = {
  SUPABASE_URL: getEnvVariable("VITE_SUPABASE_URL"),
  SUPABASE_PUBLISHABLE_KEY: getEnvVariable("VITE_SUPABASE_PUBLISHABLE_KEY")
};
