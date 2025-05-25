
import Keycloak from 'keycloak-js';
import { keycloakConfig } from './config';

// Initialize Keycloak instance
const keycloakInstance = new Keycloak(keycloakConfig);

export const initKeycloak = async () => {
  try {
    // Reduce timeout and add better error handling
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error("Keycloak initialization timed out")), 5000); // Reduced from 10s to 5s
    });

    const initPromise = keycloakInstance.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      checkLoginIframe: false, // Disable iframe check to prevent timeout issues
      enableLogging: false, // Disable logging to reduce noise
    });
    
    const auth = await Promise.race([
      initPromise,
      timeoutPromise
    ]) as boolean;
    
    console.log('Keycloak initialization', auth ? 'authenticated' : 'not authenticated');
    return auth;
  } catch (error) {
    console.error('Keycloak initialization error:', error);
    // Return false instead of throwing to allow graceful fallback
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

export const login = () => {
  try {
    return keycloakInstance.login();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  try {
    return keycloakInstance.logout();
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

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
