
import { ReactNode, useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { DEV_MODE } from '@/config/constants';
import { useLanguage } from '@/contexts/LanguageContext';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  disallowedRoles?: string[];
  requireAuth?: boolean;
  publicInDev?: boolean;
}

const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  disallowedRoles = [],
  requireAuth = true,
  publicInDev = false 
}: RoleBasedRouteProps) => {
  const { t } = useLanguage();
  const { isAuthenticated, user, loading } = useKeycloakAuth();
  const { hasAnyRole, isLoading: rolesLoading } = useCurrentUserRoles();
  const location = useLocation();

  // Track initial resolution to avoid blocking UI on refocus
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!loading && !rolesLoading) {
      initializedRef.current = true;
    }
  }, [loading, rolesLoading]);

  // In dev mode, allow access to all pages if DEV_MODE is true
  if (DEV_MODE) {
    return <>{children}</>;
  }

  // Show loader only before first resolution; avoid blocking on later refetches
  if (!initializedRef.current && (loading || rolesLoading)) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-adrar-50 to-terracotta-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500 mx-auto mb-4"></div>
          <p className="text-adrar-700">{t("role_based_route.loading")}</p>
        </div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    // If auth state not yet stabilized, avoid hard redirect; keep current UI
    if (!initializedRef.current) {
      return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-adrar-50 to-terracotta-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500 mx-auto mb-4"></div>
            <p className="text-adrar-700">{t("role_based_route.loading")}</p>
          </div>
        </div>
      );
    }
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Admin/Director override - always allow access
  if (isAuthenticated && hasAnyRole(['admin','director'])) {
    return <>{children}</>;
  }

  // Check roles if specified
  if (disallowedRoles.length > 0 && isAuthenticated) {
    const isBlocked = hasAnyRole(disallowedRoles);
    if (isBlocked) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-adrar-50 to-terracotta-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-8 bg-white rounded-xl shadow-elegant">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">{t("role_based_route.denied_title")}</h1>
            <p className="text-gray-600 mb-6">
              {t("role_based_route.denied_desc")}
            </p>
            <button 
              onClick={() => window.history.back()}
              className="bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {t("role_based_route.back")}
            </button>
          </div>
        </div>
      );
    }
  }

  // Check roles if specified
  if (allowedRoles.length > 0 && isAuthenticated) {
    const hasRequiredRole = hasAnyRole(allowedRoles);
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-adrar-50 to-terracotta-50 flex items-center justify-center">
          <div className="max-w-md mx-auto text-center p-8 bg-white rounded-xl shadow-elegant">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">{t("role_based_route.denied_title")}</h1>
            <p className="text-gray-600 mb-6">
              {t("role_based_route.denied_desc")}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {t("role_based_route.required_roles")}: {allowedRoles.join(', ')}
            </p>
            <button 
              onClick={() => window.history.back()}
              className="bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {t("role_based_route.back")}
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
