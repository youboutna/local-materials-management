import { useState, useEffect } from 'react';
import { useKeycloakAuth } from '@/contexts/KeycloakAuthContext';
import { User, UserRoleEntity, SomelecRole } from '@/domain/entities/User';
import { UserDTO, UserRoleDTO } from '@/dtos/entities/UserDTO';

interface UserProfile {
  id: string;
  email?: string;
  full_name?: string;
  role?: string;
  phone?: string;
  national_id?: string;
  avatar_url?: string;
}

interface UserRolesResult {
  userRoles: SomelecRole[];
  hasRole: (roleName: SomelecRole) => boolean;
  hasAnyRole: (roleNames: SomelecRole[]) => boolean;
  isAuthenticated: boolean;
  currentUser: UserDTO | null;
}

export const useCurrentUserRoles = (): UserRolesResult => {
  const { profile, isAuthenticated } = useKeycloakAuth();
  const [userRoles, setUserRoles] = useState<SomelecRole[]>([]);

  const isAppRole = (role: string): role is SomelecRole => {
    return ['admin', 'manager', 'editor', 'viewer'].includes(role);
  };

  useEffect(() => {
    const roles = profile?.role ? 
      [isAppRole(profile.role) ? profile.role : 'viewer'] : 
      ['viewer'];
    setUserRoles(roles);
  }, [profile?.role]);

  const hasRole = (roleName: SomelecRole) => {
    return userRoles.includes(roleName);
  };

  const hasAnyRole = (roleNames: SomelecRole[]): boolean => {
    if (userRoles.length === 0) return false;
    return roleNames.some((role) => userRoles.includes(role));
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
    userRoles: profile.role ? [{ 
      id: '', 
      userId: profile.id, 
      roleName: profile.role as SomelecRole, 
      status: 'active' as any, 
      assignedAt: new Date().toISOString(), 
      assignedBy: '', 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    }] : [],
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
