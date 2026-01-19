import { useState, useEffect } from 'react';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';

export const useCurrentUserRoles = () => {
  const { profile, isAuthenticated } = useKeycloakAuth();
  const [userRoles, setUserRoles] = useState<string[]>([]);

  useEffect(() => {
    // Get roles from profile or use defaults
    const roles = profile?.role ? [String(profile.role).toLowerCase()] : ['viewer'];
    setUserRoles(roles);
  }, [profile?.role]);

  const hasRole = (roleName: string) => {
    return userRoles.includes(String(roleName).toLowerCase());
  };

  const hasAnyRole = (roleNames: string[]) => {
    if (userRoles.length === 0) return false;
    const wanted = roleNames.map((r) => String(r).toLowerCase());
    return wanted.some((role) => userRoles.includes(role));
  };

  return {
    userRoles,
    hasRole,
    hasAnyRole,
    isAuthenticated,
    currentUser: profile
  };
};
