
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import { DEV_MODE } from '@/config/constants';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute = ({ children, requiredRoles = [] }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useKeycloakAuth();
  const location = useLocation();

  // In dev mode, we'll always render the children to bypass authentication checks
  if (DEV_MODE) {
    return <>{children}</>;
  }

  if (loading) {
    // Display a loading spinner while checking authentication
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    // Use a direct redirection for better security
    // This helps prevent cross-origin issues with React Router
    window.location.href = '/auth';
    return null;
  }

  // Check for required roles if specified
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => user.roles.includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Accès refusé</h1>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
            </p>
          </div>
        </div>
      );
    }
  }

  // Authenticated and has required roles (if any)
  return <>{children}</>;
};

export default ProtectedRoute;
