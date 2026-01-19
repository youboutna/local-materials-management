/**
 * Authentication Types - Domain Layer
 * Core authentication types for the application
 */

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    role?: string;
    phone?: string;
    national_id?: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at?: string;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in?: number;
  token_type: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export interface AuthPermissions {
  canAccessDashboard: boolean;
  canManageProjects: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageMaterials: boolean;
}

export interface AuthRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuthProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  national_id: string;
  role: string;
  avatar_url: string | null;
  created_at: string;
  updated_at?: string;
}

export type AuthEvent = 
  | 'INITIAL_SESSION'
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY';

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}
