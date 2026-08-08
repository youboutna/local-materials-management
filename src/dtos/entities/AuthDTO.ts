/**
 * Authentication DTOs
 * Data Transfer Objects for authentication operations
 * Used by UI components and authentication services
 */

export interface LoginData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  fullName?: string;
  phone?: string;
  nationalId?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  lastLogin?: string;
  lastPasswordChange?: string;
  failedLoginAttempts?: number;
  lockedUntil?: string;
  createdAt: string;
  updatedAt: string;
  // Extended fields for compatibility
  role?: string;
  metadata?: Record<string, unknown>;
  userMetadata?: Record<string, unknown>;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  expiresIn?: number;
  tokenType: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
  lastActivity?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  department?: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
  joinedAt: string;
  lastLogin?: string;
  preferences?: Record<string, unknown>;
  isActive: boolean;
}

export interface UserRoleType {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isActive: boolean;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface UnifiedUser {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  nationalId?: string;
  role?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
  // Optional fields for compatibility
  createdAt?: string;
  updatedAt?: string;
}

export interface UnifiedSession {
  user: UnifiedUser;
  expiresAt?: string;
  provider?: string;
  accessToken?: string;
}

export interface UnifiedAuthContextType {
  user: UnifiedUser | null;
  session: UnifiedSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  currentProvider: string;
  supportedProviders: Array<{ value: string; label: string; description?: string }>;
  switchProvider: (config: { provider: string; url?: string; clientId?: string; realm?: string; redirectUri?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string, nationalId: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneOTP: (phone: string, token: string) => Promise<void>;
  signInWithNationalId: (nationalId: string, password: string) => Promise<void>;
  isDevelopmentMode: boolean;
  // Legacy compatibility
  login?: (email: string, password: string) => Promise<void>;
  logout?: () => Promise<void>;
  updateProfile?: (data: Partial<UnifiedUser>) => Promise<void>;
}

export interface AuthResponse {
  user: AuthUser | null;
  session: AuthSession | null;
}
// Moved from src/hooks/useUserRoles.ts
export interface UserRole {
  id: string;
  roleName: string;
  permissions?: Record<string, boolean>;
  createdAt?: string;
  updatedAt?: string;
}

// Moved from src/infrastructure/local/LocalAuthAdapter.ts
export interface PersistedDevSession {
  v?: number;
  userId: string;
  roleKey: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}