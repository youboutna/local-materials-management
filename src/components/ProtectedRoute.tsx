
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/hexagonal/useAuth';
import { T } from '@/components/i18n/T';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute = ({ children, requiredRoles = [] }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // DEV_MODE no longer bypasses authentication. Users must sign in via /auth
  // with credentials matching DEV_USERS (see src/config/constants.ts).

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
    const hasRequiredRole = requiredRoles.some(role => (user.roles ?? []).includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-2"><T k="auto.protectedroute.acces_refuse" fallback="Accès refusé" /></h1>
            <p className="text-muted-foreground mb-6">
              <T k="auto.protectedroute.vous_n_avez_pas_les_autorisations_necessaires_po" fallback="Vous n'avez pas les autorisations nécessaires pour accéder à cette page." />
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
