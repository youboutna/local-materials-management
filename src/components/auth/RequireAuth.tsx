/**
 * RequireAuth — garde d'accès unifiée (niveaux 2 et 3).
 * Niveau 2 : utilisateur connecté requis.
 * Niveau 3 : rôles requis, résolus via le référentiel des rôles.
 */
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { logger } from '@/application/services/LoggerService';
import { ROUTES, rememberRedirectAfterLogin } from '@/config/routes';
import { matchesRequiredRoles } from '@/config/referentials/auth/roles-responsibilities.referential';
import AccessRestrictedMessage from '@/components/auth/AccessRestrictedMessage';

interface RequireAuthProps {
  children: ReactNode;
  /** Rôles autorisés. Vide = tout utilisateur connecté. */
  requiredRoles?: string[];
  /** Rediriger immédiatement vers /auth sans afficher le message. */
  silentRedirect?: boolean;
}

const RequireAuth = ({ children, requiredRoles = [], silentRedirect = false }: RequireAuthProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { userRoles, isLoading: rolesLoading } = useCurrentUserRoles();
  const location = useLocation();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const resolved = useRef(false);
  useEffect(() => {
    if (!loading && !rolesLoading) resolved.current = true;
  }, [loading, rolesLoading]);

  const targetUrl = `${location.pathname}${location.search}${location.hash}`;

  const effectiveRoles = useMemo(
    () => [
      ...((userRoles ?? []) as unknown as string[]),
      ...((user?.roles ?? []) as string[]),
      ...(user?.role ? [String(user.role)] : []),
    ],
    [userRoles, user?.roles, user?.role]
  );

  const unauthenticated = resolved.current && (!isAuthenticated || !user);

  useEffect(() => {
    if (!unauthenticated) return;
    rememberRedirectAfterLogin(targetUrl);
    logger.warning('system', 'Accès refusé : utilisateur non authentifié', undefined, { path: location.pathname });
    if (silentRedirect) setShouldRedirect(true);
  }, [unauthenticated, targetUrl, silentRedirect, location.pathname]);

  const handleRedirect = useCallback(() => setShouldRedirect(true), []);

  if (!resolved.current && (loading || rolesLoading)) {
    return (
      <div className="flex items-center justify-center h-screen" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (unauthenticated) {
    if (shouldRedirect || silentRedirect) {
      return <Navigate to={ROUTES.auth} state={{ from: location }} replace />;
    }
    return <AccessRestrictedMessage variant="auth" onRedirect={handleRedirect} />;
  }

  if (requiredRoles.length > 0 && !matchesRequiredRoles(effectiveRoles, requiredRoles)) {
    logger.warning('system', 'Accès refusé : rôle insuffisant', undefined, { path: location.pathname });
    return <AccessRestrictedMessage variant="forbidden" countdownSeconds={0} />;
  }

  return <>{children}</>;
};

export default RequireAuth;
