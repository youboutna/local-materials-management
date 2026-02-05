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

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  national_id?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  phone?: string;
  national_id?: string;
  avatar_url?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  two_factor_enabled?: boolean;
  last_login?: string;
  last_password_change?: string;
  failed_login_attempts?: number;
  locked_until?: string;
  created_at: string;
  updated_at: string;
  // Extended fields for compatibility
  role?: string;
  metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

export interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  user: AuthUser;
  provider?: string;
}

export type UnifiedUser = AuthUser;
export type UnifiedSession = AuthSession;

export interface UnifiedAuthContextType {
  user: UnifiedUser | null;
  session: UnifiedSession | null;
  loading: boolean;
  isAuthenticated: boolean;
  currentProvider: string;
  supportedProviders: Array<{ value: string; label: string; description?: string }>;
  switchProvider: (config: { provider: string }) => Promise<void>;
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
