import { useState, useEffect } from 'react';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import { UserRole } from '@/domain/entities/UserRoleSomelec';
import { UserDTO } from '@/dtos/entities/UserDTO';

type AppRole = 'admin' | 'manager' | 'editor' | 'viewer';

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  role?: AppRole;
  phone?: string;
  national_id?: string;
  avatar_url?: string;
}

interface UserRolesResult {
  userRoles: AppRole[];
  hasRole: (roleName: AppRole) => boolean;
  hasAnyRole: (roleNames: AppRole[]) => boolean;
  isAuthenticated: boolean;
  currentUser: UserDTO | null;
}

export const useCurrentUserRoles = (): UserRolesResult => {
  const { profile, isAuthenticated } = useKeycloakAuth();
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);

  const isAppRole = (role: string): role is AppRole => {
    return ['admin', 'manager', 'editor', 'viewer'].includes(role);
  };

  useEffect(() => {
    const roles = profile?.role ? 
      [isAppRole(profile.role) ? profile.role : 'viewer'] : 
      ['viewer'];
    setUserRoles(roles);
  }, [profile?.role]);

  const hasRole = (roleName: AppRole) => {
    return userRoles.includes(String(roleName).toLowerCase() as AppRole);
  };

  const hasAnyRole = (roleNames: AppRole[]): boolean => {
    if (userRoles.length === 0) return false;
    const wanted = roleNames.map((r) => String(r).toLowerCase() as AppRole);
    return wanted.some((role) => userRoles.includes(role));
  };

  const currentUser: UserDTO | null = profile ? {
    id: profile.id,
    email: profile.email || '',
    fullName: profile.full_name || '',
    primaryRole: profile.role || 'user',
    phone: profile.phone || undefined,
    nationalId: profile.national_id || undefined,
    avatarUrl: profile.avatar_url || undefined,
    isActive: true,
    userRoles: profile.role ? [profile.role] : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } : null;

  return {
    userRoles,
    hasRole,
    hasAnyRole,
    isAuthenticated,
    currentUser,
  };
};
