
import Keycloak from 'keycloak-js';
import { keycloakConfig } from './config';

// Initialize Keycloak instance
const keycloakInstance = new Keycloak(keycloakConfig);

export const initKeycloak = async () => {
  try {
    const auth = await keycloakInstance.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
    });
    
    console.log('Keycloak initialization', auth ? 'authenticated' : 'not authenticated');
    return auth;
  } catch (error) {
    console.error('Keycloak initialization error:', error);
    return false;
  }
};

export const getToken = () => keycloakInstance.token;

export const refreshToken = async () => {
  try {
    const refreshed = await keycloakInstance.updateToken(5);
    console.log('Token refreshed:', refreshed);
    return refreshed;
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return keycloakInstance.logout();
  }
};

export const login = keycloakInstance.login;
export const logout = keycloakInstance.logout;
export const isAuthenticated = () => !!keycloakInstance.token;
export const getUsername = () => keycloakInstance.tokenParsed?.preferred_username;
export const getRoles = () => {
  return keycloakInstance.tokenParsed?.realm_access?.roles || [];
};
export const getUserInfo = () => ({
  username: keycloakInstance.tokenParsed?.preferred_username,
  email: keycloakInstance.tokenParsed?.email,
  firstName: keycloakInstance.tokenParsed?.given_name,
  lastName: keycloakInstance.tokenParsed?.family_name,
  roles: keycloakInstance.tokenParsed?.realm_access?.roles || [],
});

export const keycloak = keycloakInstance;

export default {
  initKeycloak,
  getToken,
  refreshToken,
  login,
  logout,
  isAuthenticated,
  getUsername,
  getRoles,
  getUserInfo,
  keycloak: keycloakInstance,
};
