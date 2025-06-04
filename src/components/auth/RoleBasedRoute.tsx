
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import { useCurrentUserRoles } from '@/hooks/useUserRoles';
import { DEV_MODE } from '@/config/constants';

interface RoleBasedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
  publicInDev?: boolean;
}

const RoleBasedRoute = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true,
  publicInDev = false 
}: RoleBasedRouteProps) => {
  const { isAuthenticated, user, loading } = useKeycloakAuth();
  const { hasAnyRole, isLoading: rolesLoading } = useCurrentUserRoles();
  const location = useLocation();

  // In dev mode, some routes can be public
  if (DEV_MODE && publicInDev) {
    return <>{children}</>;
  }

  if (loading || rolesLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-adrar-50 to-terracotta-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500 mx-auto mb-4"></div>
          <p className="text-adrar-700">Chargement...</p>
        </div>
      </div>
    );
  }

  // Check if authentication is required
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
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
            <h1 className="text-2xl font-bold text-red-600 mb-2">Accès refusé</h1>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Rôles requis: {allowedRoles.join(', ')}
            </p>
            <button 
              onClick={() => window.history.back()}
              className="bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
