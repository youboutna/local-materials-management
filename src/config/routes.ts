/**
 * Constantes de routes applicatives.
 * Aucune redirection ne doit être écrite en dur dans les composants.
 */

export const ROUTES = {
  home: '/',
  auth: '/auth',
  authCallback: '/auth/callback',
  register: '/auth?mode=register',
  supplierRegister: '/fournisseur/register',
  supplierPortal: '/supplier-portal',
  consultantPortal: '/consultant-portal',
  dashboard: '/dashboard',
  pendingValidation: '/fournisseur/validation-en-cours',
  contact: '/contact',
} as const;

/** Clé de mémorisation de l'URL demandée avant redirection vers /auth. */
export const REDIRECT_AFTER_LOGIN_KEY = 'redirectAfterLogin';

/** Mémorise l'URL cible avant d'envoyer l'utilisateur sur /auth. */
export function rememberRedirectAfterLogin(url: string): void {
  try {
    if (!url || url.startsWith(ROUTES.auth)) return;
    sessionStorage.setItem(REDIRECT_AFTER_LOGIN_KEY, url);
  } catch {
    /* sessionStorage indisponible */
  }
}

/** Lit et consomme l'URL mémorisée. */
export function consumeRedirectAfterLogin(): string | null {
  try {
    const value = sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
    if (value) sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
    return value;
  } catch {
    return null;
  }
}
