
export const keycloakConfig = {
  url: import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KEYCLOAK_REALM || 'etr-ml',
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'etr-ml-frontend',
};
